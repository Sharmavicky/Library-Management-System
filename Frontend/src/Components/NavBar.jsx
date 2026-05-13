import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const getInitials = (name = "") => {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function NavBar() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    // logout function
    const handleLogout = () => {
        logout();
        navigate("/login", { replace : true });
    }

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-indigo-600">LibraryOS</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">Admin dashboard</span>
            </div>
            <div className="flex items-center gap-4">
                {/* Quick action buttons */}
                <button
                    onClick={() => (navigate("/admin/dashboard"))}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition font-medium cursor-pointer"
                >
                    Dashboard
                </button>
                <button
                    onClick={() => navigate("/admin/books")}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition font-medium cursor-pointer"
                >
                    Books
                </button>
                <button
                    onClick={() => navigate("/admin/users")}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition font-medium cursor-pointer"
                >
                    Members
                </button>
                <button
                    onClick={() => navigate("/admin/issuances")}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition font-medium cursor-pointer"
                >
                    Issuances
                </button>
                <button
                    onClick={() => navigate("/admin/fines")}
                    className="text-sm text-gray-600 hover:text-indigo-600 transition font-medium cursor-pointer"
                >
                    Fines
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                        {getInitials(user?.username || "Admin")}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.username || "Admin"}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-red-500 transition cursor-pointer font-medium"
                >
                    Sign out
                </button>
            </div>
        </nav>
    )
}