import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";

export const ProtectedRoute = ({ children, allowedRoles = ["student", "admin"] }) => {
  const { user, loading } = useAuth();
  const { isConnected, isConnecting } = useWallet();

  // If authentication or wallet connection is loading/restoring, show a premium spinner
  if (loading || isConnecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-indigo-400 font-display text-xs tracking-wider animate-pulse uppercase">
            Verifying Identity...
          </p>
        </div>
      </div>
    );
  }

  // 1. If wallet not connected, redirect to "/" (Landing Page)
  if (!isConnected || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. If wallet connected but profile not completed, redirect to "/complete-profile"
  if (!user.profileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  // 3. If connected and completed, but role is not authorized, redirect to "/"
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;