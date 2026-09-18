import { useState } from "react";
import { motion } from "framer-motion";
import { RARITY_COLORS, ACHIEVEMENT_TYPES } from "../config/achievements";
import { EXPLORER_URL } from "../config/contract";

/**
 * NFTCard — Glassmorphism flip card showing achievement front & back
 * Front: image, title, type badge
 * Back: full metadata + blockchain verification link
 */
export default function NFTCard({ achievement, minted = false, txHash, tokenId, mintedAt }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const rarityColor = RARITY_COLORS[achievement.rarity] || "#9ca3af";
  const typeInfo    = ACHIEVEMENT_TYPES[achievement.type] || ACHIEVEMENT_TYPES.badge;

  const formattedDate = mintedAt
    ? (typeof mintedAt === "string"
        ? new Date(mintedAt).toLocaleDateString()
        : mintedAt?.toDate?.()?.toLocaleDateString() ?? "Recently")
    : null;

  return (
    <div
      className="nft-flip-container cursor-pointer"
      style={{ height: "320px" }}
      onClick={() => setIsFlipped(v => !v)}
    >
      <motion.div
        className="nft-flip-inner w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT */}
        <div className="nft-flip-front glass-card overflow-hidden">
          {/* Gradient top bar */}
          <div
            className={`h-1.5 w-full bg-gradient-to-r ${achievement.gradient}`}
          />

          <div className="p-5 flex flex-col h-full">
            {/* Top: emoji + rarity */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                style={{
                  background: `${achievement.color}20`,
                  border: `1px solid ${achievement.color}40`,
                }}
              >
                {achievement.image}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: `${rarityColor}20`,
                    border: `1px solid ${rarityColor}40`,
                    color: rarityColor,
                  }}
                >
                  {achievement.rarity || "Common"}
                </span>
                {minted && (
                  <span className="badge-success">✓ Minted</span>
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="font-bold text-white text-base leading-snug mb-1">
              {achievement.title}
            </h3>
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
              {achievement.description}
            </p>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{typeInfo.icon}</span>
                <span
                  className="text-xs font-medium"
                  style={{ color: typeInfo.color }}
                >
                  {typeInfo.label}
                </span>
              </div>
              {achievement.points && (
                <span className="badge-gold">⭐ {achievement.points} pts</span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-2 text-center">Click to flip ↻</p>
          </div>
        </div>

        {/* BACK */}
        <div
          className="nft-flip-back glass-card overflow-hidden p-5 flex flex-col"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div
            className={`h-1.5 w-full bg-gradient-to-r ${achievement.gradient} mb-4`}
          />

          <h4 className="font-bold text-white text-sm mb-3 gradient-text">
            🔍 NFT Details
          </h4>

          <div className="space-y-2.5 flex-1 text-xs">
            <InfoRow label="Issuer"  value={achievement.issuerName} />
            <InfoRow label="Event"   value={achievement.eventName} />
            <InfoRow label="Type"    value={`${typeInfo.icon} ${typeInfo.label}`} />
            {formattedDate && <InfoRow label="Minted"  value={formattedDate} />}
            {tokenId && (
              <InfoRow label="Token ID" value={`#${tokenId}`} mono />
            )}
          </div>

          {/* Blockchain proof */}
          {txHash && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-1.5">🔗 Blockchain Proof</p>
              <a
                href={`${EXPLORER_URL}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono truncate block"
                onClick={e => e.stopPropagation()}
              >
                {txHash.slice(0, 22)}...{txHash.slice(-6)}
              </a>
            </div>
          )}

          <div className="mt-2 flex gap-1.5 flex-wrap">
            <span className="badge-ugf">⚡ UGF</span>
            <span className="badge-success">Base Sepolia</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-slate-200 text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
