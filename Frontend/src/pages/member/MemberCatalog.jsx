import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllBooks,
    searchBooks,
    requestBook
} from "../../services/memberService";
import NavBar from "../../Components/NavBar";

function AvailabilityPill({ available, total }) {
    const pct = total > 0 ? (available / total) * 100 : 0;
    const color =
        pct === 0   ? "bg-red-100 text-red-700"
      : pct <= 33   ? "bg-amber-100 text-amber-700"
      :               "bg-green-100 text-green-700";
    const barColor =
        pct === 0   ? "bg-red-500"
      : pct <= 33   ? "bg-amber-500"
      :               "bg-green-500";
    return (
        <div className="flex items-center gap-2">
            <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
                {available}/{total}
            </span>
        </div>
    );
}

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            {[120, 80, 60, 60, 80, 60].map((w, i) => (
                <td key={i} className="py-3 px-3">
                    <div className={`h-2.5 bg-gray-100 rounded`} style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Skeleton card (mobile / tablet) ─────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-100 rounded w-40 mb-2" />
                    <div className="h-2.5 bg-gray-100 rounded w-28 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-20" />
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-14 shrink-0" />
            </div>
            <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-100 rounded-full w-20" />
                <div className="h-8 bg-gray-100 rounded-md w-20" />
            </div>
        </div>
    );
}

// ─── Book card (mobile / tablet) ──────────────────────────────────────────────
function BookCard({ book, onRequest }) {
    return (
        <div className="p-4 border-b border-gray-100 last:border-0">
            {/* Top: title + genre badge */}
            <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm leading-snug truncate">
                        {book.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 truncate">{book.author}</div>
                    {book.isbn && (
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{book.isbn}</div>
                    )}
                </div>
                {book.bookshelves?.[0] && (
                    <span className="shrink-0 text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                        {book.bookshelves[0]}
                    </span>
                )}
            </div>

            {/* Bottom: availability + request button */}
            <div className="flex items-center justify-between mt-3">
                <AvailabilityPill available={book.availableCopies} total={book.totalCopies} />
                <button
                    onClick={() => onRequest(book)}
                    className="text-xs px-3 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:border-indigo-400 cursor-pointer hover:text-indigo-600 transition font-medium"
                >
                    Request
                </button>
            </div>
        </div>
    );
}

// ─── Request Book Modal ───────────────────────────────────────────────────────
function RequestModal({ book, onClose, onConfirm, isRequesting }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 text-center">
                {/* Drag handle — mobile only */}
                <div className="flex justify-center -mt-2 mb-4 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Request "{book?.title}"?</h3>
                <p className="text-sm text-gray-500 mb-5">
                    Are you sure you want to request this book?
                </p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-200 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-md transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isRequesting}
                        className="px-4 py-2 bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 rounded-md transition disabled:opacity-50"
                    >
                        {isRequesting ? "Requesting..." : "Request"}
                    </button>
                </div>
            </div>
        </div>
    )
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function MemberCatalog() {
    const queryClient = useQueryClient();

    const [page,        setPage]        = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [modalBook,   setModalBook]   = useState(null);   // null = closed, {} = add, book = edit
    const [toast,       setToast]       = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetch books ───────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ["member-books", page, searchQuery],
        queryFn:  () =>
            searchQuery
                ? searchBooks(searchQuery, page)
                : getAllBooks(page, 10),
        keepPreviousData: true,
    });

    const books      = data?.books      ?? [];
    const pagination = data?.pagination  ?? {};

    // ── Request mutation ───────────────────────────────────────────────────────
    const requestMutation = useMutation({
        mutationFn: (id) => requestBook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["member-books"] });
            showToast("Book requested successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Request failed", "error"),
    })

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput.trim());
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="member" />

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition ${
                    toast.type === "error"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                    {toast.msg}
                </div>
            )}

            <div className="p-4 sm:p-5 pb-24 sm:pb-8 max-w-7xl mx-auto flex flex-col gap-4">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Books</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {pagination.total ? `${pagination.total} books in catalog` : "Manage your book catalog"}
                        </p>
                    </div>
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title or author..."
                            className="text-sm outline-none text-gray-700 flex-1 bg-transparent"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition">
                        Search
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setSearchInput(""); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Clear
                        </button>
                    )}
                </form>

                {/* ── Desktop table (lg+) ── */}
                <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                {["Title", "Author", "ISBN", "Genre", "Availability", "Actions"].map((h) => (
                                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-3 px-3 border-b border-gray-100">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : books.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                                            {searchQuery ? `No books found for "${searchQuery}"` : "No books in catalog yet"}
                                        </td>
                                    </tr>
                                )
                                : books.map((book) => (
                                    <tr key={book._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                        <td className="py-3 px-3">
                                            <div className="font-medium text-gray-900 truncate max-w-45">{book.title}</div>
                                            {book.isbn && <div className="text-[11px] text-gray-400 font-mono mt-0.5">{book.isbn}</div>}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600">{book.author}</td>
                                        <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{book.isbn || "—"}</td>
                                        <td className="py-3 px-3">
                                            {book.bookshelves?.[0]
                                                ? <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">{book.bookshelves[0]}</span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="py-3 px-3">
                                            <AvailabilityPill
                                                available={book.availableCopies}
                                                total={book.totalCopies}
                                            />
                                        </td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setModalBook(book)} // Open request modal with selected book
                                                    className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:border-indigo-400 cursor-pointer hover:text-indigo-600 transition"
                                                >
                                                    Request
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} books
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 transition disabled:opacity-40"
                                >
                                    ← Prev
                                </button>

                                {(() => {
                                    const total   = pagination.totalPages;
                                    const current = pagination.page;
                                    const delta   = 2; // pages on each side of current

                                    let start = Math.max(1, current - delta);
                                    let end   = Math.min(total, current + delta);

                                    // Shift window if near the edges can always see 5 buttons
                                    if (current - delta < 1) end = Math.min(total, end + (delta - current + 1));
                                    if (current + delta > total) start = Math.max(1, start - (current + delta - total));

                                    const pages = [];

                                    // Leading ellipsis
                                    if (start > 1) {
                                        pages.push(
                                            <button key={1} onClick={() => setPage(1)}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                                                1
                                            </button>
                                        );
                                        if (start > 2) pages.push(<span key="start-ellipsis" className="px-1 text-gray-400 text-xs">…</span>);
                                    }

                                    // Window pages
                                    for (let p = start; p <= end; p++) {
                                        pages.push(
                                            <button key={p} onClick={() => setPage(p)}
                                                className={`px-3 py-1.5 text-xs border rounded-md transition cursor-pointer ${
                                                    p === current
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                                }`}>
                                                {p}
                                            </button>
                                        );
                                    }

                                    // Trailing ellipsis
                                    if (end < total) {
                                        if (end < total - 1) pages.push(<span key="end-ellipsis" className="px-1 text-gray-400 text-xs">…</span>);
                                        pages.push(
                                            <button key={total} onClick={() => setPage(total)}
                                                className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition cursor-pointer">
                                                {total}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}

                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 transition disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Mobile & Tablet card list (< lg) ── */}
                <div className="lg:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {isLoading
                        ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : books.length === 0
                        ? (
                            <div className="py-16 flex flex-col items-center gap-2">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-200">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                </svg>
                                <span className="text-sm text-gray-400">
                                    {searchQuery ? `No books found for "${searchQuery}"` : "No books in catalog yet"}
                                </span>
                            </div>
                        )
                        : books.map((book) => (
                            <BookCard
                                key={book._id}
                                book={book}
                                onRequest={setModalBook}
                            />
                        ))
                    }

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                {pagination.page} / {pagination.totalPages} · {pagination.total} books
                            </span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Request Modal */}
            {modalBook && (
                <RequestModal
                    book={modalBook}
                    onClose={() => setModalBook(null)}
                    onConfirm={() => requestMutation.mutate(modalBook._id, {
                        onSuccess: () => setModalBook(null)
                    })}
                    isRequesting={requestMutation.isPending}
                />
            )}
        </div>
    );
}