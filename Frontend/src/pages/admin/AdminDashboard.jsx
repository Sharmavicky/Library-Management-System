import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getSummary, returnBook } from "../../services/adminServices";
// import useAuthStore from "../../store/authStore";
import NavBar from "../../Components/NavBar";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// ─── Skeleton loader for stat cards ─────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 border-l-4 border-l-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-2.5 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
            <div className="h-2 w-24 bg-gray-100 rounded" />
        </div>
    );
}


// ─── Skeleton for table rows ──────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            <td className="py-2.5 px-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
                    <div className="h-2.5 w-20 bg-gray-100 rounded" />
                </div>
            </td>
            <td className="py-2.5 px-2"><div className="h-2.5 w-24 bg-gray-100 rounded" /></td>
            <td className="py-2.5 px-2"><div className="h-2.5 w-12 bg-gray-100 rounded" /></td>
            <td className="py-2.5 px-2"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
            <td className="py-2.5 px-2"><div className="h-6 w-14 bg-gray-100 rounded" /></td>
        </tr>
    );
}

// ─── Avatar colours helper ────────────────────────────────────────────────────
const avatarPalette = [
    { bg: "bg-teal-100",   text: "text-teal-700"   },
    { bg: "bg-purple-100", text: "text-purple-700"  },
    { bg: "bg-blue-100",   text: "text-blue-700"    },
    { bg: "bg-amber-100",  text: "text-amber-700"   },
    { bg: "bg-rose-100",   text: "text-rose-700"    },
];

const getAvatar = (name = "") => {
    const idx = name.charCodeAt(0) % avatarPalette.length;
    return avatarPalette[idx];
};
const getInitials = (name = "") => {
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
 
// ─── Format helpers ───────────────────────────────────────────────────────────
const fmt = (n = 0) => Number(n).toLocaleString("en-IN");
const fmtCurrency = (n = 0) => `₹${fmt(n)}`;

// ─── Stat card config builder — driven by real API data ──────────────────────
function buildStatCards(summary) {
    return [
        {
            label: "Total books",
            value: fmt(summary?.books?.total ?? 0),
            sub: `${fmt(summary?.books?.available ?? 0)} available`,
            subColor: "text-green-600",
            accent: "border-l-indigo-500",
            iconBg: "bg-indigo-50",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ),
        },
        {
            label: "Currently issued",
            value: fmt(summary?.books?.issued ?? 0),
            sub: `${fmt(summary?.books?.overdue ?? 0)} overdue`,
            subColor: summary?.books?.overdue > 0 ? "text-amber-600" : "text-green-600",
            accent: "border-l-green-500",
            iconBg: "bg-green-50",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" />
                </svg>
            ),
        },
        {
            label: "Overdue books",
            value: fmt(summary?.books?.overdue ?? 0),
            sub: "Action required",
            subColor: summary?.books?.overdue > 0 ? "text-red-500" : "text-gray-400",
            accent: "border-l-amber-500",
            iconBg: "bg-amber-50",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            ),
        },
        {
            label: "Fine revenue",
            value: fmtCurrency(summary?.fines?.totalCollected ?? 0),
            sub: `${fmtCurrency(summary?.fines?.totalOutstanding ?? 0)} pending`,
            subColor: "text-gray-400",
            accent: "border-l-red-500",
            iconBg: "bg-red-50",
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
        },
    ];
};

