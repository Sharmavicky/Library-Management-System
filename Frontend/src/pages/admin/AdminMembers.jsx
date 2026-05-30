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

// ─── Skeleton row (desktop table) ─────────────────────────────────────────────
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

// ─── Skeleton card (mobile / tablet card list) ────────────────────────────────
function SkeletonCard() {
    return (
        <div className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="h-3 bg-gray-100 rounded w-32 mb-1.5" />
                    <div className="h-2.5 bg-gray-100 rounded w-44" />
                </div>
                <div className="h-5 bg-gray-100 rounded-full w-16 shrink-0" />
            </div>
            <div className="flex gap-2">
                <div className="h-6 bg-gray-100 rounded-md w-16" />
                <div className="h-6 bg-gray-100 rounded-md w-20" />
                <div className="h-6 bg-gray-100 rounded-md w-14" />
            </div>
        </div>
    );
}

// ─── Mobile / tablet member card ──────────────────────────────────────────────
function MemberCard({ member, isSelected, onSelect, onAction }) {
    const avatar = getAvatar(member.username || "");

    return (
        <div
            onClick={() => onSelect(member._id)}
            className={`p-4 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                isSelected ? "bg-indigo-50" : "hover:bg-gray-50/80 active:bg-gray-100"
            }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center text-[12px] font-bold shrink-0`}>
                    {getInitials(member.username)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">{member.username}</div>
                    <div className="text-xs text-gray-400 truncate">{member.email}</div>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                    member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    {member.isActive ? "Active" : "Blocked"}
                </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {member.role}
                </span>
                <span className="text-[11px] text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </span>
                <div className="ml-auto flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onAction({ type: member.isActive ? "block" : "unblock", userId: member._id, name: member.username, active: member.isActive })}
                        className={`text-[11px] px-2.5 py-1 border rounded-md transition cursor-pointer ${
                            member.isActive
                                ? "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"
                                : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
                        }`}
                    >
                        {member.isActive ? "Block" : "Unblock"}
                    </button>
                    <button
                        onClick={() => onAction({ type: "clearFine", userId: member._id, name: member.username })}
                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition"
                    >
                        Clear fine
                    </button>
                    <button
                        onClick={() => onAction({ type: "delete", userId: member._id, name: member.username })}
                        className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-red-300 hover:text-red-600 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── User detail panel ────────────────────────────────────────────────────────
// Shared content is just inlined JSX — no nested component definitions.
// Mobile  → bottom sheet (fixed overlay slides up)
// Tablet  → fixed overlay side panel on the right
// Desktop → inline side panel in the flex row (rendered by parent)
function UserDetailPanel({ userId, onClose }) {
    const { data, isLoading } = useQuery({
        queryKey: ["admin-member", userId],
        queryFn:  () => getMemberById(userId),
        enabled:  !!userId,
    });

    const member      = data?.member;
    const outstanding = data?.outstandingFine ?? 0;

    // ── Shared panel body — plain JSX, NOT a nested component ─────────────────
    const panelBody = isLoading ? (
        <div className="p-5 flex flex-col gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto" />
            <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
            <div className="h-3 w-32 bg-gray-100 rounded mx-auto" />
        </div>
    ) : member ? (() => {
        const avatar = getAvatar(member.username || "");
        return (
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
                            member.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
        );
    })() : null;

    // ── Panel header — reused in all three layouts ─────────────────────────────
    const panelHeader = (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-900">Member profile</span>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none cursor-pointer"
            >
                ✕
            </button>
        </div>
    );

    return (
        <>
            {/* ── Mobile: bottom sheet ── */}
            <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />
                <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[80dvh] flex flex-col">
                    <div className="flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 rounded-full bg-gray-200" />
                    </div>
                    {panelHeader}
                    {panelBody}
                </div>
            </div>

            {/* ── Tablet: fixed overlay side panel ── */}
            <div className="hidden md:flex lg:hidden fixed top-13.25 right-0 bottom-0 z-30 w-72 bg-white border-l border-gray-200 flex-col shadow-xl">
                {panelHeader}
                {panelBody}
            </div>

            {/* ── Desktop: inline side panel in flex row ── */}
            <div className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col">
                {panelHeader}
                {panelBody}
            </div>
        </>
    );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onClose, onConfirm, isLoading }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4"
            onClick={onClose}
        >
            {/* Stop clicks inside the card from closing the modal */}
            <div
                className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-5">{message}</p>
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={onClose}
                        className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm border border-gray-200 rounded-lg text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-sm text-white rounded-lg font-semibold cursor-pointer transition disabled:opacity-50 ${confirmClass}`}
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

    const { data, isLoading } = useQuery({
        queryKey: ["admin-members", page],
        queryFn:  () => getAllMembers(page),
        keepPreviousData: true,
    });

    const members    = data?.members    ?? [];
    const pagination = data?.pagination ?? {};

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
            <NavBar userType="admin" />

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-4 left-4 right-4 sm:bottom-auto sm:top-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
                    toast.type === "error"
                        ? "bg-red-50 border border-red-200 text-red-700"
                        : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                    {toast.msg}
                </div>
            )}

            <div className="flex lg:h-[calc(100vh-53px)]">

                {/* ── Table / card area ── */}
                <div className="flex-1 overflow-auto p-4 sm:p-5 pb-24 sm:pb-8 lg:pb-5">
                    <div className="flex flex-col gap-4 max-w-5xl">

                        {/* Page header */}
                        <div className="flex items-center justify-between min-w-0">
                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold text-gray-900">Members</h1>
                                <p className="text-sm text-gray-400 mt-0.5 truncate">
                                    {pagination.total ? `${pagination.total} registered members` : "Manage library members"}
                                </p>
                            </div>
                        </div>

                        {/* ── Desktop table (lg+) ── */}
                        <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden">
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
                                            const avatar     = getAvatar(member.username || "");
                                            const isSelected = selectedId === member._id;
                                            return (
                                                <tr
                                                    key={member._id}
                                                    onClick={() => setSelectedId(isSelected ? null : member._id)}
                                                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition ${
                                                        isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                                                    }`}
                                                >
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
                                                    <td className="py-3 px-3 text-gray-500 max-w-40">
                                                        <span className="truncate block">{member.email}</span>
                                                    </td>
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
                                                    <td className="py-3 px-3">
                                                        <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                                            {member.role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-400 text-xs">
                                                        {new Date(member.createdAt).toLocaleDateString("en-IN", {
                                                            day: "numeric", month: "short", year: "numeric"
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setConfirmModal({
                                                                    type:   member.isActive ? "block" : "unblock",
                                                                    userId: member._id,
                                                                    name:   member.username,
                                                                    active: member.isActive,
                                                                })}
                                                                className={`text-[11px] px-2.5 py-1 border rounded-md transition cursor-pointer ${
                                                                    member.isActive
                                                                        ? "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"
                                                                        : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
                                                                }`}
                                                            >
                                                                {member.isActive ? "Block" : "Unblock"}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmModal({ type: "clearFine", userId: member._id, name: member.username })}
                                                                className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition"
                                                            >
                                                                Clear fine
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmModal({ type: "delete", userId: member._id, name: member.username })}
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

                        {/* ── Tablet & Mobile card list ── */}
                        <div className="lg:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
                            {isLoading
                                ? Array(7).fill(0).map((_, i) => <SkeletonCard key={i} />)
                                : members.length === 0
                                ? (
                                    <div className="py-16 text-center text-sm text-gray-400">
                                        No members registered yet
                                    </div>
                                )
                                : members.map((member) => (
                                    <MemberCard
                                        key={member._id}
                                        member={member}
                                        isSelected={selectedId === member._id}
                                        onSelect={(id) => setSelectedId(selectedId === id ? null : id)}
                                        onAction={setConfirmModal}
                                    />
                                ))
                            }

                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">
                                        {pagination.page} / {pagination.totalPages} · {pagination.total} members
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
                </div>

                {/* ── Desktop side panel (lg): inline in flex row ── */}
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