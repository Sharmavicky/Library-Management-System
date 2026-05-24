import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
    getAllIssuances,
    issueBook,
    returnBook,
    getAllMembers,
    getAllBooks,
} from "../../services/adminServices";
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
const getAvatar = (name = "") =>
    avatarPalette[name.charCodeAt(0) % avatarPalette.length];

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const getDaysOverdue = (dueDate) => {
    const diff = Math.ceil((new Date() - new Date(dueDate)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            status === "overdue"  ? "bg-red-100 text-red-700"
          : status === "returned" ? "bg-gray-100 text-gray-500"
          :                         "bg-green-100 text-green-700"
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
                status === "overdue" ? "bg-red-500" : status === "returned" ? "bg-gray-400" : "bg-green-500"
            }`} />
            {status === "issued" ? "Issued" : status === "overdue" ? "Overdue" : "Returned"}
        </span>
    );
}

// ─── Skeleton row (desktop table) ─────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            {[140, 140, 90, 90, 90, 70, 60].map((w, i) => (
                <td key={i} className="py-3 px-3">
                    <div className="h-2.5 bg-gray-100 rounded" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Skeleton card (mobile / tablet) ─────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-100 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-40" />
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-16 shrink-0" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-gray-100 rounded-md" />
                <div className="h-8 bg-gray-100 rounded-md" />
                <div className="h-8 bg-gray-100 rounded-md" />
            </div>
        </div>
    );
}

// ─── Issuance card (mobile / tablet) ─────────────────────────────────────────
function IssuanceCard({ issue, onReturn }) {
    const name      = issue.member?.username || "Unknown";
    const avatar    = getAvatar(name);
    const isOverdue  = issue.status === "overdue";
    const isReturned = issue.status === "returned";
    const daysOver   = isOverdue ? getDaysOverdue(issue.dueDate) : 0;

    return (
        <div className={`p-4 border-b border-gray-100 last:border-0 ${isOverdue ? "bg-red-50/30" : ""}`}>
            {/* Top: avatar + member + book + status */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5`}>
                    {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm truncate">{name}</span>
                        <StatusBadge status={issue.status} />
                    </div>
                    <div className="text-sm text-gray-700 font-medium truncate mt-0.5">
                        {issue.bookSnapshot?.title || issue.book?.title || "—"}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                        {issue.bookSnapshot?.author || issue.book?.author || ""}
                    </div>
                </div>
            </div>

            {/* Overdue warning */}
            {isOverdue && (
                <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                    <span className="font-semibold">{daysOver}d overdue</span> · Fine: <span className="font-bold">₹{daysOver * 5}</span>
                </div>
            )}

            {/* Date grid + action */}
            <div className="flex items-end justify-between gap-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">Issued</div>
                        <div className="text-xs text-gray-600">{fmtDate(issue.issueDate || issue.createdAt)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide">Due</div>
                        <div className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                            {fmtDate(issue.dueDate)}
                        </div>
                    </div>
                    {isReturned && (
                        <div className="col-span-2">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Returned</div>
                            <div className="text-xs text-gray-600">{fmtDate(issue.returnedAt)}</div>
                        </div>
                    )}
                </div>

                {!isReturned && (
                    <button
                        onClick={() => onReturn(issue)}
                        className="shrink-0 text-[11px] px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition"
                    >
                        Return
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Issue Book Modal ─────────────────────────────────────────────────────────
// Bottom sheet on mobile, centered on sm+
function IssueBookModal({ onClose, onIssue, isIssuing }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [userSearch,   setUserSearch]   = useState("");
    const [bookSearch,   setBookSearch]   = useState("");
    const [dueDate,      setDueDate]      = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split("T")[0];
    });

    const { data: membersData } = useQuery({
        queryKey: ["issue-modal-members"],
        queryFn:  () => getAllMembers(1),
    });

    const { data: booksData } = useQuery({
        queryKey: ["issue-modal-books"],
        queryFn:  () => getAllBooks(1, 50),
    });

    const members = (membersData?.members ?? []).filter((m) =>
        m.isActive &&
        (m.username.toLowerCase().includes(userSearch.toLowerCase()) ||
         m.email.toLowerCase().includes(userSearch.toLowerCase()))
    );

    const books = (booksData?.books ?? []).filter((b) =>
        b.availableCopies > 0 &&
        (b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
         b.author.toLowerCase().includes(bookSearch.toLowerCase()))
    );

    const canSubmit = selectedUser && selectedBook && dueDate;

    const inputClass =
        "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92dvh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <h2 className="text-base font-semibold text-gray-900">Issue a book</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-50 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable form body */}
                <form
                    onSubmit={(e) => { e.preventDefault(); if (canSubmit) onIssue({ bookId: selectedBook._id, userId: selectedUser._id }); }}
                    className="px-5 sm:px-6 py-5 flex flex-col gap-4 overflow-y-auto"
                >
                    {/* Member selector */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Select member</label>
                        {selectedUser ? (
                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-6 h-6 rounded-full ${getAvatar(selectedUser.username).bg} ${getAvatar(selectedUser.username).text} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                        {getInitials(selectedUser.username)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{selectedUser.username}</div>
                                        <div className="text-[11px] text-gray-400 truncate">{selectedUser.email}</div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(""); }} className="shrink-0 text-xs text-indigo-600 cursor-pointer hover:underline ml-2">
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input className={inputClass} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search member..." autoFocus />
                                {userSearch && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto z-10">
                                        {members.length === 0
                                            ? <div className="px-3 py-3 text-sm text-gray-400">No active members found</div>
                                            : members.slice(0, 6).map((m) => (
                                                <button key={m._id} type="button" onClick={() => { setSelectedUser(m); setUserSearch(""); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-indigo-50 transition text-left">
                                                    <div className={`w-6 h-6 rounded-full ${getAvatar(m.username).bg} ${getAvatar(m.username).text} text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                                        {getInitials(m.username)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{m.username}</div>
                                                        <div className="text-[11px] text-gray-400 truncate">{m.email}</div>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Book selector */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Select book</label>
                        {selectedBook ? (
                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{selectedBook.title}</div>
                                    <div className="text-[11px] text-gray-400 truncate">{selectedBook.author} · {selectedBook.availableCopies} left</div>
                                </div>
                                <button type="button" onClick={() => { setSelectedBook(null); setBookSearch(""); }} className="shrink-0 text-xs text-indigo-600 cursor-pointer hover:underline">
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input className={inputClass} value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} placeholder="Search book..." />
                                {bookSearch && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto z-10">
                                        {books.length === 0
                                            ? <div className="px-3 py-3 text-sm text-gray-400">No available books found</div>
                                            : books.slice(0, 6).map((b) => (
                                                <button key={b._id} type="button" onClick={() => { setSelectedBook(b); setBookSearch(""); }}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-indigo-50 transition text-left gap-2">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{b.title}</div>
                                                        <div className="text-[11px] text-gray-400 truncate">{b.author}</div>
                                                    </div>
                                                    <span className="shrink-0 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{b.availableCopies} left</span>
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Due date</label>
                        <input type="date" className={inputClass} value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]} required />
                    </div>

                    <div className="bg-indigo-50 rounded-lg px-3 py-2 text-xs text-indigo-700">
                        Fine rate: <span className="font-semibold">₹5/day</span> after due date
                    </div>

                    {/* Actions — full-width on mobile */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit || isIssuing}
                            className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {isIssuing ? "Issuing..." : "Confirm issue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Return confirm modal ─────────────────────────────────────────────────────
// Bottom sheet on mobile, centered on sm+
function ReturnModal({ issue, onClose, onConfirm, isLoading }) {
    const isOverdue = issue?.status === "overdue";
    const daysOver  = isOverdue ? getDaysOverdue(issue?.dueDate) : 0;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — mobile only */}
                <div className="flex justify-center -mt-2 mb-4 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-1">Return book</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Confirm return of <span className="font-semibold text-gray-800">{issue?.bookSnapshot?.title || issue?.book?.title}</span>
                </p>

                {isOverdue ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                        <div className="text-sm font-semibold text-red-700 mb-0.5">Overdue — fine will be raised</div>
                        <div className="text-xs text-red-500">{daysOver} day{daysOver !== 1 ? "s" : ""} late · Fine: <span className="font-bold">₹{daysOver * 5}</span></div>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-700">
                        Returned on time · No fine
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition cursor-pointer">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {isLoading ? "Processing..." : "Confirm return"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminIssuances() {
    const queryClient    = useQueryClient();
    const [searchParams] = useSearchParams();

    const [page,        setPage]        = useState(1);
    const [filter,      setFilter]      = useState(searchParams.get("status") || "all");
    const [showModal,   setShowModal]   = useState(false);
    const [returnIssue, setReturnIssue] = useState(null);
    const [toast,       setToast]       = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const { data, isLoading } = useQuery({
        queryKey: ["admin-issuances", page, filter],
        queryFn:  () => getAllIssuances(page, filter === "all" ? undefined : filter),
        keepPreviousData: false,
        staleTime: 0,
    });

    const issuances  = data?.issuedBooks ?? [];
    const pagination = data?.pagination  ?? {};

    const issueMutation = useMutation({
        mutationFn: ({ bookId, userId }) => issueBook(bookId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-issuances"] });
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
            setShowModal(false);
            showToast("Book issued successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Could not issue book", "error"),
    });

    const returnMutation = useMutation({
        mutationFn: (issueId) => returnBook(issueId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-issuances"] });
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
            setReturnIssue(null);
            showToast("Book returned!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Return failed", "error"),
    });

    const filterTabs = [
        { key: "all",      label: "All"      },
        { key: "issued",   label: "Issued"   },
        { key: "overdue",  label: "Overdue"  },
        { key: "returned", label: "Returned" },
    ];

    // ── Empty state message ───────────────────────────────────────────────────
    const emptyMessage =
        filter === "returned" ? "No books have been returned yet"
      : filter === "overdue"  ? "No overdue books — all clear!"
      : filter === "issued"   ? "No books are currently issued"
      :                         "No issuances found";

    const emptyIcon = (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="admin" />

            {/* Toast — bottom on mobile, top-right on sm+ */}
            {toast && (
                <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
                    toast.type === "error"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                    {toast.msg}
                </div>
            )}

            <div className="p-4 sm:p-5 pb-24 sm:pb-8 max-w-7xl mx-auto flex flex-col gap-4">

                {/* ── Page header ── */}
                <div className="flex items-start sm:items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-gray-900">Issuances</h1>
                        <p className="text-sm text-gray-400 mt-0.5 truncate">
                            {pagination.total ? `${pagination.total} total records` : "Track all issued books"}
                        </p>
                    </div>
                    {/* "Issue book" — icon-only on mobile, full label on sm+ */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span className="hidden sm:inline">Issue book</span>
                    </button>
                </div>

                {/* ── Filter tabs — scrollable on small screens ── */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit min-w-max">
                        {filterTabs.map((tab) => (
                            <button key={tab.key} onClick={() => { setPage(1); setFilter(tab.key); }}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                                    filter === tab.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-indigo-600"
                                }`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Desktop table (lg+) ── */}
                <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                {["Member", "Book", "Issued on", "Due date", "Returned on", "Status", "Action"].map((h) => (
                                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-3 px-3 border-b border-gray-100">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : issuances.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                {emptyIcon}
                                                <span className="text-sm text-gray-400">{emptyMessage}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                                : issuances.map((issue, i) => {
                                    const name       = issue.member?.username || "Unknown";
                                    const avatar     = getAvatar(name);
                                    const isOverdue  = issue.status === "overdue";
                                    const isReturned = issue.status === "returned";
                                    const daysOver   = isOverdue ? getDaysOverdue(issue.dueDate) : 0;

                                    return (
                                        <tr key={issue._id || i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} text-[11px] font-bold flex items-center justify-center shrink-0`}>
                                                        {getInitials(name)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 truncate max-w-24">{name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="font-medium text-gray-800 truncate max-w-36">
                                                    {issue.bookSnapshot?.title || issue.book?.title || "—"}
                                                </div>
                                                <div className="text-[11px] text-gray-400 truncate max-w-36">
                                                    {issue.bookSnapshot?.author || issue.book?.author || ""}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-gray-500 text-xs">{fmtDate(issue.issueDate || issue.createdAt)}</td>
                                            <td className={`py-3 px-3 text-xs font-medium ${isOverdue ? "text-red-600" : "text-gray-700"}`}>
                                                {fmtDate(issue.dueDate)}
                                                {isOverdue && <div className="text-[10px] text-red-400 mt-0.5">{daysOver}d · ₹{daysOver * 5}</div>}
                                            </td>
                                            <td className="py-3 px-3 text-gray-400 text-xs">{isReturned ? fmtDate(issue.returnedAt) : "—"}</td>
                                            <td className="py-3 px-3"><StatusBadge status={issue.status} /></td>
                                            <td className="py-3 px-3">
                                                {!isReturned ? (
                                                    <button onClick={() => setReturnIssue(issue)}
                                                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition">
                                                        Return
                                                    </button>
                                                ) : <span className="text-gray-300 text-[11px]">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</span>
                            <div className="flex gap-1">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 disabled:opacity-40 transition">
                                    ← Prev
                                </button>
                                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 disabled:opacity-40 transition">
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tablet & Mobile card list (< lg) ── */}
                <div className="lg:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {isLoading
                        ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : issuances.length === 0
                        ? (
                            <div className="py-16 flex flex-col items-center gap-2">
                                {emptyIcon}
                                <span className="text-sm text-gray-400">{emptyMessage}</span>
                            </div>
                        )
                        : issuances.map((issue, i) => (
                            <IssuanceCard
                                key={issue._id || i}
                                issue={issue}
                                onReturn={setReturnIssue}
                            />
                        ))
                    }

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                {pagination.page} / {pagination.totalPages} · {pagination.total} records
                            </span>
                            <div className="flex gap-1.5">
                                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
                                    ← Prev
                                </button>
                                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ── Modals ── */}
            {showModal && (
                <IssueBookModal
                    onClose={() => setShowModal(false)}
                    onIssue={({ bookId, userId }) => issueMutation.mutate({ bookId, userId })}
                    isIssuing={issueMutation.isPending}
                />
            )}
            {returnIssue && (
                <ReturnModal
                    issue={returnIssue}
                    onClose={() => setReturnIssue(null)}
                    onConfirm={() => returnMutation.mutate(returnIssue._id)}
                    isLoading={returnMutation.isPending}
                />
            )}
        </div>
    );
}