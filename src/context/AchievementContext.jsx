import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  collection, query, where, onSnapshot, doc, updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useWallet } from "./WalletContext";

const AchievementContext = createContext(null);

export function AchievementProvider({ children }) {
  const { address } = useWallet();

  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0, certificates: 0, badges: 0, rewards: 0,
  });

  // Real-time listener for student's assigned certificates
  useEffect(() => {
    if (!address) {
      setAvailableAchievements([]);
      setStats({ total: 0, certificates: 0, badges: 0, rewards: 0 });
      return;
    }
    
    setIsLoading(true);
    let unsub = () => {};
    try {
      const q = query(
        collection(db, "certificates"),
        where("studentWalletAddress", "==", address.toLowerCase())
      );
      
      unsub = onSnapshot(q, (snap) => {
        const certs = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // Fallbacks to support older components checking specific naming schemes
            type: data.category || data.type || "certificate",
            image: data.category === "badge" ? "🏅" : data.category === "reward" ? "🏆" : "🎓",
            color: data.category === "badge" ? "#f59e0b" : data.category === "reward" ? "#a855f7" : "#6366f1",
            gradient: data.category === "badge" ? "from-yellow-500 to-orange-500" : data.category === "reward" ? "from-purple-500 to-pink-500" : "from-indigo-500 to-purple-600",
            rarity: data.category === "badge" ? "Rare" : data.category === "reward" ? "Epic" : "Common",
            points: data.category === "badge" ? 100 : data.category === "reward" ? 200 : 50,
            issuerName: data.issuer || "SVKM IoT Dhule",
            eventName: data.title || "Academic Achievement",
            
            // Compatibility mappings for claimed certificates
            txHash: data.transactionHash || data.txHash || null,
            mintedAt: data.claimedAt || data.mintedAt || null,
          };
        });

        setAvailableAchievements(certs);
        
        setStats({
          total:        certs.length,
          certificates: certs.filter(c => c.category === "certificate" || c.type === "certificate").length,
          badges:       certs.filter(c => c.category === "badge" || c.type === "badge").length,
          rewards:      certs.filter(c => c.category === "reward" || c.type === "reward").length,
        });
        setIsLoading(false);
      }, (err) => {
        console.error("Firestore onSnapshot error:", err);
        setIsLoading(false);
      });
    } catch (err) {
      console.error("Error setting up Firestore listener:", err);
      setIsLoading(false);
    }
    return () => unsub();
  }, [address]);

  // Save/update certificate record inside Firestore on successful claim
  const saveMintedNFT = useCallback(async ({
    achievementId, txHash, tokenId
  }) => {
    try {
      const certRef = doc(db, "certificates", achievementId);
      await updateDoc(certRef, {
        claimed: true,
        tokenId: tokenId.toString(),
        transactionHash: txHash,
        claimedAt: new Date().toISOString(),
        status: "claimed",
      });
    } catch (err) {
      console.error("Failed to update certificate claim in Firestore:", err);
    }
  }, []);

  // Check if a certificate is already claimed
  const isClaimed = useCallback((achievementId) => {
    const cert = availableAchievements.find(c => c.id === achievementId);
    return cert ? cert.claimed : false;
  }, [availableAchievements]);

  // Dynamically filter claimed achievements for My NFTs / Timeline views
  const myNFTs = availableAchievements.filter(c => c.claimed);

  const value = {
    availableAchievements,
    myNFTs,
    stats,
    isLoading,
    isClaimed,
    saveMintedNFT,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
}

export function useAchievement() {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error("useAchievement must be used within AchievementProvider");
  return ctx;
}

export default AchievementContext;
