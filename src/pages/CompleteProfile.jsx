import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { toast } from "react-hot-toast";

export default function CompleteProfile() {
  const { isConnected, address } = useWallet();
  const { user, loading, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    department: "",
    college: "",
    email: "",
    studentId: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // If loading the auth state, show a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Guard: if wallet not connected, redirect to landing
  if (!isConnected) {
    return <Navigate to="/" replace />;
  }

  // Guard: if profile already completed, redirect to dashboard
  if (user?.profileCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.rollNumber.trim()) return toast.error("Roll Number is required");
    if (!formData.department.trim()) return toast.error("Department is required");
    if (!formData.college.trim()) return toast.error("College is required");

    if (!address) {
      return toast.error("Wallet address is not connected. Please connect your MetaMask wallet.");
    }
    if (address.toLowerCase() !== user?.walletAddress?.toLowerCase()) {
      return toast.error("Active wallet address does not match the registered session wallet address.");
    }

    setSubmitting(true);
    try {
      await completeProfile(formData);
      toast.success("Profile registration completed!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Failed to complete profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh hero-bg flex flex-col justify-center items-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg glass-card p-8 relative overflow-hidden"
      >
        {/* Glow effect at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-b-full shadow-[0_0_20px_rgba(99,102,241,0.8)]" />

        <div className="text-center mb-8">
          <span className="text-3xl">🎓</span>
          <h2 className="text-2xl font-bold font-display text-white mt-3">
            Complete Your <span className="gradient-text">Profile</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Link your MetaMask wallet identity to your academic student profile to start managing achievements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Read Only Wallet Address */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Connected Wallet Address
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono select-all overflow-x-auto">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
              {user?.walletAddress}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="profile-name" className="block text-slate-300 text-xs font-medium mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="input-field"
                required
              />
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="profile-roll" className="block text-slate-300 text-xs font-medium mb-1.5">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-roll"
                type="text"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="e.g. 2026CS01"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label htmlFor="profile-dept" className="block text-slate-300 text-xs font-medium mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-dept"
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Computer Science"
                className="input-field"
                required
              />
            </div>

            {/* College */}
            <div>
              <label htmlFor="profile-college" className="block text-slate-300 text-xs font-medium mb-1.5">
                College / University <span className="text-red-500">*</span>
              </label>
              <input
                id="profile-college"
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. Stanford University"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email (Optional) */}
            <div>
              <label htmlFor="profile-email" className="block text-slate-300 text-xs font-medium mb-1.5">
                Email Address <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <input
                id="profile-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. john@university.edu"
                className="input-field"
              />
            </div>

            {/* Student ID (Optional) */}
            <div>
              <label htmlFor="profile-sid" className="block text-slate-300 text-xs font-medium mb-1.5">
                Student ID <span className="text-slate-500 text-[10px]">(Optional)</span>
              </label>
              <input
                id="profile-sid"
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. SID-99210"
                className="input-field"
              />
            </div>
          </div>

          <motion.button
            id="profile-submit-btn"
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary text-sm font-semibold py-3 mt-4 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Registering Profile...
              </>
            ) : (
              "Complete & Enter Dashboard"
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Embedded form input classes matching index.css styles */}
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
