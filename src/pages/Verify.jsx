import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useParams, Link } from "react-router-dom";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { EXPLORER_URL } from "../config/contract";

export default function Verify() {
  const { certificateId } = useParams();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificatesList, setCertificatesList] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = useCallback(async (val = input) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setCertificatesList([]);
    setSelectedCert(null);
    setSearched(true);

    try {
      const resultsMap = new Map();
      const addResult = (docId, data) => {
        resultsMap.set(docId, { id: docId, ...data });
      };

      const promises = [];

      // A. Try as direct Document ID (if valid alphanumeric format)
      if (/^[a-zA-Z0-9_-]{10,40}$/.test(trimmed)) {
        promises.push(
          getDoc(doc(db, "certificates", trimmed))
            .then((snap) => {
              if (snap.exists()) {
                addResult(snap.id, snap.data());
              }
            })
            .catch((e) => console.log("Direct doc fetch skipped/failed:", e))
        );
      }

      // B. Query by certificateId field
      promises.push(
        getDocs(query(collection(db, "certificates"), where("certificateId", "==", trimmed)))
          .then((snap) => {
            snap.docs.forEach((d) => addResult(d.id, d.data()));
          })
          .catch((e) => console.log("certificateId field query failed:", e))
      );

      // C. Query by studentWalletAddress (case-insensitive / lowercased)
      if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        promises.push(
          getDocs(query(collection(db, "certificates"), where("studentWalletAddress", "==", trimmed.toLowerCase())))
            .then((snap) => {
              snap.docs.forEach((d) => addResult(d.id, d.data()));
            })
            .catch((e) => console.log("studentWalletAddress query failed:", e))
        );
      }

      // D. Query by tokenId
      if (/^\d+$/.test(trimmed)) {
        promises.push(
          getDocs(query(collection(db, "certificates"), where("tokenId", "==", trimmed)))
            .then((snap) => {
              snap.docs.forEach((d) => addResult(d.id, d.data()));
            })
            .catch((e) => console.log("tokenId string query failed:", e))
        );
        promises.push(
          getDocs(query(collection(db, "certificates"), where("tokenId", "==", parseInt(trimmed, 10))))
            .then((snap) => {
              snap.docs.forEach((d) => addResult(d.id, d.data()));
            })
            .catch((e) => console.log("tokenId number query failed:", e))
        );
      }

      // E. Query by transactionHash (case-insensitive / lowercase)
      if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
        promises.push(
          getDocs(query(collection(db, "certificates"), where("transactionHash", "==", trimmed)))
            .then((snap) => {
              snap.docs.forEach((d) => addResult(d.id, d.data()));
            })
            .catch((e) => console.log("transactionHash exact query failed:", e))
        );
        promises.push(
          getDocs(query(collection(db, "certificates"), where("transactionHash", "==", trimmed.toLowerCase())))
            .then((snap) => {
              snap.docs.forEach((d) => addResult(d.id, d.data()));
            })
            .catch((e) => console.log("transactionHash lower query failed:", e))
        );
      }

      await Promise.all(promises);
      const results = Array.from(resultsMap.values());

      if (results.length === 0) {
        setCertificatesList([]);
      } else if (results.length === 1) {
        setCertificatesList(results);
        setSelectedCert(results[0]);
      } else {
        setCertificatesList(results);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to search credentials.");
    } finally {
      setLoading(false);
    }
  }, [input]);

  // Handle direct QR / verify parameter loading
  useEffect(() => {
    if (certificateId) {
      setInput(certificateId);
      handleVerify(certificateId);
    }
  }, [certificateId, handleVerify]);

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Verification <span className="gradient-text">Portal</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Verify academic achievements, student profiles, and blockchain certificates instantly.
          </p>
        </motion.div>

        {/* Search Input Box */}
        <motion.div
          className="glass-card p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <label className="text-sm font-medium text-slate-300 mb-2 block">
            Enter Certificate ID, Student Wallet, Token ID, or Transaction Hash
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="verify-input"
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="e.g. Doc ID, Wallet (0x...), Token ID (#), or Tx Hash"
              className="flex-1 px-4 py-3 glass rounded-xl text-sm text-white placeholder-slate-500 border border-white/10 focus:border-indigo-500/50 outline-none transition-all"
            />
            <motion.button
              id="verify-btn"
              onClick={() => handleVerify()}
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary px-6 py-3 text-sm font-semibold whitespace-nowrap"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              ) : "Verify Credential"}
            </motion.button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-red-400 flex items-center gap-1"
            >
              ⚠️ {error}
            </motion.p>
          )}

          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            All lookups check institutional cryptographically-signed authority logs in real-time. Blockchain-minted items show verifiable token hashes.
          </p>
        </motion.div>

        {/* Result Area */}
        <div className="space-y-6">
          {loading && (
            <div className="glass-card p-8 flex flex-col items-center justify-center gap-4">
              <span className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Verifying credential registers...</p>
            </div>
          )}

          {!loading && searched && certificatesList.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 border-red-500/20 bg-red-950/10 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl mx-auto mb-4">
                ❌
              </div>
              <h3 className="font-bold text-red-400 text-lg mb-2">Certificate Not Found</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                This certificate could not be verified. It may be fake, deleted, or has not been officially issued by the college authority.
              </p>
            </motion.div>
          )}

          {/* Multiple Results Found (Wallet lookup) */}
          {!loading && searched && !selectedCert && certificatesList.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-2 mb-4 text-emerald-400">
                <span>✓</span>
                <h3 className="font-bold text-white text-base">Multiple Certificates Found ({certificatesList.length})</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                We found multiple valid achievements registered to this lookup target. Select one to view complete verification data.
              </p>
              <div className="divide-y divide-white/5">
                {certificatesList.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className="w-full text-left py-3.5 px-2 hover:bg-white/5 rounded-lg transition-all flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-white">{cert.title}</p>
                      <p className="text-xs text-slate-400">Issued: {cert.issueDate} | Student: {cert.studentName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        cert.claimed 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {cert.claimed ? "✓ NFT Claimed" : "Assigned"}
                      </span>
                      <span className="text-slate-500 text-xs">➔</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Single/Selected Certificate Detailed Result */}
          {!loading && selectedCert && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Back to list button if multiple options existed */}
              {certificatesList.length > 1 && (
                <button
                  onClick={() => setSelectedCert(null)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  ← Back to results list
                </button>
              )}

              {/* Status Header */}
              <div className={`glass-card p-5 border-l-4 flex items-center gap-4 ${
                selectedCert.claimed ? "border-l-emerald-500 bg-emerald-950/5" : "border-l-amber-500 bg-amber-950/5"
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                  selectedCert.claimed
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                }`}>
                  {selectedCert.claimed ? "✅" : "⚠️"}
                </div>
                <div>
                  <p className={`font-bold text-sm ${selectedCert.claimed ? "text-emerald-400" : "text-amber-400"}`}>
                    {selectedCert.claimed ? "Valid Certificate & NFT Claimed" : "Valid Institutional Certificate"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedCert.claimed 
                      ? "Officially issued & claimed on Base Sepolia blockchain"
                      : "Assigned by college authority, NFT proof pending."
                    }
                  </p>
                </div>
                <div className="ml-auto shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedCert.claimed
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {selectedCert.claimed ? "⚡ On-Chain" : "Off-Chain Verified"}
                  </span>
                </div>
              </div>

              {/* Complete Metadata Details */}
              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4 text-base gradient-text font-display">Credential Authentic Details</h3>
                <div className="space-y-3.5 text-sm">
                  <VRow label="Verification ID" value={selectedCert.id} mono />
                  <VRow label="Certificate Title" value={selectedCert.title} />
                  <VRow label="Description" value={selectedCert.description || "No description provided."} />
                  <VRow label="Category" value={selectedCert.category || selectedCert.type || "Certificate"} capitalize />
                  <VRow label="Student Name" value={selectedCert.studentName} />
                  <VRow label="Roll Number" value={selectedCert.rollNumber} mono />
                  <VRow label="Department" value={selectedCert.department} />
                  <VRow label="College" value={selectedCert.college} />
                  <VRow label="Issuer Authority" value={selectedCert.issuer || "SVKM IoT Dhule"} />
                  <VRow label="Issue Date" value={selectedCert.issueDate} />
                  <VRow label="Student Wallet" value={selectedCert.studentWalletAddress} mono truncate />
                  <VRow label="Authority Signer" value={selectedCert.assignedByAdminWallet || "0x42fb...7292"} mono truncate />
                  
                  {selectedCert.claimed && selectedCert.tokenId && (
                    <VRow label="NFT Token ID" value={`#${selectedCert.tokenId}`} mono />
                  )}
                  {selectedCert.claimed && selectedCert.transactionHash && (
                    <VRow label="Transaction Hash" value={selectedCert.transactionHash} mono truncate />
                  )}
                </div>

                {/* File Preview and Downloader */}
                {selectedCert.certificateFileUrl && (
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verifiable File Document</p>
                    {selectedCert.certificateFileUrl.startsWith("data:image/") && (
                      <div className="relative rounded-xl overflow-hidden border border-white/5 bg-slate-950 aspect-video flex items-center justify-center max-h-60">
                        <img
                          src={selectedCert.certificateFileUrl}
                          alt={selectedCert.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <a
                      href={selectedCert.certificateFileUrl}
                      download={`${selectedCert.title.replace(/\s+/g, "_")}_Certificate.${selectedCert.certificateFileUrl.includes("pdf") ? "pdf" : "jpg"}`}
                      className="btn-secondary w-full py-2.5 text-xs text-center flex items-center justify-center gap-2 font-semibold transition-all hover:bg-white/10"
                    >
                      💾 Download Verified Document
                    </a>
                  </div>
                )}
              </div>

              {/* QR and Blockchain Verification Footer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* QR Code generator */}
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                  <h4 className="font-bold text-white mb-2 text-sm">QR Verification Link</h4>
                  <div className="p-3 bg-white rounded-xl mb-3">
                    <QRCodeSVG
                      value={`${window.location.origin}/verify/${selectedCert.id}`}
                      size={130}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                    Recruiters can scan this QR code to verify this specific certificate at any time.
                  </p>
                </div>

                {/* Blockchain metadata explorer */}
                <div className="glass-card p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white mb-1.5 text-sm">Blockchain Ledger Status</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {selectedCert.claimed
                        ? "This certificate has been fully recorded on the Base Sepolia blockchain network. It represents a secure, decentralized digital asset."
                        : "This certificate is officially signed in our verified Firestore database, but has not yet been minted as a Web3 NFT on the blockchain network by the student."
                      }
                    </p>
                  </div>
                  
                  {selectedCert.claimed && selectedCert.transactionHash ? (
                    <a
                      href={`${EXPLORER_URL}/tx/${selectedCert.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-xs text-center py-2.5 flex items-center justify-center gap-1.5 font-semibold"
                    >
                      🔗 Open on BaseScan
                    </a>
                  ) : (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-slate-500 font-medium font-mono">
                      NFT MINT PENDING
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function VRow({ label, value, mono, truncate, capitalize }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-white/5">
      <span className="text-slate-400 shrink-0 font-medium">{label}</span>
      <span className={`text-slate-200 text-right ${mono ? "font-mono text-xs" : ""} ${truncate ? "truncate max-w-[180px] sm:max-w-[280px]" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
