import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

// protect any route that needs authentication
export  function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    return isAuthenticated ? children : <Navigate to="/login" replace/>
}

// protect admin-route only
export function AdminRoute({ children }) {
    const { isAuthenticated, user } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />
    if (user?.role !== "admin") return <Navigate to="/login" replace />
    return children;
}