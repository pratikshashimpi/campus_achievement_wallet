import { motion } from "framer-motion";
import { useAchievement } from "../context/AchievementContext";
import { EXPLORER_URL } from "../config/contract";

/**
 * AchievementTimeline — Vertical timeline of minted NFTs
 */
export default function AchievementTimeline() {
  const { myNFTs } = useAchievement();

  if (myNFTs.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-4xl mb-3">⏳</p>
        <p className="text-slate-300 font-medium">No achievements yet</p>
        <p className="text-sm text-slate-500 mt-1">Claim your first NFT to start your timeline</p>
      </div>
    );
  }

  const sorted = [...myNFTs].sort((a, b) => {
    const ta = a.mintedAt?.toDate?.() ?? new Date(a.mintedAt ?? 0);
    const tb = b.mintedAt?.toDate?.() ?? new Date(b.mintedAt ?? 0);
    return tb - ta;
  });

  const TYPE_ICONS = { certificate: "🎓", badge: "🏅", reward: "🏆" };

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="timeline-line" />

      <div className="space-y-4">
        {sorted.map((nft, i) => {
          const date = nft.mintedAt?.toDate?.()
            ? nft.mintedAt.toDate().toLocaleDateString()
            : typeof nft.mintedAt === "string"
              ? new Date(nft.mintedAt).toLocaleDateString()
              : "Recently";

          return (
            <motion.div
              key={nft.id || i}
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Dot */}
              <div className="absolute -left-8 top-4 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-dark-900 flex items-center justify-center text-xs">
                {TYPE_ICONS[nft.type] || "⭐"}
              </div>

              {/* Card */}
              <div className="glass-card p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{nft.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {nft.issuerName} · {nft.eventName}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="badge-ugf">⚡ Base Sepolia</span>
                    {nft.tokenId && (
                      <span className="text-xs text-slate-500 font-mono">#{nft.tokenId}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{date}</p>
                  {nft.txHash && !nft.txHash.startsWith("demo_") && (
                    <a
                      href={`${EXPLORER_URL}/tx/${nft.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 block"
                    >
                      View TX →
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
