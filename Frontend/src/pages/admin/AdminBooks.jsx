import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllBooks,
    searchBooks,
    updateBook,
    deleteBook,
    addBooks,
} from "../../services/adminServices";
import NavBar from "../../Components/NavBar";
import { LuX, LuTrash2, LuSearch, LuPlus } from "react-icons/lu"

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

// Mobile skeleton card
function SkeletonCard() {
    return (
        <div className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="h-3 bg-gray-100 rounded w-36 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-24" />
                </div>
                <div className="h-2.5 bg-gray-100 rounded w-16" />
            </div>
            <div className="flex items-center gap-2">
                <div className="h-2.5 bg-gray-100 rounded w-20" />
                <div className="h-2.5 bg-gray-100 rounded w-14" />
            </div>
        </div>
    );
}

// Mobile book card
function BookCard({ book, onEdit, onDelete }) {
    const pct = book.totalCopies > 0 ? (book.availableCopies / book.totalCopies) * 100 : 0;
    const pillColor =
        pct === 0   ? "bg-red-100 text-red-700"
      : pct <= 33   ? "bg-amber-100 text-amber-700"
      :               "bg-green-100 text-green-700";
    const barColor =
        pct === 0   ? "bg-red-500"
      : pct <= 33   ? "bg-amber-500"
      :               "bg-green-500";

    return (
        <div className="p-4 border-b border-gray-100 last:border-0">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm leading-snug truncate">{book.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{book.author}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => onEdit(book)}
                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(book)}
                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:border-red-300 hover:text-red-600 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
                {book.isbn && (
                    <span className="text-[11px] text-gray-400 font-mono">{book.isbn}</span>
                )}
                {book.bookshelves?.[0] && (
                    <span className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                        {book.bookshelves[0]}
                    </span>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pillColor}`}>
                        {book.availableCopies}/{book.totalCopies}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function BookModal({ book, onClose, onSave, isSaving }) {
    const isEdit = !!book?._id;
    const [form, setForm] = useState({
        title:       book?.title       || "",
        author:      book?.author      || "",
        isbn:        book?.isbn        || "",
        summary:     book?.summary     || "",
        totalCopies: book?.totalCopies || 1,
    });

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...form, totalCopies: Number(form.totalCopies) });
    };

    const inputClass =
        "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition";
    const labelClass =
        "text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[90dvh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">
                        {isEdit ? "Edit book" : "Add new book"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-50 transition"
                    >
                        <LuX size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 flex flex-col gap-4">
                    <div>
                        <label className={labelClass}>Title</label>
                        <input className={inputClass} value={form.title} onChange={set("title")} required placeholder="Book title" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Author</label>
                            <input className={inputClass} value={form.author} onChange={set("author")} required placeholder="Author name" />
                        </div>
                        <div>
                            <label className={labelClass}>ISBN</label>
                            <input className={inputClass} value={form.isbn} onChange={set("isbn")} placeholder="978-..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Total copies</label>
                            <input
                                type="number" min="1" className={inputClass}
                                value={form.totalCopies} onChange={set("totalCopies")} required
                            />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Summary (optional)</label>
                        <textarea
                            className={`${inputClass} resize-none`} rows={3}
                            value={form.summary} onChange={set("summary")} placeholder="Short description..."
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Add book"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ book, onClose, onConfirm, isDeleting }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:px-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LuTrash2 size={20} className="text-red-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Delete "{book?.title}"?</h3>
                <p className="text-sm text-gray-500 mb-5">
                    This cannot be undone. The book will be permanently removed from the catalog.
                </p>
                <div className="flex gap-2 justify-center pb-safe">
                    <button onClick={onClose} className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm bg-red-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {isDeleting ? "Deleting..." : "Yes, delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminBooks() {
    const queryClient = useQueryClient();

    const [page,        setPage]        = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [modalBook,   setModalBook]   = useState(null);   // null = closed, {} = add, book = edit
    const [deleteBook_, setDeleteBook_] = useState(null);
    const [toast,       setToast]       = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetch books ───────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ["admin-books", page, searchQuery],
        queryFn:  () =>
            searchQuery
                ? searchBooks(searchQuery, page)
                : getAllBooks(page, 10),
        keepPreviousData: true,
    });

    const books      = data?.books      ?? [];
    const pagination = data?.pagination  ?? {};

    // ── Update mutation ───────────────────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateBook(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-books"] });
            setModalBook(null);
            showToast("Book updated successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Update failed", "error"),
    });

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (id) => deleteBook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-books"] });
            setDeleteBook_(null);
            showToast("Book deleted successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Delete failed — book may have active issuances", "error"),
    });

    // ── Add Books ────────────────────────────────────────────────────────────
    const addMutation = useMutation({
        mutationFn: (data) => addBooks(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-books"] });
            setModalBook(null);
            showToast("Book added successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Add failed", "error"),
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleSearch = (e) => {
        e.preventDefault();
        setSearchQuery(searchInput.trim());
        setPage(1);
    };

    const handleSave = (formData) => {
        if (modalBook._id) {
            updateMutation.mutate({ id: modalBook._id, data: formData });
        } else {
            addMutation.mutate(formData);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="admin" />

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

            <div className="p-4 sm:p-6 pb-24 sm:pb-8 max-w-7xl mx-auto flex flex-col gap-4">

                {/* Page header */}
                <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-gray-900">Books</h1>
                        <p className="text-sm text-gray-400 mt-0.5 truncate">
                            {pagination.total ? `${pagination.total} books in catalog` : "Manage your book catalog"}
                        </p>
                    </div>
                    <button
                        onClick={() => setModalBook({})}
                        className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition"
                    >
                        <LuPlus size={16} />
                        <span>Add book</span>
                    </button>
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-0 sm:max-w-sm">
                        <LuSearch size={16} className="shrink-0 text-gray-400" />
                        <input
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by title or author..."
                            className="text-sm outline-none text-gray-700 flex-1 min-w-0 bg-transparent"
                        />
                    </div>
                    <button type="submit" className="shrink-0 px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-indigo-700 transition">
                        Search
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(""); setSearchInput(""); setPage(1); }}
                            className="shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Clear
                        </button>
                    )}
                </form>

                {/* Table — desktop only */}
                <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                                                    onClick={() => setModalBook(book)}
                                                    className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:border-indigo-400 cursor-pointer hover:text-indigo-600 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteBook_(book)}
                                                    className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 hover:border-red-300 cursor-pointer hover:text-red-600 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>

                    {/* Pagination — desktop */}
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

                                    // Shift window if near the edges so you always see 5 buttons
                                    if (current - delta < 1)     end   = Math.min(total, end + (delta - current + 1));
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

                {/* Card list — mobile only */}
                <div className="sm:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {isLoading
                        ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : books.length === 0
                        ? (
                            <div className="py-16 text-center text-sm text-gray-400">
                                {searchQuery ? `No books found for "${searchQuery}"` : "No books in catalog yet"}
                            </div>
                        )
                        : books.map((book) => (
                            <BookCard
                                key={book._id}
                                book={book}
                                onEdit={setModalBook}
                                onDelete={setDeleteBook_}
                            />
                        ))
                    }

                    {/* Pagination — mobile */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPrev}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {modalBook !== null && (
                <BookModal
                    book={modalBook._id ? modalBook : null}
                    onClose={() => setModalBook(null)}
                    onSave={handleSave}
                    isSaving={updateMutation.isPending}
                />
            )}
            {deleteBook_ && (
                <DeleteModal
                    book={deleteBook_}
                    onClose={() => setDeleteBook_(null)}
                    onConfirm={() => deleteMutation.mutate(deleteBook_._id)}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    );
}