import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import useAuthStore from "../store/authStore";

// ─── icons ──────────────────────────────────────────────────────────────────
import {
    MdOutlineDashboard,
    MdMenuBook,
    MdPeople,
    MdPayments,
    MdPendingActions,
    MdAssignmentTurnedIn,
    MdHistory,
    MdOutlineLogout
} from "react-icons/md";


// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Tab config ───────────────────────────────────────────────────────────────
const adminTabs = [
    {
        label: "Dashboard", path: "/admin/dashboard",
        icon: <MdOutlineDashboard size={20} />,
    },
    {
        label: "Books", path: "/admin/books",
        icon: <MdMenuBook size={20} />,
    },
    {
        label: "Members", path: "/admin/users",
        icon: <MdPeople size={20} />,
    },
    {
        label: "Issuances", path: "/admin/issuances",
        icon: <MdAssignmentTurnedIn size={20} />,
    },
    {
        label: "Fines", path: "/admin/fines",
        icon: <MdPayments size={20} />,
    },
    {
        label: "Requests", path: "/admin/requests",
        icon: <MdPendingActions size={20} />,
    }
];

const memberTabs = [
    {
        label: "Dashboard", path: "/member/dashboard",
        icon: <MdOutlineDashboard size={20} />,
    },
    {
        label: "Catalog", path: "/member/catalog",
        icon: <MdMenuBook size={20} />,
    },
    {
        label: "My Fines", path: "/member/fines",
        icon: <MdPayments size={20} />,
    },
    {
        label: "History", path: "/member/history",
        icon: <MdHistory size={20} />,
    },
];

// logout modal 
function LogoutModal({ onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
                <h2 className="text-xl font-semibold mb-4">Confirm Logout</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium cursor-pointer hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
export default function NavBar({ userType = "admin" }) {
    const queryClient = useQueryClient();
    const navigate  = useNavigate();
    const location  = useLocation();
    const { user, logout } = useAuthStore();

    const isAdmin        = userType === "admin";
    const tabs           = isAdmin ? adminTabs : memberTabs;
    const defaultUsername = isAdmin ? "Admin" : "Member";

    const [toast, setToast] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(true);
    }

    const showToast = (message, type="success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    const logoutMutation = useMutation({
        mutationFn: () => logout(),
        onSuccess: () => {
            queryClient.clear(); // clear all cached data
            navigate("/login", { replace: true });
        },
        onError: (err) => {
            showToast(err.response?.data?.message || "Logout failed. Please try again.");
        }
    })

    // active tab — matches current path
    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
                    toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                    {toast.message}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                DESKTOP NAV — hidden on mobile, visible md and above
                Exactly as your original NavBar — untouched
            ══════════════════════════════════════════════════════════════ */}
            <nav className="hidden md:flex bg-white border-b border-gray-200 px-6 py-3 items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-indigo-600">ReadMatrix</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-sm text-gray-500">
                        {isAdmin ? "Admin dashboard" : "Member dashboard"}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className={`text-sm font-medium transition cursor-pointer ${
                                isActive(tab.path)
                                    ? "text-indigo-600"
                                    : "text-gray-600 hover:text-indigo-600"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                            {getInitials(user?.username || defaultUsername)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            {user?.username || defaultUsername}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 hover:text-red-500 transition cursor-pointer font-medium"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE TOP HEADER — visible on mobile only
                Shows logo + username avatar + sign out
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-indigo-600">ReadMatrix</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isAdmin
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-teal-50 text-teal-700"
                    }`}>
                        {isAdmin ? "Admin" : "Member"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                        {user?.username || defaultUsername}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                        {getInitials(user?.username || defaultUsername)}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-400 cursor-pointer hover:text-red-500 transition"
                    >
                        <MdOutlineLogout size={18} />
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE BOTTOM NAV — fixed at bottom, visible on mobile only
                Icon + label for each tab, active tab highlighted in indigo
            ══════════════════════════════════════════════════════════════ */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200">
                <div className="flex items-stretch">
                    {tabs.map((tab) => {
                        const active = isActive(tab.path);
                        return (
                            <button
                                key={tab.path}
                                onClick={() => navigate(tab.path)}
                                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                                    active ? "text-indigo-600" : "text-gray-400"
                                }`}
                            >
                                {/* icon */}
                                {tab.icon}
                                {/* label */}
                                <span className={`text-[10px] font-medium leading-none ${
                                    active ? "text-indigo-600" : "text-gray-400"
                                }`}>
                                    {tab.label}
                                </span>
                                {/* active dot */}
                                {active && (
                                    <span className="w-1 h-1 rounded-full bg-indigo-600" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <LogoutModal
                    onConfirm={() => {
                        logoutMutation.mutate();
                        setShowLogoutModal(false);
                    }}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}
        </>
    );
}