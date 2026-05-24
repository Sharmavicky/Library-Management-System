import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllRequests, approveRequest, rejectRequest } from "../../services/adminServices";
import NavBar from "../../Components/NavBar";
import { useState } from "react";

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            {[140, 100, 80, 70, 90].map((w, i) => (
                <td key={i} className="py-3 px-3">
                    <div className="h-2.5 bg-gray-100 rounded" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

const STATUS_STYLES = {
    pending:  "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

export default function AdminRequests() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const { data, isLoading } = useQuery({
        queryKey: ["book-requests"],
        queryFn: getAllRequests,
    });

    const requests = data?.requests ?? [];

    const approveMutation = useMutation({
        mutationFn: (id) => approveRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["book-requests"] });
            showToast("Request approved!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Approve failed", "error"),
    });

    const rejectMutation = useMutation({
        mutationFn: (id) => rejectRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["book-requests"] });
            showToast("Request rejected.");
        },
        onError: (err) => showToast(err.response?.data?.message || "Reject failed", "error"),
    });

    const isPending = approveMutation.isPending || rejectMutation.isPending;

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

            <div className="p-5 max-w-5xl mx-auto flex flex-col gap-4">

                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Book Requests</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {isLoading ? "Loading…" : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                {["Member", "Book", "Requested On", "Status", "Actions"].map((h) => (
                                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-3 px-3 border-b border-gray-100">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array(6).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                : requests.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                                            No book requests yet
                                        </td>
                                    </tr>
                                )
                                : requests.map((req) => {
                                    const date = req.requestedAt
                                        ? new Date(req.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                        : "—";
                                    const isPendingRow = req.status === "pending";
                                    return (
                                        <tr key={req._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                            <td className="py-3 px-3 font-medium text-gray-900">
                                                {req.member?.name || req.member?.email || "—"}
                                            </td>
                                            <td className="py-3 px-3 text-gray-600 truncate max-w-48">
                                                {req.book?.title || "—"}
                                            </td>
                                            <td className="py-3 px-3 text-gray-400 text-xs">{date}</td>
                                            <td className="py-3 px-3">
                                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[req.status] ?? "bg-gray-100 text-gray-500"}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {isPendingRow && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => approveMutation.mutate(req._id)}
                                                            disabled={isPending}
                                                            className="text-[11px] px-2.5 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => rejectMutation.mutate(req._id)}
                                                            disabled={isPending}
                                                            className="text-[11px] px-2.5 py-1 border border-gray-200 text-gray-500 rounded-md hover:border-red-400 hover:text-red-600 transition disabled:opacity-50 cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}