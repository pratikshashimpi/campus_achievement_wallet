import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useUGFModal } from "@tychilabs/react-ugf";
import { CONTRACT_ADDRESS, CONTRACT_ABI, CHAIN_ID } from "../config/contract";
import { useWallet } from "../context/WalletContext";
import { useAchievement } from "../context/AchievementContext";
import toast from "react-hot-toast";

export function useMintNFT() {
  const { signer, address, isConnected } = useWallet();
  const { saveMintedNFT } = useAchievement();
  const { openUGF, result: ugfResult } = useUGFModal();

  const [activeAchievement, setActiveAchievement] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState(null);
  const [mintError, setMintError] = useState(null);

  const processedTxHashesRef = useRef(new Set());
  const ignoredTxHashRef = useRef(null);
  const mintSessionActiveRef = useRef(false);

  const buildTokenURI = useCallback((achievement, studentAddr) => {
    const svgCard = generateCertificateSVG(achievement, studentAddr);
    const svgBase64 = btoa(unescape(encodeURIComponent(svgCard)));

    const metadata = {
      name: achievement.title,
      description: achievement.description || achievement.title,
      image: `data:image/svg+xml;base64,${svgBase64}`,
      attributes: [
        { trait_type: "Type", value: achievement.type },
        { trait_type: "Issuer", value: achievement.issuerName },
        {
          trait_type: "Event",
          value: achievement.eventName || achievement.title,
        },
        { trait_type: "Rarity", value: achievement.rarity || "Common" },
        { trait_type: "Points", value: achievement.points || 0 },
        { trait_type: "Network", value: "Base Sepolia" },
        { trait_type: "Gas Method", value: "UGF Gasless" },
        { trait_type: "Issued Date", value: new Date().toISOString() },
      ],
    };

    return `data:application/json;base64,${btoa(
      unescape(encodeURIComponent(JSON.stringify(metadata)))
    )}`;
  }, []);

  const waitForBaseSepoliaReceipt = useCallback(async (txHash) => {
    const rpcProvider = new ethers.JsonRpcProvider("https://sepolia.base.org");

    let receipt = null;

    for (let i = 0; i < 40; i++) {
      receipt = await rpcProvider.getTransactionReceipt(txHash);

      if (receipt) {
        return receipt;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(
      "Transaction submitted, but confirmation is taking longer. Please refresh once."
    );
  }, []);

  const mintNFT = useCallback(
    async (achievement) => {
      if (!isConnected || !signer) {
        setMintError("Please connect your wallet first.");
        return;
      }

      setMintError(null);
      setMintResult(null);

      try {
        if (
          !achievement.studentWalletAddress ||
          achievement.studentWalletAddress.toLowerCase() !==
            address.toLowerCase()
        ) {
          throw new Error("This certificate is not assigned to your wallet.");
        }

        if (achievement.claimed) {
          throw new Error("This certificate has already been claimed.");
        }

        ignoredTxHashRef.current = ugfResult?.txHash || null;
        mintSessionActiveRef.current = true;

        const iface = new ethers.Interface(CONTRACT_ABI);

        const calldata = iface.encodeFunctionData("mintAchievement", [
          address,
          buildTokenURI(achievement, address),
          achievement.title,
          achievement.type,
          achievement.issuerName,
          achievement.eventName || achievement.title,
        ]);

        setActiveAchievement(achievement);
        setIsMinting(true);

        toast.loading("Processing gasless transaction via UGF...", {
          id: "ugf-mint-confirm",
        });

        await openUGF({
          signer,
          tx: {
            to: CONTRACT_ADDRESS,
            data: calldata,
            value: 0n,
          },
          destChainId: String(CHAIN_ID),
        });
      } catch (err) {
        console.error("Mint start error:", err);

        setMintError(err?.message || "Failed to start mint transaction.");

        toast.error(err?.message || "Failed to start mint transaction.", {
          id: "ugf-mint-confirm",
        });

        setIsMinting(false);
        setActiveAchievement(null);
        mintSessionActiveRef.current = false;
      }
    },
    [
      isConnected,
      signer,
      address,
      ugfResult?.txHash,
      openUGF,
      buildTokenURI,
    ]
  );

  useEffect(() => {
    const txHash = ugfResult?.txHash;

    if (!mintSessionActiveRef.current) return;
    if (!txHash) return;
    if (!activeAchievement) return;
    if (!signer) return;

    if (txHash === ignoredTxHashRef.current) return;

    if (processedTxHashesRef.current.has(txHash)) return;

    processedTxHashesRef.current.add(txHash);

    let mounted = true;

    const finalizeClaim = async () => {
      toast.loading("Waiting for Base Sepolia confirmation...", {
        id: "ugf-mint-confirm",
      });

      try {
        const receipt = await waitForBaseSepoliaReceipt(txHash);

        if (!receipt || receipt.status !== 1) {
          throw new Error("Transaction failed or was reverted.");
        }

        let tokenId = Date.now().toString();

        try {
          const iface = new ethers.Interface(CONTRACT_ABI);

          for (const log of receipt.logs || []) {
            try {
              const parsed = iface.parseLog(log);

              if (parsed?.args?.tokenId) {
                tokenId = parsed.args.tokenId.toString();
                break;
              }
            } catch {
              // Ignore unrelated logs
            }
          }
        } catch {
          // Fallback tokenId already exists
        }

        const mintData = {
          achievementId: activeAchievement.id,
          title: activeAchievement.title,
          type: activeAchievement.type,
          issuerName: activeAchievement.issuerName,
          eventName: activeAchievement.eventName || activeAchievement.title,
          txHash,
          tokenId,
          tokenURI: buildTokenURI(activeAchievement, address),
        };

        if (mounted) {
          await saveMintedNFT(mintData);

          setMintResult({
            ...mintData,
            achievement: activeAchievement,
          });

          toast.success("NFT certificate claimed successfully!", {
            id: "ugf-mint-confirm",
          });
        }
      } catch (err) {
        console.error("Mint finalize error:", err);

        if (mounted) {
          setMintError(err?.message || "Transaction verification failed.");

          toast.error(err?.message || "Transaction failed.", {
            id: "ugf-mint-confirm",
          });
        }
      } finally {
        if (mounted) {
          setIsMinting(false);
          setActiveAchievement(null);
          mintSessionActiveRef.current = false;
          ignoredTxHashRef.current = null;
        }
      }
    };

    finalizeClaim();

    return () => {
      mounted = false;
    };
  }, [
    ugfResult?.txHash,
    activeAchievement,
    signer,
    address,
    buildTokenURI,
    saveMintedNFT,
    waitForBaseSepoliaReceipt,
  ]);

  const resetMint = useCallback(() => {
    setMintResult(null);
    setMintError(null);
    setIsMinting(false);
    setActiveAchievement(null);
    mintSessionActiveRef.current = false;
    ignoredTxHashRef.current = ugfResult?.txHash || null;
  }, [ugfResult?.txHash]);

  return {
    mintNFT,
    isMinting,
    mintResult,
    mintError,
    resetMint,
  };
}

function generateCertificateSVG(achievement, studentAddr) {
  const safeTitle = achievement.title || "Achievement";
  const safeDescription = achievement.description || safeTitle;
  const safeType = achievement.type || "certificate";
  const safeIssuer = achievement.issuerName || "SVKM IoT Dhule";
  const safeEvent = achievement.eventName || safeTitle;
  const safeImage = achievement.image || "🎓";

  const shortAddr = studentAddr
    ? `${studentAddr.slice(0, 8)}...${studentAddr.slice(-6)}`
    : "0x...";

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">
  <rect width="500" height="300" rx="18" fill="#0f172a"/>
  <rect x="10" y="10" width="480" height="280" rx="16" fill="none" stroke="#6366f1" stroke-width="3"/>
  <text x="40" y="80" font-size="46">${safeImage}</text>
  <text x="110" y="70" font-size="22" fill="#ffffff" font-family="Arial" font-weight="700">${safeTitle.slice(
    0,
    32
  )}</text>
  <text x="110" y="98" font-size="13" fill="#a5b4fc" font-family="Arial">${safeType.toUpperCase()} · ${safeEvent.slice(
    0,
    32
  )}</text>
  <line x1="40" y1="125" x2="460" y2="125" stroke="#6366f1"/>
  <text x="40" y="155" font-size="13" fill="#d1d5db" font-family="Arial">${safeDescription.slice(
    0,
    65
  )}</text>
  <text x="40" y="205" font-size="11" fill="#94a3b8" font-family="Arial">Issuer: ${safeIssuer}</text>
  <text x="40" y="230" font-size="11" fill="#94a3b8" font-family="Arial">Wallet: ${shortAddr}</text>
  <text x="40" y="255" font-size="11" fill="#818cf8" font-family="Arial">Network: Base Sepolia · Powered by UGF</text>
</svg>`;
}

export default useMintNFT;