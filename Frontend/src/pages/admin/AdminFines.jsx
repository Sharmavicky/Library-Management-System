import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllFines,
    payFine,
    waiveFine,
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

const fmtCurrency = (n = 0) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// ─── Status badge ─────────────────────────────────────────────────────────────
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

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            {[130, 140, 70, 70, 70, 80, 70, 80].map((w, i) => (
                <td key={i} className="py-3 px-3">
                    <div className="h-2.5 bg-gray-100 rounded" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Pay Fine Modal ───────────────────────────────────────────────────────────
function PayFineModal({ fine, onClose, onPay, isPaying }) {
    const balance = fine.totalAmount - fine.paidAmount;
    const [amount, setAmount] = useState(balance);
    const [error,  setError]  = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        const val = Number(amount);
        if (!val || val <= 0) { setError("Enter a valid amount"); return; }
        if (val > balance)    { setError(`Maximum payable is ${fmtCurrency(balance)}`); return; }
        onPay(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Record payment</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-50 transition"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 pt-4 pb-2">
                    {/* Fine summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Member</span>
                            <span className="font-medium text-gray-900">{fine.member?.username || "—"}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Book</span>
                            <span className="font-medium text-gray-900 text-right max-w-40 truncate">
                                {fine.issue?.book?.title || fine.issue?.bookSnapshot?.title || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Total fine</span>
                            <span className="font-semibold text-gray-900">{fmtCurrency(fine.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Already paid</span>
                            <span className="font-semibold text-green-600">{fmtCurrency(fine.paidAmount)}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2" />
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold text-gray-700">Balance due</span>
                            <span className="font-bold text-red-600">{fmtCurrency(balance)}</span>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="text-[11px] text-gray-400 mb-4 text-center">
                        {fine.daysOverdue} day{fine.daysOverdue !== 1 ? "s" : ""} overdue × ₹{fine.ratePerDay}/day = {fmtCurrency(fine.totalAmount)}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-5 flex flex-col gap-3">
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">
                            Amount to pay now
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                            <input
                                type="number"
                                min="1"
                                max={balance}
                                step="1"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                                className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>

                    {/* Quick fill buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setAmount(balance)}
                            className="flex-1 px-3 py-1.5 text-xs border border-indigo-200 text-indigo-600 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition font-medium"
                        >
                            Full amount ({fmtCurrency(balance)})
                        </button>
                        {balance > 10 && (
                            <button
                                type="button"
                                onClick={() => setAmount(Math.floor(balance / 2))}
                                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                            >
                                Half ({fmtCurrency(Math.floor(balance / 2))})
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPaying}
                            className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {isPaying ? "Recording..." : "Record payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Waive Fine Modal ─────────────────────────────────────────────────────────
function WaiveFineModal({ fine, onClose, onWaive, isWaiving }) {
    const [reason, setReason] = useState("");
    const [error,  setError]  = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim() || reason.trim().length < 5) {
            setError("Please provide a reason (at least 5 characters)");
            return;
        }
        onWaive(reason.trim());
    };

    const quickReasons = [
        "Medical emergency",
        "Senior citizen",
        "First time offence",
        "System error — fine raised incorrectly",
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Waive fine</h2>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-gray-900">{fine.member?.username}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {fine.issue?.book?.title || "—"} · {fine.daysOverdue} days overdue
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-base font-bold text-red-600">{fmtCurrency(fine.totalAmount)}</div>
                            <div className="text-[10px] text-gray-400">to be waived</div>
                        </div>
                    </div>

                    {/* Quick reason chips */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Quick reasons</p>
                        <div className="flex flex-wrap gap-2">
                            {quickReasons.map((r) => (
                                <button key={r} type="button"
                                    onClick={() => { setReason(r); setError(""); }}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                                        reason === r
                                            ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-medium"
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom reason textarea */}
                    <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1 block">
                            Reason for waiving
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(""); }}
                            rows={3}
                            placeholder="Enter reason for waiving this fine..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={isWaiving}
                            className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-red-700 transition disabled:opacity-50">
                            {isWaiving ? "Waiving..." : "Waive fine"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminFines() {
    const queryClient = useQueryClient();

    const [page,       setPage]       = useState(1);
    const [filter,     setFilter]     = useState("all");
    const [payFine_,   setPayFine_]   = useState(null);
    const [waiveFine_, setWaiveFine_] = useState(null);
    const [toast,      setToast]      = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Fetch fines ───────────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ["admin-fines", page, filter],
        queryFn:  () => getAllFines(filter === "all" ? undefined : filter, page),
        keepPreviousData: true,
    });

    const fines          = data?.fines          ?? [];
    const pagination     = data?.pagination     ?? {};
    const totalOutstanding = data?.totalOutstanding ?? 0;

    // ── Pay mutation ──────────────────────────────────────────────────────────
    const payMutation = useMutation({
        mutationFn: ({ fineId, amount }) => payFine(fineId, amount),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-fines"] });
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
            setPayFine_(null);
            showToast(res.message || "Payment recorded!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Payment failed", "error"),
    });

    // ── Waive mutation ────────────────────────────────────────────────────────
    const waiveMutation = useMutation({
        mutationFn: ({ fineId, reason }) => waiveFine(fineId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-fines"] });
            queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
            setWaiveFine_(null);
            showToast("Fine waived successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Waive failed", "error"),
    });

    const filterTabs = [
        { key: "all",     label: "All"     },
        { key: "pending", label: "Pending" },
        { key: "partial", label: "Partial" },
        { key: "paid",    label: "Paid"    },
        { key: "waived",  label: "Waived"  },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar userType="admin" />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
                    toast.type === "error"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                    {toast.msg}
                </div>
            )}

            <div className="p-5 max-w-350 mx-auto flex flex-col gap-4">

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Fines</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {pagination.total
                                ? `${pagination.total} fine records`
                                : "Track and collect library fines"}
                        </p>
                    </div>
                    {/* Outstanding summary pill */}
                    {!isLoading && totalOutstanding > 0 && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                            <span className="text-xs text-red-600">Total outstanding</span>
                            <span className="text-base font-bold text-red-700">{fmtCurrency(totalOutstanding)}</span>
                        </div>
                    )}
                    {!isLoading && totalOutstanding === 0 && filter === "all" && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                            <span className="text-xs text-green-600 font-medium">All fines cleared ✓</span>
                        </div>
                    )}
                </div>

                {/* Summary stat cards */}
                {!isLoading && (
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: "Total records", value: pagination.total ?? 0,          color: "text-gray-900",   bg: "bg-white"       },
                            { label: "Pending",        value: fines.filter(f => f.status === "pending").length, color: "text-amber-600", bg: "bg-amber-50"    },
                            { label: "Paid",           value: fines.filter(f => f.status === "paid").length,    color: "text-green-600", bg: "bg-green-50"    },
                            { label: "Outstanding",    value: fmtCurrency(totalOutstanding),  color: "text-red-600",   bg: "bg-red-50"      },
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl px-4 py-3`}>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{s.label}</div>
                                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                    {filterTabs.map((tab) => (
                        <button key={tab.key} onClick={() => { setFilter(tab.key); setPage(1); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                                filter === tab.key
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-500 hover:text-indigo-600"
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
                                {["Member", "Book", "Days late", "Fine", "Paid", "Balance", "Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-3 px-3 border-b border-gray-100">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : fines.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8} className="py-16 text-center">
                                            <div className="text-sm text-gray-400">
                                                No {filter !== "all" ? filter : ""} fines found
                                            </div>
                                        </td>
                                    </tr>
                                )
                                : fines.map((fine, i) => {
                                    const name      = fine.member?.username || "Unknown";
                                    const avatar    = getAvatar(name);
                                    const balance   = fine.totalAmount - fine.paidAmount;
                                    const isSettled = fine.status === "paid" || fine.status === "waived";
                                    const bookTitle = fine.issue?.book?.title
                                        || fine.issue?.bookSnapshot?.title
                                        || "—";

                                    return (
                                        <tr key={fine._id || i}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">

                                            {/* Member */}
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} text-[11px] font-bold flex items-center justify-center shrink-0`}>
                                                        {getInitials(name)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 truncate max-w-25">{name}</div>
                                                        <div className="text-[10px] text-gray-400 truncate max-w-25">{fine.member?.email || ""}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Book */}
                                            <td className="py-3 px-3">
                                                <div className="font-medium text-gray-800 truncate max-w-35">{bookTitle}</div>
                                                {fine.issue?.dueDate && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        Due: {fmtDate(fine.issue.dueDate)}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Days late */}
                                            <td className="py-3 px-3">
                                                <span className={`text-sm font-semibold ${fine.daysOverdue > 0 ? "text-red-600" : "text-gray-500"}`}>
                                                    {fine.daysOverdue}d
                                                </span>
                                                <div className="text-[10px] text-gray-400">×₹{fine.ratePerDay}/day</div>
                                            </td>

                                            {/* Total fine */}
                                            <td className="py-3 px-3 font-semibold text-gray-900">
                                                {fmtCurrency(fine.totalAmount)}
                                            </td>

                                            {/* Paid */}
                                            <td className="py-3 px-3 font-semibold text-green-600">
                                                {fmtCurrency(fine.paidAmount)}
                                            </td>

                                            {/* Balance */}
                                            <td className="py-3 px-3">
                                                <span className={`font-bold text-sm ${
                                                    balance === 0 ? "text-gray-400" : "text-red-600"
                                                }`}>
                                                    {fmtCurrency(balance)}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-3">
                                                <StatusBadge status={fine.status} />
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-3">
                                                {!isSettled ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => setPayFine_(fine)}
                                                            className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition font-medium"
                                                        >
                                                            Pay
                                                        </button>
                                                        <button
                                                            onClick={() => setWaiveFine_(fine)}
                                                            className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-red-300 hover:text-red-600 transition"
                                                        >
                                                            Waive
                                                        </button>
                                                    </div>
                                                ) : fine.status === "waived" ? (
                                                    <span className="text-[11px] text-gray-400 italic truncate max-w-25 block" title={fine.waivedReason}>
                                                        {fine.waivedReason?.slice(0, 18) || "Waived"}…
                                                    </span>
                                                ) : (
                                                    <div className="text-[11px] text-gray-300 flex items-center gap-1">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                                                        Paid {fmtDate(fine.paidAt)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.total} records
                            </span>
                            <div className="flex items-center gap-1">
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
            </div>

            {/* Pay modal */}
            {payFine_ && (
                <PayFineModal
                    fine={payFine_}
                    onClose={() => setPayFine_(null)}
                    onPay={(amount) => payMutation.mutate({ fineId: payFine_._id, amount })}
                    isPaying={payMutation.isPending}
                />
            )}

            {/* Waive modal */}
            {waiveFine_ && (
                <WaiveFineModal
                    fine={waiveFine_}
                    onClose={() => setWaiveFine_(null)}
                    onWaive={(reason) => waiveMutation.mutate({ fineId: waiveFine_._id, reason })}
                    isWaiving={waiveMutation.isPending}
                />
            )}
        </div>
    );
}