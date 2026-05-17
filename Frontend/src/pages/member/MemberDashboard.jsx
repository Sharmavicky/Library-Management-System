import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    getMyProfile,
    getMyIssuedBooks,
    getReadAccess,
    getMyFines,
    getAllBooks,
    searchBooks,
} from "../../services/memberService";
import useAuthStore from "../../store/authStore";
import NavBar from "../../Components/NavBar";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const avatarPalette = [
    { bg: "bg-teal-100",   text: "text-teal-700"   },
    { bg: "bg-purple-100", text: "text-purple-700"  },
    { bg: "bg-blue-100",   text: "text-blue-700"    },
    { bg: "bg-amber-100",  text: "text-amber-700"   },
    { bg: "bg-rose-100",   text: "text-rose-700"    },
];
const getAvatar  = (name = "") => avatarPalette[name.charCodeAt(0) % avatarPalette.length];
const fmtDate    = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtCurrency = (n = 0) => `₹${Number(n).toLocaleString("en-IN")}`;
const daysUntilDue = (dueDate) =>
    Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

// ─── Due date urgency bar ─────────────────────────────────────────────────────
function DueDateBar({ dueDate, status }) {
    const days      = daysUntilDue(dueDate);
    const isOverdue = status === "overdue" || days < 0;
    const isUrgent  = days >= 0 && days <= 3;

    const barColor  = isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-green-500";
    const textColor = isOverdue ? "text-red-600" : isUrgent ? "text-amber-600" : "text-green-600";
    const fillPct   = isOverdue ? 100 : Math.max(0, Math.min(100, ((14 - days) / 14) * 100));

    return (
        <div className="mt-2">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${fillPct}%` }} />
            </div>
            <p className={`text-[11px] mt-1 font-medium ${textColor}`}>
                {isOverdue
                    ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
                    : days === 0
                    ? "Due today!"
                    : `${days} day${days !== 1 ? "s" : ""} left · Due ${fmtDate(dueDate)}`}
            </p>
        </div>
    );
}

// ─── Borrowed book card ───────────────────────────────────────────────────────
function BorrowedBookCard({ issue }) {
    const navigate = useNavigate();
    const [loading,  setLoading]  = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const title      = issue.bookSnapshot?.title  || issue.book?.title  || "Unknown";
    const author     = issue.bookSnapshot?.author || issue.book?.author || "";
    const isOverdue  = issue.status === "overdue";
    const isReturned = issue.status === "returned";

    const thumbColors = [
        "bg-indigo-500", "bg-teal-500", "bg-amber-500",
        "bg-rose-500", "bg-purple-500", "bg-blue-500",
    ];
    const thumbColor = thumbColors[title.charCodeAt(0) % thumbColors.length];

    // ── Read handler ──────────────────────────────────────────────────────────
    const handleRead = async () => {
        if (isReturned || loading) return;
        setErrorMsg("");
        setLoading(true);
        try {
            const data = await getReadAccess(issue._id);
            if (data.plainTextUrl) {
                navigate(`/member/issues/read/${issue._id}`);
            } else {
                setErrorMsg("No read URL available for this book.");
            }
        } catch (err) {
            // backend returns 403 with fine details when overdue
            const msg = err.response?.data?.message || "Could not get read access.";
            const fine = err.response?.data?.fine;
            setErrorMsg(fine ? `${msg} Fine: ₹${fine}` : msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white border rounded-xl p-4 flex gap-3 transition ${
            isOverdue ? "border-red-200 bg-red-50/40" : "border-gray-200 hover:border-indigo-200"
        }`}>
            {/* Book spine thumbnail — clickable if active */}
            <button
                onClick={handleRead}
                disabled={isReturned || loading}
                title={isReturned ? "Book returned" : "Read this book"}
                className={`w-10 h-14 rounded-md ${thumbColor} flex items-end justify-center pb-1 shrink-0 transition ${
                    !isReturned ? "hover:opacity-80 cursor-pointer" : "cursor-default opacity-60"
                }`}
            >
                <span className="text-[7px] font-bold text-white/80 text-center leading-tight px-0.5 break-all">
                    {title.slice(0, 8)}
                </span>
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{author}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isOverdue  ? "bg-red-100 text-red-700"
                      : isReturned ? "bg-gray-100 text-gray-500"
                      :              "bg-green-100 text-green-700"
                    }`}>
                        {isOverdue ? "Overdue" : isReturned ? "Returned" : "Active"}
                    </span>
                </div>

                {!isReturned && <DueDateBar dueDate={issue.dueDate} status={issue.status} />}
                {isReturned && (
                    <p className="text-[11px] text-gray-400 mt-1">Returned {fmtDate(issue.returnedAt)}</p>
                )}

                {/* Error message from backend (overdue block, no URL etc) */}
                {errorMsg && (
                    <p className="text-[11px] text-red-500 mt-1.5">{errorMsg}</p>
                )}

                {/* Read button — only for active books */}
                {!isReturned && (
                    <button
                        onClick={handleRead}
                        disabled={loading}
                        className={`mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                            isOverdue
                                ? "bg-red-50 text-red-500 border border-red-200 cursor-not-allowed opacity-60"
                                : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                        }`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Getting access...
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                </svg>
                                {isOverdue ? "Access blocked — overdue" : "Read book"}
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Catalog book card ────────────────────────────────────────────────────────
function CatalogCard({ book }) {
    const thumbColors = [
        "bg-indigo-500", "bg-teal-500", "bg-amber-500",
        "bg-rose-500", "bg-purple-500", "bg-blue-500",
    ];
    const thumbColor = thumbColors[book.title.charCodeAt(0) % thumbColors.length];
    const available  = book.availableCopies > 0;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3 hover:border-indigo-200 transition">
            <div className={`w-9 h-12 rounded-md ${thumbColor} flex items-end justify-center pb-1 shrink-0`}>
                <span className="text-[7px] font-bold text-white/80 text-center leading-tight px-0.5">
                    {book.title.slice(0, 6)}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                <p className="text-[11px] text-gray-400 truncate">{book.author}</p>
                <span className={`mt-1.5 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                    {available ? `${book.availableCopies} available` : "Unavailable"}
                </span>
            </div>
        </div>
    );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────
function SkeletonBookCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3 animate-pulse">
            <div className="w-10 h-14 bg-gray-100 rounded-md shrink-0" />
            <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-32 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-20 mb-3" />
                <div className="h-1.5 bg-gray-100 rounded-full w-full" />
            </div>
        </div>
    );
}

function SkeletonStatCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-2.5 bg-gray-100 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-100 rounded w-12" />
        </div>
    );
}

// ─── Member nav (same structure as admin nav) ─────────────────────────────────
function MemberNav({ active }) {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const avatar = getAvatar(user?.username || "");

    const links = [
        { label: "My books",  path: "/dashboard" },
        { label: "Browse",    path: "/catalog"   },
        { label: "History",   path: "/history"    },
        { label: "My fines",  path: "/fines"      },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-indigo-600">LibraryOS</span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1">
                    {links.map((l) => (
                        <button
                            key={l.label}
                            onClick={() => navigate(l.path)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                active === l.label
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-gray-500 hover:text-indigo-600"
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} text-[11px] font-bold flex items-center justify-center`}>
                    {getInitials(user?.username || "U")}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                    Member
                </span>
                <button
                    onClick={() => { logout(); navigate("/login"); }}
                    className="text-sm text-gray-400 hover:text-red-500 transition"
                >
                    Sign out
                </button>
            </div>
        </nav>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemberDashboard() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab,   setActiveTab]   = useState("active");

    // ── My profile (has outstandingFine) ─────────────────────────────────────
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ["my-profile"],
        queryFn:  getMyProfile,
    });

    // ── My issued books ───────────────────────────────────────────────────────
    const { data: issuancesData, isLoading: issuancesLoading } = useQuery({
        queryKey: ["my-issuances"],
        queryFn:  () => getMyIssuedBooks(1),
        refetchInterval: 1000 * 60 * 5,
    });

    // ── My fines ──────────────────────────────────────────────────────────────
    const { data: finesData, isLoading: finesLoading } = useQuery({
        queryKey: ["my-fines", user?._id],
        queryFn:  () => getMyFines(user?._id, 1),
        enabled:  !!user?._id,
    });

    // ── Catalog / search ──────────────────────────────────────────────────────
    const { data: catalogData, isLoading: catalogLoading } = useQuery({
        queryKey: ["catalog", searchQuery],
        queryFn:  () => searchQuery ? searchBooks(searchQuery, 1) : getAllBooks(1, 12),
        keepPreviousData: true,
    });

    // ── Derived values ────────────────────────────────────────────────────────
    const outstandingFine = profileData?.outstandingFine ?? 0;
    const allIssuances    = issuancesData?.books          ?? [];
    const activeBooks     = allIssuances.filter((b) => b.status !== "returned");
    const historyBooks    = allIssuances.filter((b) => b.status === "returned");
    const overdueCount    = activeBooks.filter((b)  => b.status === "overdue").length;
    const pendingFines    = (finesData?.fines ?? []).filter((f) => ["pending", "partial"].includes(f.status));
    const totalPending    = finesData?.totalPending ?? 0;
    const catalogBooks    = catalogData?.books        ?? [];
    const displayBooks    = activeTab === "active" ? activeBooks : historyBooks;

    const statCards = [
        {
            label: "Borrowed",
            value: activeBooks.length,
            sub: `${overdueCount} overdue`,
            subColor: overdueCount > 0 ? "text-red-500" : "text-gray-400",
            accent: "border-l-indigo-500",
            iconBg: "bg-indigo-50",
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
        },
        {
            label: "Total read",
            value: allIssuances.length,
            sub: "All time",
            subColor: "text-gray-400",
            accent: "border-l-teal-500",
            iconBg: "bg-teal-50",
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
        },
        {
            label: "Overdue",
            value: overdueCount,
            sub: overdueCount > 0 ? "Return soon!" : "All on time ✓",
            subColor: overdueCount > 0 ? "text-red-500" : "text-green-600",
            accent: "border-l-red-500",
            iconBg: "bg-red-50",
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
        },
        {
            label: "Outstanding fine",
            value: fmtCurrency(outstandingFine),
            sub: outstandingFine > 0 ? "Pay at counter" : "No dues ✓",
            subColor: outstandingFine > 0 ? "text-amber-600" : "text-green-600",
            accent: "border-l-amber-500",
            iconBg: "bg-amber-50",
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="member" />

            <div className="p-5 max-w-300 mx-auto flex flex-col gap-5">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Welcome back, {user?.username?.split(" ")[0] || "there"} 👋
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {new Date().toLocaleDateString("en-IN", {
                                weekday: "long", day: "numeric", month: "long", year: "numeric",
                            })}
                        </p>
                    </div>
                </div>

                {/* Overdue alert */}
                {!issuancesLoading && overdueCount > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-400 text-red-500 font-bold text-[10px] shrink-0">!</span>
                        <span>
                            You have <span className="font-semibold">{overdueCount} overdue book{overdueCount !== 1 ? "s" : ""}</span>. Please return {overdueCount === 1 ? "it" : "them"} to avoid additional fines.
                        </span>
                    </div>
                )}

                {/* Fine warning */}
                {!finesLoading && outstandingFine > 0 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        <div className="flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>Outstanding fine of <span className="font-bold">{fmtCurrency(outstandingFine)}</span> — pay at the library counter to resume borrowing.</span>
                        </div>
                        <button
                            onClick={() => navigate("/member/fines")}
                            className="text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-100 transition shrink-0"
                        >
                            View fines →
                        </button>
                    </div>
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-3">
                    {issuancesLoading || profileLoading
                        ? Array(4).fill(0).map((_, i) => <SkeletonStatCard key={i} />)
                        : statCards.map((card) => (
                            <div key={card.label}
                                className={`bg-white border border-gray-200 border-l-4 ${card.accent} rounded-xl p-4 flex items-start justify-between`}>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{card.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                                    <p className={`text-xs mt-1.5 ${card.subColor}`}>{card.sub}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                                    {card.icon}
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Main 2-col grid */}
                <div className="grid grid-cols-[1.4fr_1fr] gap-5 items-start">

                    {/* LEFT — My books */}
                    <div className="flex flex-col gap-4">

                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                            {[
                                { key: "active",  label: `Active (${activeBooks.length})`  },
                                { key: "history", label: `History (${historyBooks.length})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition ${
                                        activeTab === tab.key
                                            ? "bg-indigo-600 text-white"
                                            : "text-gray-500 hover:text-indigo-600"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Book cards */}
                        <div className="flex flex-col gap-3">
                            {issuancesLoading
                                ? Array(3).fill(0).map((_, i) => <SkeletonBookCard key={i} />)
                                : displayBooks.length === 0
                                ? (
                                    <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">
                                            {activeTab === "active" ? "No books currently borrowed" : "No borrowing history yet"}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Browse the catalog to find your next read</p>
                                        <button
                                            onClick={() => navigate("/member/catalog")}
                                            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition"
                                        >
                                            Browse catalog →
                                        </button>
                                    </div>
                                )
                                : displayBooks.map((issue) => (
                                    <BorrowedBookCard key={issue._id} issue={issue} />
                                ))
                            }
                        </div>

                        {/* Pending fines card */}
                        {!finesLoading && pendingFines.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <h2 className="text-sm font-semibold text-gray-900">Pending fines</h2>
                                    <button onClick={() => navigate("/fines")} className="text-xs text-indigo-600 hover:underline">View all →</button>
                                </div>
                                {pendingFines.slice(0, 3).map((fine, i) => {
                                    const balance   = fine.totalAmount - fine.paidAmount;
                                    const bookTitle = fine.issue?.book?.title || fine.issue?.bookSnapshot?.title || "Unknown";
                                    return (
                                        <div key={fine._id || i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 truncate max-w-50">{bookTitle}</p>
                                                <p className="text-[11px] text-gray-400">{fine.daysOverdue}d overdue · ₹{fine.ratePerDay}/day</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">{fmtCurrency(balance)}</p>
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                                    fine.status === "partial" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                                }`}>{fine.status}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="px-4 py-2.5 bg-red-50 border-t border-red-100 flex items-center justify-between">
                                    <span className="text-xs text-red-600">Total outstanding</span>
                                    <span className="text-sm font-bold text-red-700">{fmtCurrency(totalPending)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — Browse catalog */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900">Browse catalog</h2>
                            <button onClick={() => navigate("/member/catalog")} className="text-xs text-indigo-600 cursor-pointer hover:underline">See all →</button>
                        </div>

                        {/* Search bar */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <form onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput.trim()); }} className="flex gap-2">
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-1">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search books..."
                                        className="text-sm outline-none bg-transparent text-gray-700 flex-1"
                                    />
                                </div>
                                <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition">
                                    Go
                                </button>
                                {searchQuery && (
                                    <button type="button" onClick={() => { setSearchQuery(""); setSearchInput(""); }}
                                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-400 cursor-pointer hover:bg-gray-50 transition">
                                        ✕
                                    </button>
                                )}
                            </form>
                        </div>

                        {/* Book list */}
                        <div className="p-3 flex flex-col gap-2 max-h-130 overflow-y-auto">
                            {catalogLoading
                                ? Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse p-2">
                                        <div className="w-9 h-12 bg-gray-100 rounded-md shrink-0" />
                                        <div className="flex-1">
                                            <div className="h-2.5 bg-gray-100 rounded w-28 mb-2" />
                                            <div className="h-2 bg-gray-100 rounded w-20" />
                                        </div>
                                    </div>
                                ))
                                : catalogBooks.length === 0
                                ? (
                                    <div className="py-8 text-center text-sm text-gray-400">
                                        {searchQuery ? `No books found for "${searchQuery}"` : "No books in catalog"}
                                    </div>
                                )
                                : catalogBooks.map((book) => (
                                    <CatalogCard key={book._id} book={book} />
                                ))
                            }
                        </div>
                    </div>
                </div>

                {/* Quick actions strip */}
                <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Quick actions</p>
                    <div className="flex items-center gap-2">
                        {[
                            { label: "Browse all books",  icon: "📚", path: "/member/catalog"  },
                            { label: "My borrow history", icon: "📋", path: "/member/history" },
                            { label: "View all fines",    icon: "💰", path: "/member/fines"   },
                        ].map((a) => (
                            <button
                                key={a.label}
                                onClick={() => navigate(a.path)}
                                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 cursor-pointer hover:border-indigo-300 hover:text-indigo-600 transition"
                            >
                                <span>{a.icon}</span>
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}