// ─── Chart options ────────────────────────────────────────────────────────────
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} issuances` } },
    },
    scales: {
        x: {
            ticks: { maxTicksLimit: 6, font: { size: 11 }, color: "#9ca3af", autoSkip: true },
            grid: { display: false },
            border: { display: false },
        },
        y: { display: false, grid: { display: false } },
    },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const navigate     = useNavigate();
    const queryClient  = useQueryClient();
    // const { user, logout } = useAuthStore();
 
    // ── Fetch summary from GET /api/reports/summary ───────────────────────────
    const {
        data:    summaryData,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["admin-summary"],
        queryFn:  getSummary,
        refetchInterval: 1000 * 60 * 5, // auto-refresh every 5 minutes
    });   
 
    const summary          = summaryData?.summary;
    const recentIssuances  = summary?.recentIssuances  ?? [];
    const topBorrowedBooks = summary?.topBorrowedBooks  ?? [];
    const statCards        = buildStatCards(summary);
 
    // ── Return book mutation ──────────────────────────────────────────────────
    const returnMutation = useMutation({
        mutationFn: (issueId) => returnBook(issueId),
        onSuccess: () => {
            // invalidate summary so stat cards and table refresh automatically
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
        },
    });
 
    // ── Chart data — built from topBorrowedBooks or fallback placeholder ──────
    const chartLabels = topBorrowedBooks.length > 0
        ? topBorrowedBooks.map((b) => b.book?.title?.slice(0, 12) + "…" || "Book")
        : Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`);
 
    const chartValues = topBorrowedBooks.length > 0
        ? topBorrowedBooks.map((b) => b.totalIssued)
        : [3, 5, 8, 6, 9, 4, 7]; // placeholder while loading
 
    const maxVal = Math.max(...chartValues);
    const chartData = {
        labels: chartLabels,
        datasets: [{
            data: chartValues,
            backgroundColor: chartValues.map((v) => v === maxVal ? "#6366f1" : "#c7d2fe"),
            borderRadius: 3,
            borderSkipped: false,
        }],
    };
 
    // ── Logout handler ────────────────────────────────────────────────────────
    // const handleLogout = () => {
    //     logout();
    //     navigate("/login", { replace: true }); // cannot back to see logged account, need to login again
    // };
 
    // ── Error state ───────────────────────────────────────────────────────────
    if (isError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-sm">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Failed to load dashboard</h3>
                    <p className="text-sm text-gray-500 mb-4">Could not reach the server. Check your connection.</p>
                    <button onClick={() => refetch()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                        Retry
                    </button>
                </div>
            </div>
        );
    }
 
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
    
            {/* ── Top nav bar ── */}
            <NavBar userType="admin" />
            
        
            <div className="p-5 flex flex-col gap-4 max-w-350 mx-auto">
        
                {/* ── Page header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs cursor-pointer text-gray-500 hover:bg-gray-50 transition"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        {isLoading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
        
                {/* ── Overdue alert — only shown when overdue > 0 ── */}
                {!isLoading && summary?.books?.overdue > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-red-400 text-red-500 font-bold text-[10px] shrink-0">!</span>
                        <span>
                        <span className="font-semibold">{summary.books.overdue} books</span> are overdue — users have been notified by the daily cron job.
                        </span>
                        <button
                            onClick={() => navigate("/admin/issuances?status=overdue")}
                            className="ml-1 text-indigo-600 font-semibold cursor-pointer hover:underline"
                        >
                            View all →
                        </button>
                    </div>
                )}
        
                {/* ── Stat cards ── */}
                <div className="grid grid-cols-4 gap-4">
                {isLoading
                    ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : statCards.map((card) => (
                        <div
                            key={card.label}
                            className={`bg-white border border-gray-200 border-l-4 ${card.accent} rounded-xl p-4 flex items-start justify-between`}
                        >
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                                    {card.label}
                                </p>
                                <p className="text-[28px] font-bold leading-none text-gray-900">{card.value}</p>
                                <p className={`text-xs mt-1.5 ${card.subColor}`}>{card.sub}</p>
                            </div>
                            <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                                {card.icon}
                            </div>
                        </div>
                    ))
                }
                </div>
        
                {/* ── Bottom grid ── */}
                <div className="grid grid-cols-[1fr_1.5fr] gap-4">
        
                    {/* Recent issuances table */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[15px] font-semibold text-gray-900">Recent issuances</h2>
                            <button
                                onClick={() => navigate("/admin/issuances")}
                                className="text-xs text-indigo-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 cursor-pointer hover:bg-indigo-50 transition"
                            >
                                View all
                            </button>
                        </div>
            
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr>
                                {["User", "Book", "Due", "Status", ""].map((h, i) => (
                                    <th key={i} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 px-2">
                                        {h}
                                    </th>
                                ))}
                                </tr>
                            </thead>

                            <tbody>
                                {isLoading
                                ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : recentIssuances.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                                        No issuances yet
                                        </td>
                                    </tr>
                                    )
                                : recentIssuances.map((row, i) => {
                                    const isOverdue  = row.status === "overdue";
                                    const isReturned = row.status === "returned";
                                    const name       = row.member?.username || "Unknown";
                                    const avatar     = getAvatar(name);
                                    const dueDate    = row.dueDate
                                        ? new Date(row.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                        : "—";
                
                                    return (
                                        <tr key={row._id || i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                        {/* User */}
                                        <td className="py-2.5 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                                                    {getInitials(name)}
                                                </div>
                                                <span className="text-gray-800 font-medium truncate max-w-20">{name}</span>
                                            </div>
                                        </td>
                
                                        {/* Book — use snapshot for accuracy */}
                                        <td className="py-2.5 px-2 text-gray-600 truncate max-w-25">
                                            {row.bookSnapshot?.title || row.book?.title || "—"}
                                        </td>
                
                                        {/* Due date */}
                                        <td className={`py-2.5 px-2 font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                                            {dueDate}
                                        </td>
                
                                        {/* Status badge */}
                                        <td className="py-2.5 px-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                                            isOverdue  ? "bg-red-100 text-red-700"
                                            : isReturned ? "bg-gray-100 text-gray-500"
                                            :              "bg-green-100 text-green-700"
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                isOverdue  ? "bg-red-500"
                                            : isReturned ? "bg-gray-400"
                                            :              "bg-green-500"
                                            }`} />
                                            {isOverdue ? "Overdue" : isReturned ? "Returned" : "Issued"}
                                            </span>
                                        </td>
                
                                        {/* Return action — only shown for active/overdue issues */}
                                        <td className="py-2.5 px-2">
                                            {!isReturned && (
                                            <button
                                                onClick={() => returnMutation.mutate(row._id)}
                                                disabled={returnMutation.isPending}
                                                className="text-[11px] px-2 py-1 border border-gray-200 rounded text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition disabled:opacity-40"
                                            >
                                                {returnMutation.isPending ? "…" : "Return"}
                                            </button>
                                            )}
                                        </td>
                                        </tr>
                                    );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
        
                    {/* Chart + mini stats */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <h2 className="text-[15px] font-semibold text-gray-900">Top borrowed books</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Most issued titles of all time</p>
                            </div>
                            <span className="text-3xl font-bold text-indigo-500">
                                {isLoading ? "—" : fmt(summary?.books?.issued ?? 0)}
                            </span>
                        </div>
            
                        <div className="relative w-full h-40">
                            {isLoading
                                ? <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse" />
                                : <Bar data={chartData} options={chartOptions} />
                            }
                        </div>
            
                        {/* Mini stat pills */}
                        <div className="grid grid-cols-3 gap-2.5 mt-3">
                            <div className="bg-indigo-50 rounded-lg p-3">
                                <p className="text-xl font-bold text-indigo-700">
                                {isLoading ? "—" : fmt(summary?.books?.available ?? 0)}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Available</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <p className="text-xl font-bold text-green-700">
                                {isLoading ? "—" : fmt(summary?.books?.issued ?? 0)}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Issued</p>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-3">
                                <p className="text-xl font-bold text-rose-600">
                                {isLoading ? "—" : fmt(summary?.books?.overdue ?? 0)}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">Overdue</p>
                            </div>
                        </div>
            
                        {/* Top books list */}
                        {!isLoading && topBorrowedBooks.length > 0 && (
                            <div className="mt-4 border-t border-gray-100 pt-3">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Top books</p>
                                <div className="flex flex-col gap-2">
                                    {topBorrowedBooks.slice(0, 3).map((b, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-gray-300 w-4">{i + 1}</span>
                                                <span className="text-sm text-gray-700 font-medium truncate max-w-40">
                                                {b.book?.title || "Unknown"}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {b.totalIssued}×
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        
                {/* ── Members summary strip ── */}
                {!isLoading && (
                    <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span className="text-sm font-medium text-gray-700">
                                <span className="font-bold text-indigo-600">{fmt(summary?.members?.total ?? 0)}</span> active members
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                Total fines raised: <span className="font-semibold text-gray-700">{fmtCurrency(summary?.fines?.totalRaised ?? 0)}</span>
                            </span>
                            <span className="text-gray-200">·</span>
                            <span className="text-sm text-gray-500">
                                Collected: <span className="font-semibold text-green-600">{fmtCurrency(summary?.fines?.totalCollected ?? 0)}</span>
                            </span>
                            <span className="text-gray-200">·</span>
                            <span className="text-sm text-gray-500">
                                Outstanding: <span className="font-semibold text-red-500">{fmtCurrency(summary?.fines?.totalOutstanding ?? 0)}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => navigate("/admin/users")}
                            className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-indigo-100 transition font-medium"
                        >
                            Manage members →
                        </button>
                    </div>
                )}
        
            </div>
        </div>
    );
}