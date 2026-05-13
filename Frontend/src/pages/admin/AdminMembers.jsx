import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllMembers,
    getMemberById,
    blockMember,
    clearMemberFine,
    deleteMember,
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
const getAvatar = (name = "") => avatarPalette[name.charCodeAt(0) % avatarPalette.length];

const fmt = (n = 0) => `₹${Number(n).toLocaleString("en-IN")}`;

function SkeletonRow() {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            {[140, 120, 80, 70, 70, 90].map((w, i) => (
                <td key={i} className="py-3 px-3">
                    <div className="h-2.5 bg-gray-100 rounded" style={{ width: w }} />
                </td>
            ))}
        </tr>
    );
}

// ─── User detail side panel ───────────────────────────────────────────────────
function UserDetailPanel({ userId, onClose }) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-member", userId],
        queryFn:  () => getMemberById(userId),
        enabled:  !!userId,
    });

    const member = data?.member;
    const outstanding = data?.outstandingFine ?? 0;

    if (isLoading) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 p-5 flex flex-col gap-4 animate-pulse">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto" />
                <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
                <div className="h-3 w-32 bg-gray-100 rounded mx-auto" />
            </div>
        );
    }

    if (!member) return null;

    const avatar = getAvatar(member.username || "");

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-900">Member profile</span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">
                {/* Avatar + name */}
                <div className="text-center">
                    <div className={`w-14 h-14 rounded-full ${avatar.bg} ${avatar.text} text-lg font-bold flex items-center justify-center mx-auto mb-2`}>
                        {getInitials(member.username)}
                    </div>
                    <div className="font-semibold text-gray-900">{member.username}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{member.email}</div>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            member.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}>
                            {member.isActive ? "Active" : "Blocked"}
                        </span>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                            Member
                        </span>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: "Outstanding fine", value: fmt(outstanding), color: outstanding > 0 ? "text-red-600" : "text-green-600" },
                        { label: "Member since",     value: new Date(member.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }), color: "text-gray-700" },
                    ].map((s) => (
                        <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Fine warning */}
                {outstanding > 0 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 text-xs text-red-700">
                        This member has <span className="font-semibold">{fmt(outstanding)}</span> in unpaid fines. They cannot borrow new books until cleared.
                    </div>
                )}

                {/* Member ID */}
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <div className="text-[10px] text-gray-400 mb-0.5">Member ID</div>
                    <div className="text-[11px] font-mono text-gray-600 break-all">{member._id}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onClose, onConfirm, isLoading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{message}</p>
                <div className="flex gap-2 justify-center">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm text-white rounded-lg font-semibold cursor-pointer transition disabled:opacity-50 ${confirmClass}`}
                    >
                        {isLoading ? "Please wait..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminUsers() {
    const queryClient = useQueryClient();

    const [page,          setPage]          = useState(1);
    const [selectedId,    setSelectedId]    = useState(null);
    const [confirmModal,  setConfirmModal]  = useState(null);
    const [toast,         setToast]         = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetch all members ─────────────────────────────────────────────────────
    const { data, isLoading } = useQuery({
        queryKey: ["admin-members", page],
        queryFn:  () => getAllMembers(page),
        keepPreviousData: true,
    });

    const members    = data?.members    ?? [];
    const pagination = data?.pagination ?? {};

    // ── Block/unblock mutation ────────────────────────────────────────────────
    const blockMutation = useMutation({
        mutationFn: (userId) => blockMember(userId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["admin-members"] });
            queryClient.invalidateQueries({ queryKey: ["admin-member", selectedId] });
            setConfirmModal(null);
            showToast(res.message || "Member status updated!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Action failed", "error"),
    });

    // ── Clear fine mutation ───────────────────────────────────────────────────
    const clearFineMutation = useMutation({
        mutationFn: (userId) => clearMemberFine(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-members"] });
            queryClient.invalidateQueries({ queryKey: ["admin-member", selectedId] });
            setConfirmModal(null);
            showToast("Fines cleared successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Could not clear fine", "error"),
    });

    // ── Delete mutation ───────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: (userId) => deleteMember(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-members"] });
            if (selectedId === confirmModal?.userId) setSelectedId(null);
            setConfirmModal(null);
            showToast("Member deleted successfully!");
        },
        onError: (err) => showToast(err.response?.data?.message || "Cannot delete — member may have active issues or fines", "error"),
    });

    const isMutating =
        blockMutation.isPending ||
        clearFineMutation.isPending ||
        deleteMutation.isPending;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <NavBar />

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

            <div className="flex h-[calc(100vh-53px)]">

                {/* ── Main table area ── */}
                <div className="flex-1 overflow-auto p-5">
                    <div className="flex flex-col gap-4 max-w-5xl">

                        {/* Page header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Members</h1>
                                <p className="text-sm text-gray-400 mt-0.5">
                                    {pagination.total ? `${pagination.total} registered members` : "Manage library members"}
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-50">
                                        {["Member", "Email", "Status", "Role", "Joined", "Actions"].map((h) => (
                                            <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-gray-400 py-3 px-3 border-b border-gray-100">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading
                                        ? Array(8).fill(0).map((_, i) => <SkeletonRow key={i} />)
                                        : members.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center text-sm text-gray-400">
                                                    No members registered yet
                                                </td>
                                            </tr>
                                        )
                                        : members.map((member) => {
                                            const avatar    = getAvatar(member.username || "");
                                            const isSelected = selectedId === member._id;

                                            return (
                                                <tr
                                                    key={member._id}
                                                    onClick={() => setSelectedId(isSelected ? null : member._id)}
                                                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition ${
                                                        isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {/* Member name + avatar */}
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-7 h-7 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                                                                {getInitials(member.username)}
                                                            </div>
                                                            <span className="font-medium text-gray-900 truncate max-w-30">
                                                                {member.username}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Email */}
                                                    <td className="py-3 px-3 text-gray-500 truncate max-w-40">
                                                        {member.email}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="py-3 px-3">
                                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                                            member.isActive
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-green-500" : "bg-red-500"}`} />
                                                            {member.isActive ? "Active" : "Blocked"}
                                                        </span>
                                                    </td>

                                                    {/* Role */}
                                                    <td className="py-3 px-3">
                                                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                            {member.role}
                                                        </span>
                                                    </td>

                                                    {/* Joined date */}
                                                    <td className="py-3 px-3 text-gray-400 text-xs">
                                                        {new Date(member.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric"
                                                        })}
                                                    </td>

                                                    {/* Actions — stop propagation so row click doesn't fire */}
                                                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1.5">
                                                            {/* Block/Unblock */}
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    type:    member.isActive ? "block" : "unblock",
                                                                    userId:  member._id,
                                                                    name:    member.username,
                                                                    active:  member.isActive,
                                                                })}
                                                                className={`text-[11px] px-2.5 py-1 border rounded-md transition cursor-pointer ${
                                                                    member.isActive
                                                                        ? "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"
                                                                        : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
                                                                }`}
                                                            >
                                                                {member.isActive ? "Block" : "Unblock"}
                                                            </button>

                                                            {/* Clear fine */}
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    type:   "clearFine",
                                                                    userId: member._id,
                                                                    name:   member.username,
                                                                })}
                                                                className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition"
                                                            >
                                                                Clear fine
                                                            </button>

                                                            {/* Delete */}
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    type:   "delete",
                                                                    userId: member._id,
                                                                    name:   member.username,
                                                                })}
                                                                className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-red-300 hover:text-red-600 transition"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
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
                                        Page {pagination.page} of {pagination.totalPages} · {pagination.total} members
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={!pagination.hasPrev}
                                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:bg-gray-50 transition disabled:opacity-40"
                                        >
                                            ← Prev
                                        </button>
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

                    </div>
                </div>

                {/* ── Side panel — slides in when a row is clicked ── */}
                {selectedId && (
                    <UserDetailPanel
                        userId={selectedId}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </div>

            {/* ── Confirm modals ── */}
            {confirmModal?.type === "block" && (
                <ConfirmModal
                    title={`Block ${confirmModal.name}?`}
                    message="This member will no longer be able to borrow books. You can unblock them anytime."
                    confirmLabel="Block member"
                    confirmClass="bg-amber-500 hover:bg-amber-600"
                    onClose={() => setConfirmModal(null)}
                    onConfirm={() => blockMutation.mutate(confirmModal.userId)}
                    isLoading={isMutating}
                />
            )}
            {confirmModal?.type === "unblock" && (
                <ConfirmModal
                    title={`Unblock ${confirmModal.name}?`}
                    message="This member will be able to borrow books again."
                    confirmLabel="Unblock member"
                    confirmClass="bg-green-600 hover:bg-green-700"
                    onClose={() => setConfirmModal(null)}
                    onConfirm={() => blockMutation.mutate(confirmModal.userId)}
                    isLoading={isMutating}
                />
            )}
            {confirmModal?.type === "clearFine" && (
                <ConfirmModal
                    title={`Clear fines for ${confirmModal.name}?`}
                    message="All pending and partial fines will be marked as paid. This cannot be undone."
                    confirmLabel="Clear fines"
                    confirmClass="bg-blue-600 hover:bg-blue-700"
                    onClose={() => setConfirmModal(null)}
                    onConfirm={() => clearFineMutation.mutate(confirmModal.userId)}
                    isLoading={isMutating}
                />
            )}
            {confirmModal?.type === "delete" && (
                <ConfirmModal
                    title={`Delete ${confirmModal.name}?`}
                    message="This will permanently delete the member account. Only works if they have no active issues or outstanding fines."
                    confirmLabel="Delete member"
                    confirmClass="bg-red-600 hover:bg-red-700"
                    onClose={() => setConfirmModal(null)}
                    onConfirm={() => deleteMutation.mutate(confirmModal.userId)}
                    isLoading={isMutating}
                />
            )}
        </div>
    );
}