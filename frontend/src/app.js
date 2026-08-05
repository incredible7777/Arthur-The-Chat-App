import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/authcontext";
import AuthModal from "./components/accounts/authmodal";
import ChatDashboard from "./components/chat/chatdashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import { Loader2 } from "lucide-react";

const MainContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isAdminView, setIsAdminView] = useState(
    window.location.pathname === "/admin"
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(window.location.pathname === "/admin");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Show custom Arthur logo & wordmark loading screen
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0B0E14] text-white gap-6">
        <div className="relative flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Arthur Logo"
            className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          />
        </div>
        
        <img
          src="/arthur-wordmark.png"
          alt="ARTHUR"
          className="h-9 object-contain"
        />

        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium tracking-wide pt-2">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          <span>Loading Arthur Workspace...</span>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard if path is /admin or admin view toggled
  if (isAdminView) {
    return <AdminDashboard />;
  }

  // If authenticated -> show Chat Dashboard. Else -> show Auth Modal (OTP / Guest)
  return isAuthenticated ? <ChatDashboard /> : <AuthModal />;
};

function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

export default App;