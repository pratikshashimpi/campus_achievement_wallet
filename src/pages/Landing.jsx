import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { UGFBadge, NoEthBadge, GaslessBadge, VerifiedBadge } from "../components/UGFBadge";
import toast from "react-hot-toast";

const FLOATING_CARDS = [
  { emoji: "🎓", title: "Web3 Builder",      type: "certificate", color: "#6366f1", rotate: -6,  x: -60, y: -30 },
  { emoji: "🏆", title: "Hackathon Winner",  type: "reward",      color: "#f59e0b", rotate:  8,  x:  60, y: -10 },
  { emoji: "🏅", title: "Participant Badge", type: "badge",       color: "#10b981", rotate: -4,  x: -40, y:  60 },
  { emoji: "⛓️",  title: "Smart Contract",   type: "badge",       color: "#a855f7", rotate:  10, x:  80, y:  50 },
];

const STEPS = [
  { n: "01", icon: "🦊", title: "Connect Wallet",     desc: "Link your MetaMask in one click. No complicated setup needed." },
  { n: "02", icon: "🏆", title: "Choose Achievement", desc: "Browse available certificates, badges, and rewards from your institution." },
  { n: "03", icon: "🎓", title: "Claim Your Certificate", desc: "Mint it as an NFT in one click — gas is covered automatically, no ETH needed." },
  { n: "04", icon: "✅", title: "Verify Anytime",     desc: "Share a link or QR code so anyone — recruiters, employers, institutions — can instantly confirm it's real." },
];

