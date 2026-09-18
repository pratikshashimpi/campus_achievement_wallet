import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAchievement } from "../context/AchievementContext";
import { useWallet } from "../context/WalletContext";
import ClaimModal from "../components/ClaimModal";
import { UGFBanner } from "../components/UGFBadge";
import { ACHIEVEMENT_TYPES, RARITY_COLORS } from "../config/achievements";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

const categories = [
  { value: "all", label: "All Categories", icon: "📂" },
  { value: "certificate", label: "Certificates Only", icon: "🎓" },
  { value: "badge", label: "Badges Only", icon: "🏅" },
  { value: "reward", label: "Rewards Only", icon: "🏆" }
];

const sortOptions = [
  { value: "newest", label: "Sort: Newest First", icon: "📅" },
  { value: "oldest", label: "Sort: Oldest First", icon: "📅" },
  { value: "points-desc", label: "Sort: Points (High to Low)", icon: "⭐" },
  { value: "points-asc", label: "Sort: Points (Low to High)", icon: "⭐" },
  { value: "title-asc", label: "Sort: Title (A to Z)", icon: "🔤" }
];

const getVerificationUrl = (achievement) => {
  const id = achievement?.id || achievement?.certificateId;
  return `${window.location.origin}/verify/${id}`;
};

export default function Achievements() {
  const { address } = useWallet();
  const { availableAchievements } = useAchievement();

  const [selected, setSelected] = useState(null);
  const [selectedCertForQR, setSelectedCertForQR] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const processedAchievements = [...availableAchievements]
    .filter((a) => {
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.issuerName?.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "all" ||
        a.category === categoryFilter ||
        a.type === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.issueDate || b.createdAt || 0) - new Date(a.issueDate || a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.issueDate || a.createdAt || 0) - new Date(b.issueDate || b.createdAt || 0);
      }
      if (sortBy === "points-desc") {
        return (b.points || 0) - (a.points || 0);
      }
      if (sortBy === "points-asc") {
        return (a.points || 0) - (b.points || 0);
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const pendingCertificates = processedAchievements.filter((a) => !a.claimed);
  const claimedCertificates = processedAchievements.filter((a) => a.claimed);

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh pt-20 pb-12">
      {(categoryOpen || sortOpen) && (
        <div
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => {
            setCategoryOpen(false);
            setSortOpen(false);
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            My Academic <span className="gradient-text">Credentials</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Manage your institutional achievements assigned by SVKM IoT Dhule. Every certificate you claim is instantly verifiable on-chain — and gasless too.
          </p>
        </motion.div>

        <div className="mb-8">
          <UGFBanner />
        </div>

        {availableAchievements.length > 0 && (
          <div className="glass-card p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 bg-slate-950/40 relative z-30">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input
                id="achievement-search-input"
                type="text"
                placeholder="Search by title, issuer, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-30">
              <div className="relative">
                <button
                  type="button"
                  id="achievement-category-filter"
                  onClick={() => {
                    setCategoryOpen(!categoryOpen);
                    setSortOpen(false);
                  }}
                  className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:border-indigo-500/30 flex items-center justify-between gap-2.5 transition-all duration-200 outline-none select-none min-w-[170px]"
                >
                  <span className="flex items-center gap-1.5">
                    {categories.find((c) => c.value === categoryFilter)?.icon}{" "}
                    {categories.find((c) => c.value === categoryFilter)?.label}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${
                      categoryOpen ? "rotate-180 text-indigo-400" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 mt-2 min-w-[200px] bg-slate-950/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl p-1.5 z-40 flex flex-col gap-1 overflow-hidden"
                    >
                      {categories.map((c) => {
                        const isSelected = categoryFilter === c.value;
                        return (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              setCategoryFilter(c.value);
                              setCategoryOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all duration-200 select-none ${
                              isSelected
                                ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            <span>{c.icon}</span>
                            <span>{c.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  type="button"
                  id="achievement-sort-filter"
                  onClick={() => {
                    setSortOpen(!sortOpen);
                    setCategoryOpen(false);
                  }}
                  className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:border-indigo-500/30 flex items-center justify-between gap-2.5 transition-all duration-200 outline-none select-none min-w-[200px]"
                >
                  <span className="flex items-center gap-1.5">
                    {sortOptions.find((o) => o.value === sortBy)?.icon}{" "}
                    {sortOptions.find((o) => o.value === sortBy)?.label}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${
                      sortOpen ? "rotate-180 text-indigo-400" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {sortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 min-w-[220px] bg-slate-950/95 border border-white/10 backdrop-blur-xl rounded-xl shadow-2xl p-1.5 z-40 flex flex-col gap-1 overflow-hidden"
                    >
                      {sortOptions.map((o) => {
                        const isSelected = sortBy === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                              setSortBy(o.value);
                              setSortOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all duration-200 select-none ${
                              isSelected
                                ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            <span>{o.icon}</span>
                            <span>{o.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {availableAchievements.length === 0 ? (
          <motion.div
            className="glass-card p-16 text-center border border-white/5 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-full" />
            <p className="text-6xl mb-4">🎓</p>
            <p className="text-slate-300 font-semibold text-lg font-display">No certificates assigned yet</p>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              No academic records or achievements have been assigned to your connected wallet address yet. Please contact SVKM administration.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <h2 className="font-display text-xl font-bold text-white">
                  Pending Claim Certificates ({pendingCertificates.length})
                </h2>
              </div>

              {pendingCertificates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm glass-card border border-white/5 rounded-2xl bg-white/5">
                  {searchQuery || categoryFilter !== "all"
                    ? "🔍 No pending certificates matching your search filters."
                    : "🎉 Perfect! All assigned achievements have been claimed as blockchain NFTs."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingCertificates.map((ach, i) => (
                    <AchievementListCard
                      key={ach.id}
                      achievement={ach}
                      claimed={false}
                      index={i}
                      onClaim={() => setSelected(ach)}
                      onShowQR={() => setSelectedCertForQR(ach)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h2 className="font-display text-xl font-bold text-white">
                  Claimed NFT Certificates ({claimedCertificates.length})
                </h2>
              </div>

              {claimedCertificates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm glass-card border border-white/5 rounded-2xl bg-white/5">
                  {searchQuery || categoryFilter !== "all"
                    ? "🔍 No claimed NFTs matching your search filters."
                    : 'No certificates claimed as NFTs yet. Click "Claim NFT" on any pending certificate above to begin!'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {claimedCertificates.map((ach, i) => (
                    <AchievementListCard
                      key={ach.id}
                      achievement={ach}
                      claimed={true}
                      index={i}
                      onClaim={() => {}}
                      onShowQR={() => setSelectedCertForQR(ach)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <ClaimModal
            achievement={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCertForQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-sm w-full p-6 relative flex flex-col items-center text-center border border-white/10"
            >
              <button
                onClick={() => setSelectedCertForQR(null)}
                className="absolute top-3 right-4 text-slate-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>

              <h3 className="font-bold text-white mb-1.5 text-base font-display">
                Credential QR Verification
              </h3>

              <p className="text-xs text-indigo-400 font-medium mb-4">
                {selectedCertForQR.title}
              </p>

              <div className="p-3 bg-white rounded-xl mb-4 shadow-xl">
                <QRCodeSVG
                  value={getVerificationUrl(selectedCertForQR)}
                  size={150}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                />
              </div>

              <p className="text-[10px] text-slate-400 mb-4 select-all bg-white/5 px-2.5 py-2 rounded-lg w-full break-all font-mono border border-white/5">
                {getVerificationUrl(selectedCertForQR)}
              </p>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getVerificationUrl(selectedCertForQR));
                    toast.success("Verification link copied!");
                  }}
                  className="btn-primary flex-1 py-2 text-xs font-semibold"
                >
                  📋 Copy Link
                </button>

                <button
                  onClick={() => setSelectedCertForQR(null)}
                  className="btn-secondary flex-1 py-2 text-xs font-semibold"
                >
                  ✕ Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AchievementListCard({ achievement, claimed, index, onClaim, onShowQR }) {
  const typeInfo = ACHIEVEMENT_TYPES[achievement.type] || ACHIEVEMENT_TYPES.badge;
  const rarityColor = RARITY_COLORS[achievement.rarity] || "#9ca3af";
  const verifyUrl = getVerificationUrl(achievement);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card overflow-hidden group relative flex flex-col justify-between border border-white/5 bg-slate-950/40"
    >
      <div>
        <div className={`h-1.5 w-full bg-gradient-to-r ${achievement.gradient}`} />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{
                background: `${achievement.color}15`,
                border: `1px solid ${achievement.color}30`
              }}
            >
              {achievement.image}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: `${rarityColor}15`,
                  border: `1px solid ${rarityColor}25`,
                  color: rarityColor
                }}
              >
                {achievement.rarity}
              </span>

              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  color: typeInfo.color,
                  background: `${typeInfo.color}12`
                }}
              >
                {typeInfo.icon} {typeInfo.label}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-white text-sm mb-1 leading-snug truncate" title={achievement.title}>
            {achievement.title}
          </h3>

          <p className="text-[11px] text-slate-400 mb-1">
            Issued by: {achievement.issuerName}
          </p>

          <p className="text-[11px] text-slate-500 mb-4 line-clamp-2 h-8 leading-normal">
            {achievement.description}
          </p>

          {achievement.certificateFileUrl && (
            <div className="mb-4 space-y-2">
              {achievement.certificateFileUrl.startsWith("data:image/") && (
                <div className="relative rounded-lg overflow-hidden border border-white/5 bg-slate-950/50 aspect-video flex items-center justify-center group-hover:border-indigo-500/20 transition-all duration-300">
                  <img
                    src={achievement.certificateFileUrl}
                    alt={achievement.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <a
                href={achievement.certificateFileUrl}
                download={
                  achievement.certificateFileUrl.startsWith("data:")
                    ? `${achievement.title.replace(/\s+/g, "_")}_Certificate.${
                        achievement.certificateFileUrl.split(";")[0].split("/")[1] === "pdf" ? "pdf" : "png"
                      }`
                    : undefined
                }
                target={achievement.certificateFileUrl.startsWith("data:") ? undefined : "_blank"}
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline flex items-center gap-1.5"
              >
                📄 {achievement.certificateFileUrl.startsWith("data:") ? "💾 Download credential document" : "📄 View Document File"}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-center justify-between">
          <span className="badge-gold text-xs">⭐ {achievement.points} pts</span>

          {claimed ? (
            <div className="flex flex-col items-end gap-0.5">
              <span className="badge-success text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🟢 Claimed & Verified
              </span>

              {achievement.tokenId && (
                <span className="text-[9px] text-slate-500 font-mono">
                  Token ID: #{achievement.tokenId}
                </span>
              )}
            </div>
          ) : (
            <motion.button
              id={`claim-btn-${achievement.id}`}
              onClick={onClaim}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary text-xs py-2 px-4"
            >
              ⚡ Claim NFT
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 justify-between">
          <button
            onClick={() => {
              navigator.clipboard.writeText(verifyUrl);
              toast.success("Verification link copied!");
            }}
            className="text-slate-400 hover:text-slate-200 transition-all text-[11px] flex items-center gap-1 font-medium"
            title="Copy Verification Link"
          >
            📋 Copy Link
          </button>

          <button
            onClick={onShowQR}
            className="text-slate-400 hover:text-slate-200 transition-all text-[11px] flex items-center gap-1 font-medium"
            title="Show Verification QR Code"
          >
            📱 QR Code
          </button>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 transition-all text-[11px] font-semibold flex items-center gap-1"
          >
            🔍 Verify Page
          </a>
        </div>
      </div>
    </motion.div>
  );
}