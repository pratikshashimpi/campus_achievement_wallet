import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

export async function ensureDemoCertificateForUser(userProfile) {
  try {
    if (!userProfile?.walletAddress) return;

    const wallet = userProfile.walletAddress.toLowerCase();
    const certificateId = `demo-${wallet}`;
    const certRef = doc(db, "certificates", certificateId);

    const existing = await getDoc(certRef);
    if (existing.exists()) return;

    const demoCertificate = {
      certificateId,
      title: "UGF Demo Achievement Certificate",
      description:
        "This demo certificate is automatically assigned so judges and organizers can test the gasless NFT claim flow using UGF.",
      category: "certificate",
      type: "certificate",

      issuer: "Campus Achievement Wallet",
      issuerName: "Campus Achievement Wallet",
      eventName: "UGF Hackathon Demo",
      issueDate: new Date().toISOString().split("T")[0],

      studentWalletAddress: wallet,
      studentName: userProfile.name || "Demo User",
      rollNumber: userProfile.rollNumber || "DEMO-001",
      department: userProfile.department || "Demo Department",
      college: userProfile.college || "Demo College",

      certificateFileUrl: "",
      metadataUrl: "",
      status: "assigned",
      claimed: false,
      tokenId: null,
      transactionHash: null,
      txHash: null,

      verificationUrl: `${window.location.origin}/verify/${certificateId}`,
      assignedByAdminWallet: "system-demo",
      isDemoCertificate: true,

      createdAt: serverTimestamp(),
      claimedAt: null,
    };

    await setDoc(certRef, demoCertificate);
  } catch (error) {
    console.error("Demo certificate creation failed:", error);
  }
}