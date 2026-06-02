import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function FullScreenLoader() {
  return (
    <div className="min-h-[60vh] grid place-items-center text-neutral-300">
      Loading...
    </div>
  );
}

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />;
  return children;
}

export function RoleRoute({ children, allow = [] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (allow.length && !allow.includes(user.role)) return <Navigate to="/dashboard/account" replace />;
  return children;
}
