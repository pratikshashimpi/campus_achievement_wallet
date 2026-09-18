import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { ethers } from "ethers";

import {
  CHAIN_ID,
  NETWORK_NAME,
  EXPLORER_URL,
} from "../config/contract";

const WalletContext = createContext(null);

const BASE_SEPOLIA = {
  chainId: `0x${CHAIN_ID.toString(16)}`,

  chainName: "Base Sepolia Testnet",

  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },

  rpcUrls: ["https://sepolia.base.org"],

  blockExplorerUrls: [EXPLORER_URL],
};

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [error, setError] = useState(null);

  const [balance, setBalance] = useState("0");

  const isCorrectChain = chainId === CHAIN_ID;

  // Update Balance
  const updateBalance = useCallback(async (prov, addr) => {
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch {
      // silent
    }
  }, []);

  // Connect Wallet
  const connectWallet = useCallback(async (options = {}) => {
    if (!window.ethereum) {
      setError("MetaMask not found.");
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Force account selection screen if requested or if we have an explicit switch/disconnect flag
      const forceSelect = options.forceSelect || localStorage.getItem("forceWalletSelect") === "true";

      if (forceSelect) {
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (permErr) {
          console.warn("Account selection rejected:", permErr);
          return false;
        } finally {
          // Always clear the flag once permission request is attempted
          localStorage.removeItem("forceWalletSelect");
        }
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const prov = new ethers.BrowserProvider(window.ethereum);

      const sign = await prov.getSigner();

      const network = await prov.getNetwork();

      const addr = accounts[0];

      setProvider(prov);
      setSigner(sign);
      setAddress(addr);

      setChainId(Number(network.chainId));

      setIsConnected(true);

      await updateBalance(prov, addr);

      // SAVE SESSION
      localStorage.setItem("walletConnected", "true");

      return true;
    } catch (err) {
      setError(err.message || "Failed to connect wallet.");
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [updateBalance]);

  // Disconnect Wallet
  const disconnectWallet = useCallback(() => {
    // REMOVE SESSION
    localStorage.removeItem("walletConnected");
    localStorage.setItem("forceWalletSelect", "true"); // Force account selection on next manual connect

    setAddress(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);

    setIsConnected(false);

    setBalance("0");

    setError(null);
  }, []);

  // Auto Restore ONLY IF USER PREVIOUSLY CONNECTED
  useEffect(() => {
    const restoreConnection = async () => {
      const wasConnected =
        localStorage.getItem("walletConnected");

      if (!wasConnected) return;

      if (!window.ethereum) return;

      setIsConnecting(true);

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length === 0) {
          setIsConnecting(false);
          return;
        }

        const prov = new ethers.BrowserProvider(
          window.ethereum
        );

        const sign = await prov.getSigner();

        const network = await prov.getNetwork();

        const addr = accounts[0];

        setProvider(prov);
        setSigner(sign);

        setAddress(addr);

        setChainId(Number(network.chainId));

        setIsConnected(true);

        await updateBalance(prov, addr);
      } catch {
        // silent
      } finally {
        setIsConnecting(false);
      }
    };

    restoreConnection();
  }, [updateBalance]);

  // Switch Network
  const switchToBaseSepolia = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",

        params: [{ chainId: BASE_SEPOLIA.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",

            params: [BASE_SEPOLIA],
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  }, []);

  // Listen Wallet Changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chain) => {
      setChainId(Number(chain));

      window.location.reload();
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [disconnectWallet]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const value = {
    address,
    signer,
    provider,
    chainId,

    isConnected,
    isConnecting,

    error,
    balance,

    shortAddress,

    isCorrectChain,

    connectWallet,
    disconnectWallet,
    switchToBaseSepolia,

    CHAIN_ID,
    NETWORK_NAME,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);

  if (!ctx) {
    throw new Error(
      "useWallet must be used within WalletProvider"
    );
  }

  return ctx;
}

export default WalletContext;