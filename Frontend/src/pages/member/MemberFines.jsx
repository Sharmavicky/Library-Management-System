import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMyFines } from "../../services/memberService";
import useAuthStore from "../../store/authStore";
import NavBar from "../../Components/NavBar";

const getInitials  = (name = "") => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const avatarPalette = [
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-amber-100", text: "text-amber-700" },
    { bg: "bg-rose-100", text: "text-rose-700" },
];
const getAvatar    = (name = "") => avatarPalette[name.charCodeAt(0) % avatarPalette.length];
const fmtCurrency  = (n = 0) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate      = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function StatusBadge({ status }) {
    const map = {
        pending: "bg-amber-100 text-amber-700",
        partial: "bg-blue-100  text-blue-700",
        paid:    "bg-green-100 text-green-700",
        waived:  "bg-gray-100  text-gray-500",
    };
    const dot = {
        pending: "bg-amber-500",
        partial: "bg-blue-500",
        paid:    "bg-green-500",
        waived:  "bg-gray-400",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${map[status] || map.pending}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || dot.pending}`} />
            {status}
        </span>
    );
}

function SkeletonRow() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 animate-pulse">
            <div className="w-10 h-14 bg-gray-100 rounded-md shrink-0" />
            <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-20 mb-3" />
                <div className="h-2 bg-gray-100 rounded w-full" />
            </div>
        </div>
    );
}

// function MemberNav({ active }) {
//     const navigate = useNavigate();
//     const { user, logout } = useAuthStore();
//     const avatar = getAvatar(user?.username || "");
//     const links = [
//         { label: "My books",  path: "/dashboard" },
//         { label: "Browse",    path: "/browse"     },
//         { label: "History",   path: "/history"    },
//         { label: "My fines",  path: "/fines"      },
//     ];
//     return (
//         <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
//             <div className="flex items-center gap-3">
//                 <span className="text-lg font-bold text-indigo-600">LibraryOS</span>
//                 <span className="text-gray-300">|</span>
//                 <div className="flex items-center gap-1">
//                     {links.map((l) => (
//                         <button key={l.label} onClick={() => navigate(l.path)}
//                             className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
//                                 active === l.label ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-indigo-600"
//                             }`}>
//                             {l.label}
//                         </button>
//                     ))}
//                 </div>
//             </div>
//             <div className="flex items-center gap-3">
//                 <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} text-[11px] font-bold flex items-center justify-center`}>
//                     {getInitials(user?.username || "U")}
//                 </div>
//                 <span className="text-sm font-medium text-gray-700">{user?.username}</span>
//                 <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">Member</span>
//                 <button onClick={() => { logout(); navigate("/login"); }} className="text-sm text-gray-400 hover:text-red-500 transition">Sign out</button>
//             </div>
//         </nav>
//     );
// }

