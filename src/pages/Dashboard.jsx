import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAchievement } from "../context/AchievementContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import NFTCard from "../components/NFTCard";
import AchievementTimeline from "../components/AchievementTimeline";
import { UGFBanner } from "../components/UGFBadge";

const TABS = ["Overview", "My NFTs", "Timeline", "Profile Settings"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, checkUserProfile } = useAuth();
  const { address, shortAddress, balance, isConnected, isCorrectChain, switchToBaseSepolia, connectWallet, NETWORK_NAME } = useWallet();
  const { availableAchievements, myNFTs, isLoading } = useAchievement();
  const [activeTab, setActiveTab] = useState("Overview");

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    studentId: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Initialize profile form once user data is loaded
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        studentId: user.studentId || "",
      });
    }
  }, [user]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <motion.div
          className="glass-card p-10 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-6xl mb-4">🦊</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-6 text-sm">Connect MetaMask to view your achievement dashboard</p>
          <motion.button
            id="dashboard-connect-btn"
            onClick={() => connectWallet()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full py-3.5"
          >
            🦊 Connect MetaMask
          </motion.button>
          <p className="text-xs text-slate-500 mt-4">Instantly verifiable certificates · No ETH required</p>
        </motion.div>
      </div>
    );
  }

  // Handle Safe Profile Fields Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const lowerAddress = address.toLowerCase();
      const userRef = doc(db, "users", lowerAddress);

      // Merge only the safe fields
      await setDoc(
        userRef,
        {
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          studentId: profileForm.studentId.trim(),
        },
        { merge: true }
      );

      // Refresh the local auth state
      await checkUserProfile(address);
      toast.success("✅ Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Stats Counters
  const totalAssigned = availableAchievements.length;
  const claimedNFTs = availableAchievements.filter((c) => c.claimed).length;
  const pendingClaims = availableAchievements.filter((c) => !c.claimed).length;
  const verifiedNFTs = claimedNFTs; // Claimed NFTs are instantly on-chain verified

  // Recent lists
  const recentAssigned = [...availableAchievements]
    .filter((c) => !c.claimed)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3);

  const recentClaimed = [...availableAchievements]
    .filter((c) => c.claimed)
    .sort((a, b) => new Date(b.claimedAt || 0) - new Date(a.claimedAt || 0))
    .slice(0, 3);

  // Formatted Date
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-white">
              Student <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, {user?.name || "Student"} · {NETWORK_NAME}
              {!isCorrectChain && (
                <button onClick={switchToBaseSepolia} className="ml-2 text-amber-400 hover:text-amber-300 underline font-medium">
                  ⚠️ Switch Network
                </button>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              id="dashboard-claim-btn"
              onClick={() => navigate("/achievements")}
              whileHover={{ scale: 1.03 }}
              className="btn-primary py-2.5 px-5 text-sm font-semibold flex items-center gap-1.5"
            >
              🏆 Claim NFT
            </motion.button>
            <motion.button
              onClick={() => navigate("/verify")}
              whileHover={{ scale: 1.03 }}
              className="btn-secondary py-2.5 px-5 text-sm font-semibold text-slate-300"
            >
              🔍 Verify Credentials
            </motion.button>
          </div>
        </motion.div>

        {/* UGF Banner */}
        <div className="mb-8">
          <UGFBanner />
        </div>

        {/* Dynamic Empty State Guard */}
        {totalAssigned === 0 && !isLoading ? (
          <motion.div
            className="glass-card p-16 text-center border border-white/5 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-full shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-bold text-white mb-2">No Achievements Assigned</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
              No certificates assigned yet. Please contact your college authority (SVKM IoT Dhule) to register and assign your credentials.
            </p>
            <button
              onClick={() => window.open("mailto:admin@svkm.edu.in")}
              className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            >
              📧 Contact Administration
            </button>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 glass rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab.toLowerCase().replace(" ", "-")}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                    activeTab === tab ? "bg-indigo-600 text-white shadow-glow-brand" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              
              {/* OVERVIEW TAB */}
              {activeTab === "Overview" && (
                <div className="space-y-8">
                  {/* Profile and Stats Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Student Profile Card */}
                    <div className="lg:col-span-1 glass-card p-6 border border-white/5 relative overflow-hidden flex flex-col justify-between">
                      {/* Accent glow line */}
                      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      
                      <div>
                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
                            {user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST"}
                          </div>
                          <div>
                            <h2 className="font-bold text-white text-lg leading-snug">{user?.name || "Unregistered Student"}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                                {user?.role || "Student"}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                                SVKM IoT
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Information */}
                        <div className="space-y-3.5 text-xs border-t border-white/5 pt-4">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Roll Number</span>
                            <span className="text-slate-200 font-medium font-mono">{user?.rollNumber || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Department</span>
                            <span className="text-slate-200 font-medium">{user?.department || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">College / Authority</span>
                            <span className="text-slate-200 font-medium">{user?.college || "SVKM IoT Dhule"}</span>
                          </div>
                          {user?.email && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Student Email</span>
                              <span className="text-slate-200 font-medium truncate max-w-[150px]">{user.email}</span>
                            </div>
                          )}
                          {user?.studentId && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Student ID</span>
                              <span className="text-slate-200 font-medium font-mono">{user.studentId}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-500">Wallet Address</span>
                            <span className="text-indigo-400 font-mono font-medium" title={address}>
                              {shortAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center">
                        <span>Joined: {formatDate(user?.createdAt)}</span>
                        <span className="text-indigo-500 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("Profile Settings")}>
                          Edit Profile →
                        </span>
                      </div>
                    </div>

                    {/* Achievement Statistics Grid */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                      
                      {/* Card 1: Total Assigned */}
                      <div className="glass-card p-6 flex flex-col justify-between border border-white/5 group hover:border-indigo-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🎓</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 uppercase tracking-wider">
                            Issued
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold font-display text-white">{totalAssigned}</p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Assigned Certificates</p>
                        </div>
                      </div>

                      {/* Card 2: Claimed NFTs */}
                      <div className="glass-card p-6 flex flex-col justify-between border border-white/5 group hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🏅</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/10 uppercase tracking-wider">
                            Minted
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold font-display text-white">{claimedNFTs}</p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Claimed NFT Proofs</p>
                        </div>
                      </div>

                      {/* Card 3: Pending Claims */}
                      <div className="glass-card p-6 flex flex-col justify-between border border-white/5 group hover:border-amber-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">⏳</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10 uppercase tracking-wider">
                            Pending
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold font-display text-white">{pendingClaims}</p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Pending Claim NFTs</p>
                        </div>
                      </div>

                      {/* Card 4: Verified Credentials */}
                      <div className="glass-card p-6 flex flex-col justify-between border border-white/5 group hover:border-emerald-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">🟢</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 uppercase tracking-wider">
                            Verified
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold font-display text-white">{verifiedNFTs}</p>
                          <p className="text-xs text-slate-400 mt-1 font-medium">On-chain Verified NFTs</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Recent Activities Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    
                    {/* Recent Assigned / Pending Certificates */}
                    <div className="glass-card p-6 border border-white/5">
                      <h3 className="font-bold text-white mb-4 text-base flex items-center gap-2 font-display">
                        <span>⏳</span> Pending Claims
                      </h3>
                      
                      {recentAssigned.length === 0 ? (
                        <div className="text-slate-500 text-sm py-8 text-center bg-slate-950/40 rounded-2xl border border-white/5">
                          Perfect! You have claimed all assigned certificates.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentAssigned.map((cert) => (
                            <div
                              key={cert.id}
                              onClick={() => navigate("/achievements")}
                              className="p-3 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-slate-200 text-xs truncate group-hover:text-indigo-400 transition-colors">
                                  {cert.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{cert.issuerName} · {cert.issueDate}</p>
                              </div>
                              <span className="badge-amber text-[10px] shrink-0 font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                🟡 Pending Claim
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Claimed Certificates */}
                    <div className="glass-card p-6 border border-white/5">
                      <h3 className="font-bold text-white mb-4 text-base flex items-center gap-2 font-display">
                        <span>🟢</span> Recent Claimed NFTs
                      </h3>
                      
                      {recentClaimed.length === 0 ? (
                        <div className="text-slate-500 text-sm py-8 text-center bg-slate-950/40 rounded-2xl border border-white/5">
                          No claimed achievements yet. Go to the Claim tab to mint your NFT proof!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentClaimed.map((cert) => (
                            <div
                              key={cert.id}
                              onClick={() => navigate(`/verify/${cert.id}`)}
                              className="p-3 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-slate-200 text-xs truncate group-hover:text-emerald-400 transition-colors">
                                  {cert.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">Token ID: #{cert.tokenId || "N/A"}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="badge-success text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  🟢 Verified NFT
                                </span>
                                {cert.transactionHash && (
                                  <span className="text-[8px] text-slate-500 font-mono">
                                    Tx: {cert.transactionHash.slice(0, 6)}...{cert.transactionHash.slice(-4)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* MY NFTs TAB */}
              {activeTab === "My NFTs" && (
                <>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="shimmer rounded-2xl h-80" />
                      ))}
                    </div>
                  ) : myNFTs.length === 0 ? (
                    <motion.div className="glass-card p-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className="text-6xl mb-4">🏆</div>
                      <h3 className="text-xl font-bold text-white mb-2">No NFTs Claimed Yet</h3>
                      <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                        Your claimed blockchain credentials will appear here. Go to the achievements section to claim your certificates as verifiable, tamper-proof NFT proofs.
                      </p>
                      <motion.button
                        onClick={() => navigate("/achievements")}
                        whileHover={{ scale: 1.03 }}
                        className="btn-primary py-2.5 px-6 font-semibold"
                      >
                        ⚡ Claim New NFT
                      </motion.button>
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myNFTs.map((nft, i) => (
                        <motion.div
                          key={nft.id || i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                        >
                          <NFTCard
                            achievement={{
                              id: nft.achievementId || nft.id,
                              title: nft.title,
                              type: nft.type,
                              issuerName: nft.issuerName,
                              eventName: nft.eventName || nft.title,
                              description: nft.description || nft.title,
                              image: { certificate: "🎓", badge: "🏅", reward: "🏆" }[nft.type] || "🎓",
                              color: nft.color || "#6366f1",
                              gradient: nft.gradient || "from-indigo-500 to-purple-600",
                              rarity: nft.rarity || "Rare",
                              points: nft.points || 100,
                            }}
                            minted
                            txHash={nft.txHash}
                            tokenId={nft.tokenId}
                            mintedAt={nft.mintedAt}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TIMELINE TAB */}
              {activeTab === "Timeline" && (
                <div className="max-w-2xl mx-auto">
                  <AchievementTimeline />
                </div>
              )}

              {/* PROFILE SETTINGS TAB */}
              {activeTab === "Profile Settings" && (
                <div className="max-w-lg mx-auto">
                  <div className="glass-card p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500" />
                    
                    <h3 className="font-bold text-white mb-2 text-base font-display flex items-center gap-2">
                      <span>⚙️</span> Edit Student Profile
                    </h3>
                    <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                      Update your academic safe fields. Admin-provisioned credentials, roles, roll numbers, and wallet addresses cannot be changed.
                    </p>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      
                      {/* Locked Wallet Address */}
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          Wallet Address (Locked)
                        </label>
                        <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono select-all truncate">
                          {address}
                        </div>
                      </div>

                      {/* Name (Safe field - Editable) */}
                      <div>
                        <label htmlFor="student-name" className="block text-slate-300 text-xs font-medium mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="student-name"
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. John Doe"
                          className="input-field"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Locked Roll Number */}
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            Roll Number (Locked)
                          </label>
                          <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono">
                            {user?.rollNumber || "N/A"}
                          </div>
                        </div>

                        {/* Locked Department */}
                        <div>
                          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                            Department (Locked)
                          </label>
                          <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                            {user?.department || "N/A"}
                          </div>
                        </div>
                      </div>

                      {/* Locked College */}
                      <div>
                        <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          College / Institute (Locked)
                        </label>
                        <div className="px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
                          {user?.college || "SVKM IoT Dhule"}
                        </div>
                      </div>

                      {/* Email Address (Safe field - Editable) */}
                      <div>
                        <label htmlFor="student-email" className="block text-slate-300 text-xs font-medium mb-1.5">
                          Student Email Address
                        </label>
                        <input
                          id="student-email"
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="e.g. name@svkm.org"
                          className="input-field"
                        />
                      </div>

                      {/* Student ID (Safe field - Editable) */}
                      <div>
                        <label htmlFor="student-id" className="block text-slate-300 text-xs font-medium mb-1.5">
                          Student Registration ID
                        </label>
                        <input
                          id="student-id"
                          type="text"
                          value={profileForm.studentId}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, studentId: e.target.value }))}
                          placeholder="e.g. SID-99210"
                          className="input-field"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={savingProfile}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2 mt-4"
                      >
                        {savingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Updating Profile...
                          </>
                        ) : (
                          "💾 Save Changes"
                        )}
                      </motion.button>

                    </form>
                  </div>
                </div>
              )}

            </motion.div>
          </>
        )}
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 0.625rem 0.875rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.75rem;
          color: #f1f5f9;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field:focus {
          border-color: rgba(99, 102, 241, 0.5);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }
      `}</style>
    </div>
  );
}
