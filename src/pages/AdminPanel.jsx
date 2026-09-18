import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../context/WalletContext";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc, query, onSnapshot, doc, setDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";

// Helper function to compress images locally using HTML5 Canvas to fit Firestore document limits
const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Scale aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly optimized JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(new Error("Failed to load image for compression."));
    };
    reader.onerror = (err) => reject(new Error("Failed to read image file."));
  });
};

const DEMO_CERTIFICATES = [
  {
    title: "Hackathon Participation Certificate",
    category: "certificate",
    description: "For outstanding performance in building decentralized applications on the Base Sepolia Testnet during the Web3 Hackathon 2026.",
    issuer: "SVKM IoT Dhule",
  },
  {
    title: "Blockchain Workshop Certificate",
    category: "certificate",
    description: "Completed the 30-day intensive Web3 bootcamp covering Solidity, hardhat, ethers.js, and client integration protocols.",
    issuer: "SVKM IoT Dhule",
  },
  {
    title: "Smart Contract Developer Badge",
    category: "badge",
    description: "Awarded for exceptional mastery in implementing secure, gas-optimized ERC-721 smart contracts and decentralized storage protocols.",
    issuer: "SVKM IoT Dhule",
  },
  {
    title: "Internship Completion Certificate",
    category: "certificate",
    description: "Successfully completed the Web3 Software Engineer Internship, building key modules for the Campus Achievement Wallet project.",
    issuer: "SVKM IoT Dhule",
  },
  {
    title: "Academic Excellence Certificate",
    category: "reward",
    description: "Awarded for securing top ranking in the Computer Engineering Department and demonstrating outstanding academic commitment.",
    issuer: "SVKM IoT Dhule",
  }
];

