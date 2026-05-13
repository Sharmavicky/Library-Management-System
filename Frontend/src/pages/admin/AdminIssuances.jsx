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

// ─── Issue Book Modal ─────────────────────────────────────────────────────────
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Issue a book</h2>
                    <button
                        onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-50 transition"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); if (canSubmit) onIssue({ bookId: selectedBook._id, userId: selectedUser._id }); }}
                    className="px-6 py-5 flex flex-col gap-4">

                    {/* User */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Select member</label>
                        {selectedUser ? (
                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-6 h-6 rounded-full ${getAvatar(selectedUser.username).bg} ${getAvatar(selectedUser.username).text} text-[10px] font-bold flex items-center justify-center`}
                                    >
                                        {getInitials(selectedUser.username)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {selectedUser.username}
                                        </div>
                                        <div className="text-[11px] text-gray-400">{selectedUser.email}</div>
                                    </div>
                                </div>
                                <button
                                    type="button" onClick={() => { setSelectedUser(null); setUserSearch(""); }} className="text-xs text-indigo-600 cursor-pointer hover:underline"
                                >
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
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{m.username}</div>
                                                        <div className="text-[11px] text-gray-400">{m.email}</div>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Book */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">Select book</label>
                        {selectedBook ? (
                            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{selectedBook.title}</div>
                                    <div className="text-[11px] text-gray-400">{selectedBook.author} · {selectedBook.availableCopies} left</div>
                                </div>
                                <button
                                    type="button" onClick={() => { setSelectedBook(null); setBookSearch(""); }} className="text-xs text-indigo-600 cursor-pointer hover:underline"
                                >
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
                                                    className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-indigo-50 transition text-left">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{b.title}</div>
                                                        <div className="text-[11px] text-gray-400">{b.author}</div>
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">{b.availableCopies} left</span>
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

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit || isIssuing}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition disabled:opacity-50"
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
function ReturnModal({ issue, onClose, onConfirm, isLoading }) {
    const isOverdue  = issue?.status === "overdue";
    const daysOver   = isOverdue ? getDaysOverdue(issue?.dueDate) : 0;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
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
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition disabled:opacity-50"
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

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar />

            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
                    toast.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"
                }`}>{toast.msg}</div>
            )}

            <div className="p-5 max-w-350 mx-auto flex flex-col gap-4">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Issuances</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {pagination.total ? `${pagination.total} total records` : "Track all issued books"}
                        </p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Issue book
                    </button>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                    {filterTabs.map((tab) => (
                        <button key={tab.key} onClick={() => { setPage(1); setFilter(tab.key); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                                filter === tab.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-indigo-600"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                                                <span className="text-sm text-gray-400">
                                                    {filter === "returned" ? "No books have been returned yet"
                                                   : filter === "overdue"  ? "No overdue books — all clear!"
                                                   : filter === "issued"   ? "No books are currently issued"
                                                   :                         "No issuances found"}
                                                </span>
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
                                                    <span className="font-medium text-gray-900 truncate max-w-25">{name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <div className="font-medium text-gray-800 truncate max-w-37.5">
                                                    {issue.bookSnapshot?.title || issue.book?.title || "—"}
                                                </div>
                                                <div className="text-[11px] text-gray-400 truncate max-w-37.5">
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
                                                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-60 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition">
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
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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