import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { EXPLORER_URL } from "../config/contract";

/**
 * SuccessScreen — Shown inside ClaimModal after successful NFT mint
 * Shows confetti, txHash, NFT preview, and "Minted on Base Sepolia via UGF"
 */
export default function SuccessScreen({ mintResult, achievement, onClose }) {
  const confettiRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    spawnConfetti(confettiRef.current);
  }, []);

  const txHash = mintResult?.txHash || "";
  const tokenId = mintResult?.tokenId || "0";
  const isDemo = txHash.startsWith("demo_");

  const copyTxHash = () => {
    navigator.clipboard.writeText(txHash).catch(() => {});
  };

  const handleGoToDashboard = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <div className="relative overflow-hidden p-6" ref={confettiRef}>
      {/* Glow bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-indigo-500/5 pointer-events-none" />

      {/* Success icon */}
      <motion.div
        className="flex flex-col items-center text-center mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-4xl mb-4">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Achievement Minted!</h2>
        <p className="text-sm text-slate-400">
          Your NFT has been permanently recorded on blockchain
        </p>
      </motion.div>

      {/* NFT Preview card */}
      <motion.div
        className="glass rounded-2xl p-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className={`h-1 w-full bg-gradient-to-r ${achievement.gradient} rounded-full mb-4`} />
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: `${achievement.color}20`, border: `1px solid ${achievement.color}40` }}
          >
            {achievement.image}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{achievement.title}</p>
            <p className="text-xs text-slate-400">{achievement.issuerName}</p>
            <p className="text-xs text-indigo-400 font-mono mt-1">Token #{tokenId}</p>
          </div>
          <span className="badge-success shrink-0">✓ Minted</span>
        </div>
      </motion.div>

      {/* Transaction details */}
      <motion.div
        className="glass rounded-xl p-4 mb-4 space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-semibold text-slate-300 mb-3">🔗 Transaction Receipt</p>

        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Network</span>
          <span className="text-indigo-400 font-medium">Base Sepolia</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Gas Paid</span>
          <span className="text-emerald-400 font-medium">TYI_MOCK_USD (No ETH)</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Sponsor</span>
          <span className="text-purple-400 font-medium">UGF Protocol ⚡</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Status</span>
          <span className="text-emerald-400 font-medium">✅ Confirmed</span>
        </div>

        {/* Tx hash */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-slate-500 mb-1.5">Transaction Hash</p>
          {isDemo ? (
            <p className="text-xs text-slate-400 font-mono italic">Demo mode — deploy contract to see real hash</p>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xs text-indigo-400 font-mono truncate flex-1">
                {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </p>
              <button onClick={copyTxHash} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5">
                Copy
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* UGF success banner */}
      <motion.div
        className="flex items-center justify-center gap-2 mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span className="text-lg">✅</span>
        <div className="text-center">
          <p className="text-xs font-semibold text-indigo-300">Certificate Verified On-Chain</p>
          <p className="text-xs text-slate-400">Minted on Base Sepolia · gas covered automatically via UGF</p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {!isDemo && txHash && (
          <a
            href={`${EXPLORER_URL}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-secondary text-center text-sm py-2.5"
          >
            🔍 View on BaseScan
          </a>
        )}
        <button
          id="success-close-btn"
          onClick={handleGoToDashboard}
          className="flex-1 btn-primary text-sm py-2.5"
        >
          🏠 Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

/** Spawn confetti particles inside a container */
function spawnConfetti(container) {
  if (!container) return;
  const colors = ["#6366f1", "#a855f7", "#f59e0b", "#10b981", "#ec4899", "#3b82f6"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti-particle";
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${1.2 + Math.random() * 1.8}s;
      animation-delay: ${Math.random() * 0.5}s;
      width: ${4 + Math.random() * 8}px;
      height: ${4 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}