export default function AdminPanel() {
  const { isConnected, address } = useWallet();

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "certificate",
    issuer: "SVKM IoT Dhule",
    issueDate: new Date().toISOString().split("T")[0],
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [allCertificates, setAllCertificates] = useState([]);
  const [selectedCertForQR, setSelectedCertForQR] = useState(null);

  // Search & Filter state for Registry & Log
  const [studentSearch, setStudentSearch] = useState("");
  const [certSearch, setCertSearch] = useState("");
  const [certStatusFilter, setCertStatusFilter] = useState("all");

  const [seedingDemo, setSeedingDemo] = useState(false);

  // Cleanup Object URL when preview changes
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Fetch all registered students
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.role !== "admin"); // only students
      setStudents(list);
    } catch (err) {
      console.error("Error loading students:", err);
      toast.error("Failed to load students list.");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchStudents();
    }
  }, [isConnected]);

  // Fetch all issued certificates in real-time
  useEffect(() => {
    if (!isConnected) return;
    const q = query(collection(db, "certificates"));
    const unsub = onSnapshot(q, (snap) => {
      setAllCertificates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading certificates:", err);
    });
    return () => unsub();
  }, [isConnected]);

  const handleFieldChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // Enforce raw size limit only for PDFs
      if (selected.type === "application/pdf" && selected.size > 600000) {
        toast.error("PDF is too large! Please choose a PDF under 600 KB or upload an image instead.");
        e.target.value = "";
        setFile(null);
        setFilePreview("");
        return;
      }
      
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selected));
      } else {
        setFilePreview("");
      }
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Core Assign Certificate Logic
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedStudentId) {
      toast.error("Please select a registered student.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Certificate Title is required.");
      return;
    }
    if (!form.issuer.trim()) {
      toast.error("Issuer Name is required.");
      return;
    }
    if (!file) {
      toast.error("Certificate document file is required.");
      return;
    }

    const confirmAssign = window.confirm(`Are you sure you want to assign "${form.title}" to ${selectedStudent.name}?`);
    if (!confirmAssign) return;

    setCreating(true);
    try {
      let fileUrl = "";
      if (file) {
        if (file.type.startsWith("image/")) {
          // Compress the image locally using canvas
          fileUrl = await compressImage(file, 1000, 1000, 0.6);
        } else {
          // Direct base64 read for PDF
          fileUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(new Error("Failed to read PDF: " + err.message));
            reader.readAsDataURL(file);
          });
        }
      }

      // Pre-generate Firestore document reference to obtain a unique ID
      const certRef = doc(collection(db, "certificates"));
      const certificateId = certRef.id;
      const verificationUrl = `${window.location.origin}/verify/${certificateId}`;

      // Write certificate object to Firestore
      const newCertificate = {
        certificateId,
        title: form.title.trim(),
        description: form.description.trim() || "",
        category: form.category,
        type: form.category, // compatibility mapping
        issuer: form.issuer.trim(),
        issuerName: form.issuer.trim(),
        issueDate: form.issueDate,
        studentWalletAddress: selectedStudent.walletAddress.toLowerCase(),
        studentName: selectedStudent.name,
        rollNumber: selectedStudent.rollNumber,
        department: selectedStudent.department,
        college: selectedStudent.college,
        certificateFileUrl: fileUrl,
        metadataUrl: fileUrl, 
        status: "assigned",
        claimed: false,
        tokenId: null,
        transactionHash: null,
        verificationUrl,
        assignedByAdminWallet: address.toLowerCase(),
        createdAt: new Date().toISOString(),
        claimedAt: null,
      };

      await setDoc(certRef, newCertificate);
      
      toast.success(`✅ Certificate successfully assigned to ${selectedStudent.name}!`);
      
      // Reset form
      setForm({
        title: "",
        description: "",
        category: "certificate",
        issuer: "SVKM IoT Dhule",
        issueDate: new Date().toISOString().split("T")[0],
      });
      setSelectedStudentId("");
      setFile(null);
      setFilePreview("");
      
      // Reset file input element
      const fileInput = document.getElementById("cert-file");
      if (fileInput) fileInput.value = "";

      // Switch to issued log tab to view new certificate
      setActiveTab("Manage");

    } catch (err) {
      console.error(err);
      toast.error("Failed to assign certificate: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Demo Data Seeding Helper
  const handleSeedDemoData = async () => {
    if (students.length === 0) {
      toast.error("No registered students found! Students must complete their profile first.");
      return;
    }

    const confirmSeed = window.confirm(
      `Do you want to create realistic demo certificates for all registered students? This will issue up to 5 certificates (Hackathon, Blockchain workshop, Smart contract dev badge, etc.) to each registered student without duplicating already existing certificates.`
    );
    if (!confirmSeed) return;

    setSeedingDemo(true);
    let createdCount = 0;
    try {
      for (const student of students) {
        const studentWalletLower = student.walletAddress.toLowerCase();
        
        for (const demo of DEMO_CERTIFICATES) {
          // Check if certificate with same title and wallet already exists in our local list
          const exists = allCertificates.some(
            c => c.title === demo.title && c.studentWalletAddress.toLowerCase() === studentWalletLower
          );

          if (!exists) {
            const certRef = doc(collection(db, "certificates"));
            const docId = certRef.id;
            const verificationUrl = `${window.location.origin}/verify/${docId}`;

            const newDemoCert = {
              certificateId: docId,
              title: demo.title,
              description: demo.description,
              category: demo.category,
              type: demo.category,
              issuer: demo.issuer,
              issuerName: demo.issuer,
              issueDate: new Date().toISOString().split("T")[0],
              studentWalletAddress: studentWalletLower,
              studentName: student.name,
              rollNumber: student.rollNumber || "N/A",
              department: student.department || "Information Technology",
              college: student.college || "SVKM IoT Dhule",
              certificateFileUrl: "", // empty URL since it is seed data
              metadataUrl: "",
              status: "assigned",
              claimed: false,
              tokenId: null,
              transactionHash: null,
              verificationUrl,
              assignedByAdminWallet: address.toLowerCase(),
              createdAt: new Date().toISOString(),
              claimedAt: null,
            };

            await setDoc(certRef, newDemoCert);
            createdCount++;
          }
        }
      }

      toast.success(`🎉 Seeding complete! Assigned ${createdCount} realistic certificates across ${students.length} students.`);
    } catch (err) {
      console.error("Error seeding demo data:", err);
      toast.error("Error creating demo certificates: " + err.message);
    } finally {
      setSeedingDemo(false);
    }
  };

  // Stats Counters
  const totalStudentsCount = students.length;
  const totalAssignedCount = allCertificates.length;
  const totalClaimedCount = allCertificates.filter(c => c.claimed).length;
  const totalPendingCount = allCertificates.filter(c => !c.claimed).length;

  // Search filter for Student Registry
  const filteredStudents = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      s.walletAddress.toLowerCase().includes(q) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  // Filter and search for Certificates log
  const filteredCertificates = allCertificates.filter(c => {
    const q = certSearch.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      (c.rollNumber && c.rollNumber.toLowerCase().includes(q));

    const matchesStatus =
      certStatusFilter === "all" ||
      (certStatusFilter === "claimed" && c.claimed) ||
      (certStatusFilter === "pending" && !c.claimed);

    return matchesSearch && matchesStatus;
  });

  // Recent Items lists (for Dashboard overview panel)
  const recentRegisteredStudents = [...students]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentCertificateActivity = [...allCertificates]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-slate-950 pt-20 flex items-center justify-center">
        <div className="glass-card p-10 max-w-md text-center">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Panel</h2>
          <p className="text-slate-400 text-sm">Connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-mesh pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <motion.div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">
              College <span className="gradient-text">Authority</span> Admin
            </h1>
            <p className="text-slate-400 text-sm">
              SVKM IoT Dhule · Authorized Institutional Certificate Issuer
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              id="demo-seed-btn"
              onClick={handleSeedDemoData}
              disabled={seedingDemo}
              whileHover={{ scale: 1.03 }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl border border-indigo-500/20 text-xs shadow-glow-brand flex items-center gap-1.5"
            >
              {seedingDemo ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                  Generating...
                </>
              ) : "✨ Create Demo Certificates"}
            </motion.button>
            <motion.button
              onClick={fetchStudents}
              whileHover={{ scale: 1.03 }}
              className="bg-white/5 hover:bg-white/10 text-slate-300 font-semibold py-2 px-4 rounded-xl border border-white/10 text-xs transition-all"
            >
              🔄 Refresh Users
            </motion.button>
          </div>
        </motion.div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5 border border-white/5">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Registered Students</p>
            <p className="text-2xl font-bold font-display text-white mt-1">{totalStudentsCount}</p>
          </div>
          <div className="glass-card p-5 border border-white/5">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Certificates Assigned</p>
            <p className="text-2xl font-bold font-display text-white mt-1">{totalAssignedCount}</p>
          </div>
          <div className="glass-card p-5 border border-white/5">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">NFTs Claimed</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{totalClaimedCount}</p>
          </div>
          <div className="glass-card p-5 border border-white/5">
            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Pending Claims</p>
            <p className="text-2xl font-bold font-display text-amber-400 mt-1">{totalPendingCount}</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-1 p-1 glass rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
          {["Dashboard", "Assign", "Manage", "Student Registry"].map(t => (
            <button
              key={t}
              id={`admin-tab-${t.toLowerCase().replace(" ", "-")}`}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 shrink-0 ${
                activeTab === t ? "bg-indigo-600 text-white shadow-glow-brand" : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "Dashboard" && "📊 Admin Home"}
              {t === "Assign" && "📝 Assign Certificate"}
              {t === "Manage" && "📋 Issued Log"}
              {t === "Student Registry" && "🎓 Student Registry"}
            </button>
          ))}
        </div>

        {/* DASHBOARD HOME TAB */}
        {activeTab === "Dashboard" && (
          <motion.div className="grid md:grid-cols-2 gap-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Recent Registered Students */}
            <div className="glass-card p-6 border border-white/5">
              <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2 font-display">
                <span>🎓</span> Recent Registered Students
              </h2>
              {recentRegisteredStudents.length === 0 ? (
                <div className="text-slate-500 text-sm py-8 text-center bg-slate-950/40 rounded-xl border border-white/5">
                  No registered students found. Once students log in and fill out profiles, they appear here.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentRegisteredStudents.map(s => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 text-xs truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.department} · Roll: {s.rollNumber}</p>
                      </div>
                      <span className="text-[9px] text-indigo-400 font-mono shrink-0 select-all bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {s.walletAddress.slice(0, 6)}...{s.walletAddress.slice(-4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Certificate activity */}
            <div className="glass-card p-6 border border-white/5">
              <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2 font-display">
                <span>📋</span> Recent Activity Log
              </h2>
              {recentCertificateActivity.length === 0 ? (
                <div className="text-slate-500 text-sm py-8 text-center bg-slate-950/40 rounded-xl border border-white/5">
                  No issued certificates yet. Go to the Assign tab to award your first achievement.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentCertificateActivity.map(c => (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 text-xs truncate">{c.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">To: {c.studentName} · Roll: {c.rollNumber}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        c.claimed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {c.claimed ? "🟢 Claimed" : "⏳ Assigned"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ASSIGN Tab */}
        {activeTab === "Assign" && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Form */}
            <motion.div className="lg:col-span-3 glass-card p-6 border border-white/5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="font-bold text-white mb-5 text-lg">Create & Assign Certificate</h2>
              
              <form onSubmit={handleAssign} className="space-y-4">
                
                {/* Select Student */}
                <div>
                  <label htmlFor="student-select" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Select Registered Student *
                  </label>
                  {loadingStudents ? (
                    <div className="text-slate-500 text-xs py-2">Loading students list...</div>
                  ) : (
                    <select
                      id="student-select"
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Choose Student --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.rollNumber || "No Roll"}) - {s.walletAddress.slice(0, 6)}...{s.walletAddress.slice(-4)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pre-filled Student Details Visualizer */}
                {selectedStudent && (
                  <motion.div
                    className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-400"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex justify-between">
                      <span>Roll Number:</span>
                      <span className="text-slate-200 font-medium">{selectedStudent.rollNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Department:</span>
                      <span className="text-slate-200 font-medium">{selectedStudent.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>College:</span>
                      <span className="text-slate-200 font-medium">{selectedStudent.college}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wallet ID:</span>
                      <span className="text-indigo-400 font-mono font-medium truncate max-w-[200px]" title={selectedStudent.walletAddress}>
                        {selectedStudent.walletAddress}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Title */}
                <div>
                  <label htmlFor="cert-title" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Certificate Title *
                  </label>
                  <input
                    id="cert-title"
                    type="text"
                    value={form.title}
                    onChange={e => handleFieldChange("title", e.target.value)}
                    placeholder="e.g. Smart Contract Developer Certificate"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label htmlFor="cert-cat" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                      Category
                    </label>
                    <select
                      id="cert-cat"
                      value={form.category}
                      onChange={e => handleFieldChange("category", e.target.value)}
                      className="input-field"
                    >
                      <option value="certificate">🎓 Certificate</option>
                      <option value="badge">🏅 Badge</option>
                      <option value="reward">🏆 Reward</option>
                    </select>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <label htmlFor="cert-date" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                      Issue Date
                    </label>
                    <input
                      id="cert-date"
                      type="date"
                      value={form.issueDate}
                      onChange={e => handleFieldChange("issueDate", e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Issuer */}
                <div>
                  <label htmlFor="cert-issuer" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Issuer Authority *
                  </label>
                  <input
                    id="cert-issuer"
                    type="text"
                    value={form.issuer}
                    onChange={e => handleFieldChange("issuer", e.target.value)}
                    placeholder="e.g. SVKM IoT Dhule"
                    className="input-field"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="cert-desc" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Description / Scope
                  </label>
                  <textarea
                    id="cert-desc"
                    value={form.description}
                    onChange={e => handleFieldChange("description", e.target.value)}
                    rows={2}
                    placeholder="Provide details about the student's achievement scope..."
                    className="input-field resize-none"
                  />
                </div>

                {/* Certificate File Upload */}
                <div>
                  <label htmlFor="cert-file" className="text-xs font-semibold text-slate-400 mb-1.5 block">
                    Upload Certificate Document <span className="text-slate-500 font-normal">(PDF or Image)</span>
                  </label>
                  <input
                    id="cert-file"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/10 file:text-indigo-400 file:cursor-pointer hover:file:bg-indigo-600/20 bg-slate-900/40 p-2 rounded-xl border border-white/5"
                  />
                </div>

                <motion.button
                  id="admin-assign-btn"
                  type="submit"
                  disabled={creating}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3.5 mt-2 font-semibold flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Uploading & Assigning...
                    </>
                  ) : "✅ Assign Certificate"}
                </motion.button>

              </form>
            </motion.div>

            {/* Preview Card */}
            <motion.div className="lg:col-span-2 glass-card p-6 h-fit border border-white/5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="font-bold text-white mb-5 text-lg">Visual Preview</h2>
              
              <div className="glass rounded-2xl overflow-hidden relative border border-white/5 bg-slate-950/40">
                {/* Accent line */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${
                  form.category === "badge" ? "from-yellow-500 to-orange-500" : form.category === "reward" ? "from-purple-500 to-pink-500" : "from-indigo-500 to-purple-600"
                }`} />
                
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-slate-900 border border-slate-800">
                      {form.category === "badge" ? "🏅" : form.category === "reward" ? "🏆" : "🎓"}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-snug">{form.title || "Certificate Title"}</p>
                      <p className="text-xs text-slate-400 mt-1">{form.issuer || "Issuer Authority"}</p>
                      <p className="text-[10px] text-slate-500 mt-1 capitalize">{form.category} · SVKM IoT</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 h-12 overflow-hidden leading-relaxed">
                    {form.description || "The scope details and credentials of the student certificate will appear here."}
                  </p>

                  {filePreview && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-white/5 bg-slate-950/50 aspect-video flex items-center justify-center">
                      <img
                        src={filePreview}
                        alt="Selected Certificate Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="p-2.5 bg-slate-950/50 rounded-xl text-[10px] text-slate-500 space-y-1 mb-4 font-mono">
                    <p>To: {selectedStudent ? selectedStudent.name : "Unassigned Student"}</p>
                    <p>Roll: {selectedStudent ? selectedStudent.rollNumber : "xxxxxx"}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="badge-gold">⭐ {form.category === "badge" ? 100 : form.category === "reward" ? 200 : 50} pts</span>
                    <span className="text-[10px] text-indigo-400 font-semibold">⚡ UGF Gasless</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* MANAGE (ISSUED LOG) Tab */}
        {activeTab === "Manage" && (
          <motion.div className="glass-card p-6 border border-white/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="font-bold text-white text-lg">Institutional Certificate Log</h2>
              
              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search cert or student..."
                    value={certSearch}
                    onChange={e => setCertSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50"
                  />
                </div>

                {/* Filter */}
                <select
                  value={certStatusFilter}
                  onChange={e => setCertStatusFilter(e.target.value)}
                  className="bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500/50"
                >
                  <option value="all">All Certificates</option>
                  <option value="pending">⏳ Pending Claims</option>
                  <option value="claimed">🟢 Claimed NFTs</option>
                </select>
              </div>
            </div>
            
            {filteredCertificates.length === 0 ? (
              <div className="text-slate-500 text-sm py-12 text-center bg-slate-950/40 rounded-2xl border border-white/5">
                No matching certificates found in the institutional log.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 bg-white/5">
                        <th className="py-3.5 px-3">Student Name</th>
                        <th className="py-3.5 px-3">Roll Number</th>
                        <th className="py-3.5 px-3">Certificate Title</th>
                        <th className="py-3.5 px-3">Category</th>
                        <th className="py-3.5 px-3">Document File</th>
                        <th className="py-3.5 px-3">Verification</th>
                        <th className="py-3.5 px-3">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {filteredCertificates.map(cert => (
                        <tr key={cert.id} className="hover:bg-white/5 transition-all">
                          <td className="py-3.5 px-3 font-semibold text-slate-200">{cert.studentName}</td>
                          <td className="py-3.5 px-3 font-mono text-slate-400">{cert.rollNumber}</td>
                          <td className="py-3.5 px-3 text-slate-200 max-w-[200px] truncate" title={cert.title}>{cert.title}</td>
                          <td className="py-3.5 px-3 capitalize">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              cert.category === "badge" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : cert.category === "reward" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            }`}>
                              {cert.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            {cert.certificateFileUrl ? (
                              <a
                                href={cert.certificateFileUrl}
                                download={cert.certificateFileUrl.startsWith("data:") ? `${cert.title.replace(/\s+/g, "_")}_Certificate.${cert.certificateFileUrl.split(";")[0].split("/")[1] === "pdf" ? "pdf" : "png"}` : undefined}
                                target={cert.certificateFileUrl.startsWith("data:") ? undefined : "_blank"}
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                              >
                                {cert.certificateFileUrl.startsWith("data:") ? "Download File" : "View File"}
                              </a>
                            ) : (
                              <span className="text-slate-500 font-normal">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => setSelectedCertForQR(cert)}
                              className="bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg transition-all text-[10px]"
                            >
                              🔗 QR & Link
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            {cert.claimed ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  🟢 Claimed NFT
                                </span>
                                {cert.transactionHash && (
                                  <a
                                    href={`https://sepolia.basescan.org/tx/${cert.transactionHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] text-slate-500 hover:underline font-mono"
                                  >
                                    Tx: {cert.transactionHash.slice(0, 6)}...{cert.transactionHash.slice(-4)}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-400 font-semibold flex items-center gap-1">
                                ⏳ Pending Claim
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Verification QR Modal */}
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
                        <h3 className="font-bold text-white mb-1.5 text-base font-display">Credential Verification</h3>
                        <p className="text-xs text-indigo-400 font-medium mb-4">{selectedCertForQR.title}</p>
                        
                        <div className="p-3 bg-white rounded-xl mb-4 shadow-xl">
                          <QRCodeSVG
                            value={selectedCertForQR.verificationUrl || `${window.location.origin}/verify/${selectedCertForQR.id || selectedCertForQR.certificateId}`}
                            size={150}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="M"
                          />
                        </div>
                        
                        <p className="text-[10px] text-slate-400 mb-4 select-all bg-white/5 px-2.5 py-2 rounded-lg w-full break-all font-mono border border-white/5">
                          {selectedCertForQR.verificationUrl || `${window.location.origin}/verify/${selectedCertForQR.id || selectedCertForQR.certificateId}`}
                        </p>

                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedCertForQR.verificationUrl || `${window.location.origin}/verify/${selectedCertForQR.id || selectedCertForQR.certificateId}`);
                              toast.success("Verification link copied!");
                            }}
                            className="btn-primary flex-1 py-2 text-xs font-semibold"
                          >
                            📋 Copy Link
                          </button>
                          <a
                            href={selectedCertForQR.verificationUrl || `/verify/${selectedCertForQR.id || selectedCertForQR.certificateId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary flex-1 py-2 text-xs font-semibold text-center flex items-center justify-center"
                          >
                            🔍 Open Page
                          </a>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* STUDENT REGISTRY Tab */}
        {activeTab === "Student Registry" && (
          <motion.div className="glass-card p-6 border border-white/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-bold text-white text-lg">Registered Student Registry</h2>
              
              {/* Search registry */}
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, roll, dept..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-slate-500 text-sm py-12 text-center bg-slate-950/40 rounded-2xl border border-white/5">
                No matching students found in registry.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 bg-white/5">
                      <th className="py-3.5 px-3">Student Name</th>
                      <th className="py-3.5 px-3">Roll Number</th>
                      <th className="py-3.5 px-3">Department</th>
                      <th className="py-3.5 px-3">College</th>
                      <th className="py-3.5 px-3">Wallet Address</th>
                      <th className="py-3.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-white/5 transition-all">
                        <td className="py-3.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px]">
                            {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          {s.name}
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-400">{s.rollNumber || "N/A"}</td>
                        <td className="py-3.5 px-3 text-slate-300">{s.department || "N/A"}</td>
                        <td className="py-3.5 px-3 text-slate-300">{s.college || "SVKM IoT Dhule"}</td>
                        <td className="py-3.5 px-3 font-mono text-indigo-400 select-all" title={s.walletAddress}>
                          {s.walletAddress.slice(0, 6)}...{s.walletAddress.slice(-4)}
                        </td>
                        <td className="py-3.5 px-3">
                          <button
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setActiveTab("Assign");
                              toast(`Selected ${s.name} for certificate assignment!`);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg border border-indigo-500/20 text-[10px] transition-all"
                          >
                            📝 Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
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
        select.input-field option {
          background-color: #0d0d15;
          color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
