import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { UGFBadge } from "./UGFBadge";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/achievements", label: "Achievements", icon: "🏆" },
  { to: "/verify", label: "Verify", icon: "🔍" },
  { to: "/admin", label: "Admin", icon: "⚙️" },
];

export default function Navbar() {
  const {
    shortAddress,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    isCorrectChain,
    switchToBaseSepolia,
  } = useWallet();

  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.to === "/admin") {
      return user && user.role === "admin";
    }
    return true;
  });

  const handleConnect = async () => {
    const success = await connectWallet();

    if (success) {
      localStorage.setItem("walletConnected", "true");
      navigate("/dashboard");
    }
  };

  const handleDisconnect = async () => {
    try {
      if (disconnectWallet) {
        await disconnectWallet();
      }

      // Remove saved wallet session
      localStorage.removeItem("walletConnected");

      // Clear wallet-related cache
      localStorage.removeItem("wagmi.wallet");
      localStorage.removeItem("walletconnect");

      sessionStorage.clear();

      // Force reload
      window.location.href = "/";
    } catch (error) {
      console.error("Disconnect failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-glow-brand group-hover:shadow-glow-purple transition-all">
            🎓
          </div>

          <div className="hidden sm:block">
            <p className="font-display font-bold text-sm gradient-text leading-none">
              Campus
            </p>

            <p className="font-display font-bold text-sm text-slate-300 leading-none">
              Achievement Wallet
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {/* UGF Badge */}
          <div className="hidden lg:block">
            <UGFBadge />
          </div>

          {/* Wrong Network Warning */}
          {isConnected && !isCorrectChain && (
            <motion.button
              onClick={switchToBaseSepolia}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all"
              whileHover={{ scale: 1.02 }}
            >
              ⚠️ Switch to Base Sepolia
            </motion.button>
          )}

          {/* Wallet Status */}
          {isConnected ? (
            <div className="flex items-center gap-3">

              {/* Wallet Address */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {shortAddress}
              </div>

              {/* Disconnect Button */}
              <motion.button
                onClick={handleDisconnect}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
              >
                Disconnect
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={handleConnect}
              disabled={isConnecting}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"
            >
              {isConnecting ? "Connecting..." : "🦊 Connect Wallet"}
            </motion.button>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden border-t border-white/5 bg-zinc-950/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Links */}
              <div className="flex flex-col gap-1">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>

              {/* UGF Badge */}
              <div className="pt-2 pb-1 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Protocol Standard</span>
                <UGFBadge size="sm" />
              </div>

              {/* Wrong Network Warning */}
              {isConnected && !isCorrectChain && (
                <motion.button
                  onClick={() => {
                    switchToBaseSepolia();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all"
                  whileHover={{ scale: 1.01 }}
                >
                  ⚠️ Switch to Base Sepolia
                </motion.button>
              )}

              {/* Wallet Info / Connection Status */}
              <div className="pt-3 border-t border-white/5">
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        Connected
                      </div>
                      <span className="text-xs font-mono text-slate-400 select-all bg-white/5 px-2 py-0.5 rounded">
                        {shortAddress}
                      </span>
                    </div>

                    <motion.button
                      onClick={() => {
                        handleDisconnect();
                        setMobileOpen(false);
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all text-center"
                    >
                      Disconnect Wallet
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => {
                      handleConnect();
                      setMobileOpen(false);
                    }}
                    disabled={isConnecting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full btn-primary text-sm py-3 px-6 flex items-center justify-center gap-2 font-semibold"
                  >
                    {isConnecting ? "Connecting..." : "🦊 Connect Wallet"}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}