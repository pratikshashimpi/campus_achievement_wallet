import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UGFProvider } from "@tychilabs/react-ugf";

import App from "./App";
import { WalletProvider } from "./context/WalletContext";
import { AchievementProvider } from "./context/AchievementContext";
import { AuthProvider } from "./context/AuthContext";     // ← Fixed import

import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      <AuthProvider>
        <UGFProvider mode="testnet">
          <AchievementProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "#1a1a28",
                    color: "#f1f5f9",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "12px",
                    fontSize: "14px",
                  },
                  success: {
                    iconTheme: { primary: "#10b981", secondary: "#0a0a0f" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#0a0a0f" },
                  },
                  duration: 4000,
                }}
              />
            </BrowserRouter>
          </AchievementProvider>
        </UGFProvider>
      </AuthProvider>
    </WalletProvider>
  </React.StrictMode>
);