<<<<<<< HEAD
# 🎓 Campus Achievement Wallet
    https://caw-26.vercel.app/
> **Instantly Verifiable NFT Achievement Certificates** on Base Sepolia using UGF (gasless bonus included)

[![Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-blue)](https://sepolia.basescan.org)
[![UGF Powered](https://img.shields.io/badge/Gas-UGF%20Gasless-blueviolet)](https://universalgasframework.com)
[![No ETH](https://img.shields.io/badge/ETH-Not%20Required-green)]()

## 🚀 What Is This?

**Campus Achievement Wallet** allows students to claim academic certificates, hackathon badges, and achievement rewards as ERC-721 NFTs on the **Base Sepolia** blockchain — **without paying any ETH for gas**.

Gas fees are handled by **UGF (Universal Gas Framework)** using **TYI_MOCK_USD** (testnet Mock USD stablecoin).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🦊 MetaMask Connect | One-click wallet connection with Base Sepolia auto-switch |
| 🏆 Self-Claim Flow | Students claim NFTs directly — admin creates, students claim |
| ⚡ UGF Gasless | No ETH required — gas paid in TYI_MOCK_USD via UGF |
| 🎓 NFT Certificates | ERC-721 with base64 SVG art embedded on-chain |
| 📊 Dashboard | Real-time NFT gallery with blockchain timeline |
| 🔍 Verification | On-chain lookup + QR code for any achievement |
| ⚙️ Admin Panel | Create achievements, templates, manage catalog |
| 🔥 Framer Motion | Smooth animations, flip cards, confetti |

---

## 🛠 Tech Stack

```
Frontend:   Vite + React 18 + Tailwind CSS + Framer Motion
Blockchain: Base Sepolia (chainId: 84532) + Solidity + ERC-721
Wallet:     MetaMask + ethers.js v6
Gasless:    @tychilabs/react-ugf + @tychilabs/ugf-testnet-js
Backend:    Firebase Auth + Firestore + Storage
Contract:   OpenZeppelin ERC721URIStorage + AccessControl
```

---

## ⚡ Quick Start

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) (v18+ recommended)

### 2. Install dependencies
```bash
cd "CAMPUS WALLET"
npm install
```

### 3. Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Google provider)
4. Enable **Firestore Database** (start in test mode)
5. Copy your config into `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

---

## 📜 Smart Contract Deployment (Optional for full flow)

> The UI works in demo mode without deploying the contract. Deploy for live NFT minting.

### Prerequisites
- Some Base Sepolia ETH (for **deployer only** — students need none)
- Get testnet ETH from [faucet.base.org](https://faucet.base.org)

### Deploy
```bash
# Add deployer private key to .env.local
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Compile
npm run compile

# Deploy to Base Sepolia
npm run deploy:baseSepolia
```

The deploy script automatically updates `src/config/contract.js` with the new address.

---

## ⚡ Getting TYI_MOCK_USD (for students)

Students need Mock USD to pay for gas via UGF:

1. Visit [universalgasframework.com](https://universalgasframework.com)
2. Connect MetaMask to Base Sepolia
3. Use the faucet to get TYI_MOCK_USD
4. Come back and claim NFTs — no ETH needed!

---

## 🔄 UGF Transaction Flow

```
Student clicks "Claim NFT"
  ↓
ClaimModal opens (shows achievement + gas info)
  ↓
Student clicks "⚡ Claim NFT — Gasless"
  ↓
useMintNFT() encodes mintAchievement() calldata
  ↓
openUGF({ signer, tx: { to, data }, destChainId: "84532" })
  ↓
UGF Modal opens → shows TYI_MOCK_USD balance + gas cost
  ↓
Student approves Mock USD payment (no ETH!)
  ↓
UGF sponsors gas → submits tx on Base Sepolia
  ↓
Transaction confirmed → NFT minted
  ↓
SuccessScreen shows txHash + "Minted on Base Sepolia via UGF"
  ↓
Firebase Firestore updated → Dashboard refreshes
```

---

## 🗂 Project Structure

```
CAMPUS WALLET/
├── contracts/
│   └── CampusAchievement.sol    # ERC-721 + AccessControl
├── scripts/
│   └── deploy.js                # Hardhat deploy → Base Sepolia
├── src/
│   ├── config/
│   │   ├── firebase.js          # Firebase init
│   │   ├── contract.js          # ABI + address
│   │   ├── ugf.js               # UGF config
│   │   └── achievements.js      # Demo data
│   ├── context/
│   │   ├── WalletContext.jsx    # MetaMask state
│   │   └── AchievementContext.jsx
│   ├── hooks/
│   │   └── useMintNFT.js        # ⚡ UGF gasless mint
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── NFTCard.jsx          # 3D flip card
│   │   ├── ClaimModal.jsx
│   │   ├── SuccessScreen.jsx    # Confetti + txHash
│   │   ├── UGFBadge.jsx         # UGF branding
│   │   ├── StatsGrid.jsx
│   │   └── AchievementTimeline.jsx
│   ├── pages/
│   │   ├── Landing.jsx          # Hero + how-it-works
│   │   ├── Dashboard.jsx        # Student view
│   │   ├── Achievements.jsx     # Claim flow
│   │   ├── AdminPanel.jsx       # Teacher panel
│   │   └── Verify.jsx           # On-chain verification
│   ├── styles/index.css
│   ├── App.jsx
│   └── main.jsx                 # UGFProvider root
├── .env.local                   # Your secrets (never commit)
├── hardhat.config.js
└── package.json
```

---

## 🏆 Hackathon Highlights

- ✅ **Base Sepolia** — deployed and verified
- ✅ **UGF Integration** — real gasless tx using `openUGF()`
- ✅ **No ETH** — TYI_MOCK_USD handles all gas
- ✅ **ERC-721 NFTs** — with on-chain SVG metadata
- ✅ **Beginner UX** — blockchain feels invisible
- ✅ **Real-world use case** — tamper-proof academic credentials

---

## 🌐 Links

| Resource | URL |
|---|---|
| UGF Documentation | https://universalgasframework.com |
| Base Sepolia Explorer | https://sepolia.basescan.org |
| React-UGF npm | https://npmjs.com/package/@tychilabs/react-ugf |
| Base Faucet | https://faucet.base.org |

---

*Built with · Verified on-chain · Powered by UGF · No ETH Required*
=======
# Certificate-verification
>>>>>>> bf2eaa01c49284a8c0a14ee6ed73e983616ce565