const FEATURES = [
  { icon: "✅", title: "Instant Verification", desc: "Anyone can confirm your certificate is genuine in seconds — just a link or QR scan, checked directly on-chain. This is the core of the platform." },
  { icon: "🔐", title: "Tamper-Proof",   desc: "Certificates are stored permanently on blockchain — impossible to edit, fake, or lose." },
  { icon: "📱", title: "Always Yours",   desc: "Your certificates live in your wallet forever — independent of any institution." },
  { icon: "⚡", title: "No Gas Fees",    desc: "A nice bonus: the Universal Gas Framework covers gas costs, so you never need to hold ETH." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isConnected, connectWallet, isConnecting } = useWallet();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const handleConnect = async () => {
    if (isConnected) {
      navigate("/dashboard");
      return;
    }
    if (!window.ethereum) {
      toast.error("MetaMask extension not found. Please install the MetaMask wallet extension to use this app!");
      return;
    }
    const ok = await connectWallet();
    if (ok) {
      toast.success("Wallet connected successfully!");
      navigate("/dashboard");
    } else {
      toast.error("Failed to connect MetaMask. Please authorize the connection request.");
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">

      {/* === HERO === */}
      <section ref={heroRef} className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Radial glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div style={{ y: heroY }} className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left: copy */}
          <div>
            {/* Top badges */}
            <motion.div
              className="flex flex-wrap gap-2 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <VerifiedBadge />
              <UGFBadge size="lg" />
              <NoEthBadge />
            </motion.div>

            <motion.h1
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-none mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <span className="gradient-text">Campus</span>
              <br />
              <span className="text-white">Achievement</span>
              <br />
              <span className="gradient-text-gold">Wallet</span>
            </motion.h1>

            <motion.p
              className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Claim your academic achievements as NFTs on blockchain.{" "}
              <span className="text-indigo-400 font-medium">Instantly verifiable</span> by anyone, anywhere — and gas fees are covered automatically, so you never need ETH.
            </motion.p>

            <motion.div
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <motion.button
                id="hero-connect-wallet"
                onClick={handleConnect}
                disabled={isConnecting}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary text-lg px-8 py-4"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting…
                  </span>
                ) : isConnected ? "📊 Go to Dashboard" : "🦊 Connect Wallet"}
              </motion.button>

              <motion.button
                id="hero-explore-achievements"
                onClick={() => navigate("/achievements")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-secondary text-lg px-8 py-4"
              >
                🏆 Explore Achievements
              </motion.button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {["ERC-721 Standard", "Base Sepolia", "OpenZeppelin", "Instantly Verifiable"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: floating NFT cards */}
          <div className="relative h-[480px] hidden lg:block">
            {FLOATING_CARDS.map((card, i) => (
              <motion.div
                key={i}
                className="absolute glass-card p-4 w-52"
                style={{ left: `calc(50% + ${card.x}px)`, top: `calc(50% + ${card.y}px)` }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1, scale: 1,
                  rotate: card.rotate,
                  y: [0, -12, 0],
                }}
                transition={{
                  opacity: { delay: 0.3 + i * 0.1 },
                  scale: { delay: 0.3 + i * 0.1 },
                  y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
                }}
              >
                <div className="h-1 w-full rounded mb-3"
                  style={{ background: `linear-gradient(to right, ${card.color}, #a855f7)` }}
                />
                <div className="text-3xl mb-2">{card.emoji}</div>
                <p className="text-white font-semibold text-sm">{card.title}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{card.type}</p>
                <div className="mt-2 flex gap-1 flex-wrap">
                  <span className="badge-ugf">⚡ UGF</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 text-xs"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span>Scroll to explore</span>
          <span>↓</span>
        </motion.div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="py-24 bg-dark-900 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-indigo-400 font-semibold mb-2 tracking-wider uppercase text-sm">How It Works</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Claim Your <span className="gradient-text">Achievement</span> in 4 Steps
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">No crypto knowledge required. Our UGF integration makes blockchain invisible.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                className="glass-card p-6 relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="font-display text-5xl font-black text-indigo-500/20 absolute top-4 right-4">
                  {step.n}
                </span>
                <span className="text-4xl mb-4 block">{step.icon}</span>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="py-24 bg-dark-950 bg-mesh">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Why <span className="gradient-text">Blockchain</span> Certificates?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card p-6 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* === CERTIFICATE VERIFICATION SECTION (primary) === */}
      <section className="py-24 bg-dark-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-card p-10 border-gradient">
              <div className="text-6xl mb-6">✅</div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Built Around <span className="gradient-text">Certificate Verification</span>
              </h2>
              <p className="text-slate-300 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
                Every certificate you claim is recorded on-chain, so anyone — a recruiter,
                an employer, another institution — can confirm it's real in seconds.
                No phone calls, no paperwork, no waiting for a registrar to reply.
              </p>
              <div className="flex justify-center flex-wrap gap-3 mb-8">
                <VerifiedBadge />
                <span className="badge-gold">🔗 Base Sepolia</span>
                <span className="badge-ugf">🎓 On-Chain Certificates</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                {[
                  { icon: "🔍", label: "QR / Link Lookup", desc: "Scan a code or open a link to check any certificate instantly" },
                  { icon: "🔐", label: "Tamper-Proof",      desc: "Once minted, a certificate can't be edited, faked, or deleted" },
                  { icon: "🌐", label: "Works Anywhere",    desc: "No login or app needed for someone to verify your credential" },
                ].map(item => (
                  <div key={item.label} className="glass rounded-xl p-4">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === UGF SECTION (secondary bonus, not the main pitch) === */}
      <section className="py-16 bg-dark-950">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="glass-card p-6">
              <p className="text-indigo-400 font-semibold mb-2 tracking-wider uppercase text-xs">Bonus Feature</p>
              <h3 className="font-display text-xl font-bold text-white mb-3">
                Also Gasless, Thanks to <span className="gradient-text">UGF</span>
              </h3>
              <p className="text-slate-400 mb-5 text-sm leading-relaxed max-w-xl mx-auto">
                On top of verification, claiming a certificate never costs you any ETH —
                the Universal Gas Framework covers gas using a testnet Mock USD stablecoin.
              </p>
              <div className="flex justify-center flex-wrap gap-3">
                <UGFBadge size="lg" />
                <NoEthBadge />
                <GaslessBadge />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="py-24 bg-dark-950">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Ready to Claim Your <span className="gradient-text">First NFT?</span>
            </h2>
            <p className="text-slate-400 mb-8">Join our verified blockchain achievement ecosystem.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <motion.button
                id="cta-connect-wallet"
                onClick={handleConnect}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary text-lg px-10 py-4"
              >
                🦊 Connect Wallet — Free
              </motion.button>
              <motion.button
                id="cta-explore"
                onClick={() => navigate("/achievements")}
                whileHover={{ scale: 1.04 }}
                className="btn-secondary text-lg px-10 py-4"
              >
                🏆 Browse Achievements
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-dark-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-display font-bold gradient-text">Campus Achievement Wallet</span>
          </div>
          <p>Verified on-chain · Powered by UGF · Base Sepolia</p>
          <div className="flex gap-3 flex-wrap">
            <VerifiedBadge /><UGFBadge />
          </div>
        </div>
      </footer>
    </div>
  );
}
