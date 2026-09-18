import { motion } from "framer-motion";

/**
 * UGFBadge — Reusable "Powered by UGF" branding component
 * Displays gasless transaction badges in various sizes/styles
 */
export function UGFBadge({ size = "sm" }) {
  return (
    <motion.span
      className="badge-ugf"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <span>⚡</span>
      <span>{size === "lg" ? "Powered by UGF" : "UGF"}</span>
    </motion.span>
  );
}

export function NoEthBadge() {
  return (
    <motion.span
      className="badge-success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <span>✅</span>
      <span>No ETH Required</span>
    </motion.span>
  );
}

export function GaslessBadge() {
  return (
    <motion.span
      className="badge-gold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <span>🔥</span>
      <span>Gasless Transaction</span>
    </motion.span>
  );
}

/**
 * VerifiedBadge — Highlights that a certificate is instantly checkable on-chain.
 * This is the primary trust signal of the app; gasless badges above are a secondary perk.
 */
export function VerifiedBadge() {
  return (
    <motion.span
      className="badge-success"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <span>✅</span>
      <span>Instantly Verifiable</span>
    </motion.span>
  );
}

/**
 * UGFBanner — Full-width banner showing UGF status and links
 */
export function UGFBanner() {
  return (
    <motion.div
      className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-lg">
          ⚡
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Powered by Universal Gas Framework</p>
          <p className="text-xs text-slate-400">Instantly verifiable on Base Sepolia · gasless minting included</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <UGFBadge size="lg" />
        <NoEthBadge />
        <GaslessBadge />
      </div>
    </motion.div>
  );
}

export default UGFBadge;