export default function MyFines() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [filter, setFilter] = useState("all");
    const [page,   setPage]   = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["my-fines", user?._id, filter, page],
        queryFn:  () => getMyFines(user?._id, page),
        enabled:  !!user?._id,
        keepPreviousData: true,
    });

    const allFines       = data?.fines        ?? [];
    const pagination     = data?.pagination   ?? {};
    const totalPending   = data?.totalPending ?? 0;

    const filtered = filter === "all"
        ? allFines
        : allFines.filter((f) => f.status === filter);

    const filterTabs = [
        { key: "all",     label: "All"     },
        { key: "pending", label: "Pending" },
        { key: "partial", label: "Partial" },
        { key: "paid",    label: "Paid"    },
        { key: "waived",  label: "Waived"  },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="member" />

            <div className="p-5 max-w-3xl mx-auto flex flex-col gap-5">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">My fines</h1>
                        <p className="text-sm text-gray-400 mt-0.5">Your complete fine history</p>
                    </div>
                    {totalPending > 0 && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                            <span className="text-xs text-red-600">Outstanding</span>
                            <span className="text-base font-bold text-red-700">{fmtCurrency(totalPending)}</span>
                        </div>
                    )}
                </div>

                {/* Outstanding banner */}
                {!isLoading && totalPending > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                                <line x1="12" y1="1" x2="12" y2="23"/>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">You have unpaid fines</p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Outstanding balance of <span className="font-bold">{fmtCurrency(totalPending)}</span>. Please pay at the library counter to resume borrowing.
                            </p>
                        </div>
                    </div>
                )}

                {/* All clear state */}
                {!isLoading && totalPending === 0 && allFines.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <p className="text-sm text-green-700 font-medium">All fines cleared — you're good to borrow!</p>
                    </div>
                )}

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                    {filterTabs.map((tab) => (
                        <button key={tab.key} onClick={() => { setFilter(tab.key); setPage(1); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                                filter === tab.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-indigo-600"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Fines list */}
                <div className="flex flex-col gap-3">
                    {isLoading
                        ? Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        : filtered.length === 0
                        ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    {filter === "all" ? "No fines on your account" : `No ${filter} fines`}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Keep returning books on time!</p>
                            </div>
                        )
                        : filtered.map((fine, i) => {
                            const balance   = fine.totalAmount - fine.paidAmount;
                            const bookTitle = fine.issue?.book?.title || fine.issue?.bookSnapshot?.title || "Unknown book";
                            const isSettled = fine.status === "paid" || fine.status === "waived";
                            const thumbColors = ["bg-indigo-500","bg-teal-500","bg-amber-500","bg-rose-500","bg-purple-500","bg-blue-500"];
                            const thumbColor  = thumbColors[bookTitle.charCodeAt(0) % thumbColors.length];

                            return (
                                <div key={fine._id || i}
                                    className={`bg-white border rounded-xl p-4 flex gap-4 transition ${
                                        !isSettled ? "border-red-200" : "border-gray-200"
                                    }`}>
                                    {/* Book spine */}
                                    <div className={`w-10 h-14 rounded-md ${thumbColor} flex items-end justify-center pb-1 shrink-0 opacity-80`}>
                                        <span className="text-[7px] font-bold text-white/80 text-center leading-tight px-0.5">{bookTitle.slice(0,6)}</span>
                                    </div>

                                    {/* Fine details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{bookTitle}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {fine.daysOverdue} day{fine.daysOverdue !== 1 ? "s" : ""} overdue · ₹{fine.ratePerDay}/day
                                                </p>
                                            </div>
                                            <StatusBadge status={fine.status} />
                                        </div>

                                        {/* Fine breakdown */}
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                                                <p className="text-xs font-bold text-gray-900">{fmtCurrency(fine.totalAmount)}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Total fine</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                                                <p className="text-xs font-bold text-green-700">{fmtCurrency(fine.paidAmount)}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Paid</p>
                                            </div>
                                            <div className={`rounded-lg px-3 py-2 text-center ${balance > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                                                <p className={`text-xs font-bold ${balance > 0 ? "text-red-600" : "text-gray-400"}`}>
                                                    {fmtCurrency(balance)}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">Balance</p>
                                            </div>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex items-center justify-between mt-2.5">
                                            <p className="text-[10px] text-gray-400">
                                                {fine.status === "paid"
                                                    ? `Paid on ${fmtDate(fine.paidAt)}`
                                                    : fine.status === "waived"
                                                    ? `Waived — ${fine.waivedReason || "by admin"}`
                                                    : `Due from ${fmtDate(fine.issue?.dueDate)}`}
                                            </p>
                                            {/* Progress bar for partial */}
                                            {fine.status === "partial" && fine.totalAmount > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${(fine.paidAmount / fine.totalAmount) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-gray-400">
                                                        {Math.round((fine.paidAmount / fine.totalAmount) * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">← Prev</button>
                            <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">Next →</button>
                        </div>
                    </div>
                )}

                {/* Back link */}
                <button onClick={() => navigate("/member/dashboard")}
                    className="text-sm text-gray-400 cursor-pointer hover:text-indigo-600 transition text-center">
                    ← Back to dashboard
                </button>
            </div>
        </div>
    );
}