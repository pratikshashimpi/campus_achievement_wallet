import { motion, AnimatePresence } from "framer-motion";
import { UGFBadge, NoEthBadge, GaslessBadge, VerifiedBadge } from "./UGFBadge";
import { useMintNFT } from "../hooks/useMintNFT";
import { useWallet } from "../context/WalletContext";
import { useAchievement } from "../context/AchievementContext";
import SuccessScreen from "./SuccessScreen";

/**
 * ClaimModal — Opens when student clicks "Claim NFT"
 * Shows achievement details → triggers UGF gasless transaction
 */
export default function ClaimModal({ achievement, onClose }) {
  const { isConnected, connectWallet, isCorrectChain, switchToBaseSepolia } = useWallet();
  const { isClaimed } = useAchievement();
  const { mintNFT, isMinting, mintResult, mintError, resetMint } = useMintNFT();

  const alreadyClaimed = isClaimed(achievement.id);

  const handleClaim = async () => {
    if (!isConnected) { await connectWallet(); return; }
    if (!isCorrectChain) { await switchToBaseSepolia(); return; }
    await mintNFT(achievement);
  };

  const handleClose = () => {
    resetMint();
    onClose();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-lg glass-card p-0 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Success screen inside modal */}
          {mintResult && (
            <SuccessScreen
              mintResult={mintResult}
              achievement={achievement}
              onClose={handleClose}
            />
          )}

          {!mintResult && (
            <>
              {/* Header gradient */}
              <div className={`h-2 w-full bg-gradient-to-r ${achievement.gradient}`} />

              <div className="p-6">
                {/* Close */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  ✕
                </button>

                {/* Achievement preview */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shrink-0"
                    style={{ background: `${achievement.color}20`, border: `1px solid ${achievement.color}40` }}
                  >
                    {achievement.image}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{achievement.type}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-tight mb-1">
                      {achievement.title}
                    </h2>
                    <p className="text-sm text-slate-400">{achievement.issuerName} · {achievement.eventName}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                  {achievement.description}
                </p>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="glass p-3 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Rarity</p>
                    <p className="text-sm font-semibold text-white">{achievement.rarity || "Common"}</p>
                  </div>
                  <div className="glass p-3 rounded-xl">
                    <p className="text-xs text-slate-500 mb-1">Points</p>
                    <p className="text-sm font-semibold gradient-text-gold">⭐ {achievement.points}</p>
                  </div>
                </div>

                {/* UGF Info box */}
                <div className="glass rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-slate-300 mb-2">⚡ Transaction Details</p>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Network</span>
                      <span className="text-indigo-400 font-medium">Base Sepolia</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Payment</span>
                      <span className="text-emerald-400 font-medium">TYI_MOCK_USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETH Required</span>
                      <span className="text-emerald-400 font-medium">❌ None</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gas Sponsor</span>
                      <span className="text-purple-400 font-medium">UGF Protocol</span>
                    </div>
                  </div>
                </div>

                {/* Badges — verification first, gasless as a secondary perk */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <VerifiedBadge />
                  <UGFBadge size="lg" />
                  <NoEthBadge />
                </div>

                {/* Error */}
                {mintError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                  >
                    ⚠️ {mintError}
                  </motion.div>
                )}

                {/* Already claimed */}
                {alreadyClaimed ? (
                  <div className="w-full py-3 rounded-xl text-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                    ✅ Already Claimed
                  </div>
                ) : (
                  <motion.button
                    id="modal-claim-nft-btn"
                    onClick={handleClaim}
                    disabled={isMinting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full btn-primary py-3.5 text-base font-bold relative overflow-hidden"
                  >
                    {isMinting ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Minting via UGF…</span>
                      </span>
                    ) : !isConnected ? (
                      "🦊 Connect Wallet to Claim"
                    ) : !isCorrectChain ? (
                      "⚠️ Switch to Base Sepolia"
                    ) : (
                      "🎓 Claim Certificate"
                    )}
                  </motion.button>
                )}

                <p className="text-center text-xs text-slate-500 mt-3">
                  Instantly verifiable on-chain · No ETH required
                </p>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
