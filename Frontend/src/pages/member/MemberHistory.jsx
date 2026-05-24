import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMyIssuedBooks } from "../../services/memberService";

import NavBar from "../../Components/NavBar";
import { MdChevronLeft } from "react-icons/md";

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    }) : "—";

const fmtDuration = (issueDate, returnedAt) => {
    if (!issueDate || !returnedAt) return null;
    const days = Math.ceil(
        (new Date(returnedAt) - new Date(issueDate)) / (1000 * 60 * 60 * 24)
    );
    return days <= 0 ? "Same day" : `${days} day${days !== 1 ? "s" : ""}`;
};

const thumbColors = [
    "bg-indigo-500", "bg-teal-500", "bg-amber-500",
    "bg-rose-500",   "bg-purple-500", "bg-blue-500",
    "bg-cyan-500",   "bg-emerald-500",
];
const getThumb = (title = "") => thumbColors[title.charCodeAt(0) % thumbColors.length];

// ─── Stat strip ───────────────────────────────────────────────────────────────
function StatStrip({ total, returned, overdue, onTime }) {
    return (
        <div className="grid grid-cols-4 gap-3">
            {[
                { label: "Total borrowed", value: total,    color: "text-gray-900",    bg: "bg-white",        accent: "border-l-indigo-500" },
                { label: "Returned",       value: returned, color: "text-teal-700",    bg: "bg-teal-50",      accent: "border-l-teal-500"   },
                { label: "On time",        value: onTime,   color: "text-green-700",   bg: "bg-green-50",     accent: "border-l-green-500"  },
                { label: "Late returns",   value: overdue,  color: "text-red-600",     bg: "bg-red-50",       accent: "border-l-red-500"    },
            ].map((s) => (
                <div key={s.label} className={`${s.bg} border border-gray-200 border-l-4 ${s.accent} rounded-xl p-4`}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value === undefined ? "—" : s.value}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Single history card ──────────────────────────────────────────────────────
function HistoryCard({ issue, index }) {
    const title      = issue.bookSnapshot?.title  || issue.book?.title  || "Unknown";
    const author     = issue.bookSnapshot?.author || issue.book?.author || "";
    const thumbColor = getThumb(title);
    // const isOverdue  = issue.status === "overdue";
    const isReturned = issue.status === "returned";
    const isActive   = !isReturned;
    const duration   = fmtDuration(issue.issueDate || issue.createdAt, issue.returnedAt);

    // was it returned late?
    const returnedLate = issue.returnedAt && issue.dueDate &&
        new Date(issue.returnedAt) > new Date(issue.dueDate);

    return (
        <div className={`bg-white border rounded-xl overflow-hidden transition hover:shadow-sm ${
            isActive ? "border-indigo-200" : "border-gray-200"
        }`}>
            <div className="flex gap-4 p-4">
                {/* Rank number */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="text-[11px] font-bold text-gray-300 w-6 text-center">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className={`w-0.5 flex-1 rounded-full ${isReturned ? "bg-gray-100" : "bg-indigo-100"}`} />
                </div>

                {/* Book spine */}
                <div className={`w-11 h-16 rounded-lg ${thumbColor} flex items-end justify-center pb-1.5 shrink-0 shadow-sm`}>
                    <span className="text-[7px] font-bold text-white/80 text-center leading-tight px-1 break-all">
                        {title.slice(0, 8)}
                    </span>
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate leading-snug">{title}</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">{author}</p>
                        </div>
                        {/* Status badge */}
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                            isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : returnedLate
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                        }`}>
                            {isActive ? "Active" : returnedLate ? "Late return" : "On time"}
                        </span>
                    </div>

                    {/* Date timeline */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="text-[11px] text-gray-500">
                                Borrowed {fmtDate(issue.issueDate || issue.createdAt)}
                            </span>
                        </div>
                        {isReturned ? (
                            <>
                                <span className="text-gray-200 text-xs">→</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${returnedLate ? "bg-amber-400" : "bg-green-400"}`} />
                                    <span className="text-[11px] text-gray-500">
                                        Returned {fmtDate(issue.returnedAt)}
                                    </span>
                                </div>
                                {duration && (
                                    <>
                                        <span className="text-gray-200 text-xs">·</span>
                                        <span className="text-[11px] text-gray-400">{duration}</span>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="text-gray-200 text-xs">→</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 animate-pulse" />
                                    <span className="text-[11px] text-indigo-600 font-medium">
                                        Due {fmtDate(issue.dueDate)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 animate-pulse">
            <div className="w-5 shrink-0 pt-1">
                <div className="h-2.5 bg-gray-100 rounded w-4" />
            </div>
            <div className="w-11 h-16 bg-gray-100 rounded-lg shrink-0" />
            <div className="flex-1">
                <div className="h-3 bg-gray-100 rounded w-36 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-24 mb-3" />
                <div className="flex gap-2">
                    <div className="h-2 bg-gray-100 rounded w-28" />
                    <div className="h-2 bg-gray-100 rounded w-4" />
                    <div className="h-2 bg-gray-100 rounded w-28" />
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemberHistory() {
    const navigate = useNavigate();

    const [filter,      setFilter]      = useState("all");    // all | returned | active
    const [sortBy,      setSortBy]      = useState("newest"); // newest | oldest | az
    const [searchInput, setSearchInput] = useState("");
    const [page,        setPage]        = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["my-history", page],
        queryFn:  () => getMyIssuedBooks(page),
        keepPreviousData: true,
    });

    const allIssues  = data?.books      ?? [];
    const pagination = data?.pagination ?? {};

    // ── Derived stats ─────────────────────────────────────────────────────────
    const returned   = allIssues.filter((i) => i.status === "returned");
    const active     = allIssues.filter((i) => i.status !== "returned");
    const overdue    = allIssues.filter((i) => i.status === "overdue");
    const onTime     = returned.filter((i) =>
        i.returnedAt && i.dueDate &&
        new Date(i.returnedAt) <= new Date(i.dueDate)
    );

    // ── Filter ────────────────────────────────────────────────────────────────
    let filtered = filter === "returned" ? returned
                 : filter === "active"   ? active
                 :                         allIssues;

    // ── Search ────────────────────────────────────────────────────────────────
    if (searchInput.trim()) {
        const q = searchInput.toLowerCase();
        filtered = filtered.filter((i) => {
            const title  = (i.bookSnapshot?.title  || i.book?.title  || "").toLowerCase();
            const author = (i.bookSnapshot?.author || i.book?.author || "").toLowerCase();
            return title.includes(q) || author.includes(q);
        });
    }

    // ── Sort ──────────────────────────────────────────────────────────────────
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt);
        }
        if (sortBy === "oldest") {
            return new Date(a.issueDate || a.createdAt) - new Date(b.issueDate || b.createdAt);
        }
        if (sortBy === "az") {
            const ta = (a.bookSnapshot?.title || a.book?.title || "").toLowerCase();
            const tb = (b.bookSnapshot?.title || b.book?.title || "").toLowerCase();
            return ta.localeCompare(tb);
        }
        return 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="member" /> 

            <div className="p-5 max-w-3xl mx-auto flex flex-col gap-5">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Borrow history</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Every book you've borrowed — {allIssues.length} total
                        </p>
                    </div>
                    <button onClick={() => navigate("/member/dashboard")}
                        className="text-sm text-gray-400 cursor-pointer hover:text-indigo-600 transition flex items-center gap-1">
                        <MdChevronLeft size={18} />
                        Dashboard
                    </button>
                </div>

                {/* Stat strip */}
                {!isLoading && (
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: "Total borrowed", value: allIssues.length, color: "text-gray-900",  bg: "bg-white",    accent: "border-l-indigo-500" },
                            { label: "Returned",       value: returned.length,  color: "text-teal-700", bg: "bg-teal-50",  accent: "border-l-teal-500"   },
                            { label: "On time",        value: onTime.length,    color: "text-green-700",bg: "bg-green-50", accent: "border-l-green-500"  },
                            { label: "Late returns",   value: overdue.length + returned.filter(i => i.returnedAt && i.dueDate && new Date(i.returnedAt) > new Date(i.dueDate)).length,
                              color: "text-red-600",   bg: "bg-red-50",   accent: "border-l-red-500" },
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} border border-gray-200 border-l-4 ${s.accent} rounded-xl p-4`}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filter tabs */}
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                        {[
                            { key: "all",      label: `All (${allIssues.length})`    },
                            { key: "active",   label: `Active (${active.length})`    },
                            { key: "returned", label: `Returned (${returned.length})` },
                        ].map((tab) => (
                            <button key={tab.key} onClick={() => setFilter(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                    filter === tab.key
                                        ? "bg-indigo-600 text-white"
                                        : "text-gray-500 hover:text-indigo-600"
                                }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 outline-none focus:border-indigo-400 transition"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="az">A → Z</option>
                    </select>

                    {/* Search */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-45">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search title or author..."
                            className="text-sm outline-none bg-transparent text-gray-700 flex-1"
                        />
                        {searchInput && (
                            <button onClick={() => setSearchInput("")} className="text-gray-300 hover:text-gray-500 transition text-xs">✕</button>
                        )}
                    </div>
                </div>

                {/* History list */}
                <div className="flex flex-col gap-3">
                    {isLoading
                        ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : sorted.length === 0
                        ? (
                            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    {searchInput ? `No books matching "${searchInput}"` : "No borrow history yet"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {searchInput ? "Try a different search term" : "Start by borrowing a book from the catalog"}
                                </p>
                                {!searchInput && (
                                    <button onClick={() => navigate("/member/catalog")}
                                        className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                        Browse catalog →
                                    </button>
                                )}
                            </div>
                        )
                        : sorted.map((issue, i) => (
                            <HistoryCard key={issue._id || i} issue={issue} index={i} />
                        ))
                    }
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <span className="text-xs text-gray-400">
                            Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
                        </span>
                        <div className="flex gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
                                ← Prev
                            </button>
                            <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
                                Next →
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}