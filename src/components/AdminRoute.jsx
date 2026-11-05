import { Navigate } from "react-router-dom";
import { userAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { session, profile, authLoading } = userAuth();

  // Wait while Supabase checks the current session
  if (authLoading || (session && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
        <p className="text-sm font-medium text-slate-500">
          Verifying administrator access...
        </p>
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  // Signed in, but not an administrator
  if (profile.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Administrator verified
  return children;
}
