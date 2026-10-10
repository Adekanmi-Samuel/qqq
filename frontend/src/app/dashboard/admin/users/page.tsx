"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Phone, Mail,
  Shield, Ban, CheckCircle, MoreHorizontal, Eye,
  Key, Trash2, UserCog, AlertTriangle, Filter,
} from "lucide-react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type UserRole = "SCHOOL_ADMIN" | "PRINCIPAL" | "TEACHER" | "BURSAR" | "PARENT" | "STUDENT";
type UserStatus = "active" | "inactive" | "suspended";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastActiveAt: string | null;
  school: string;
  verified: boolean;
  avatarUrl?: string | null;
}

/* ================================================================== */
/*  Mock Data                                                          */
/* ================================================================== */

const MOCK_USERS: UserRecord[] = [
  { id: "1", fullName: "Adewale Johnson", email: "adewale@lagosprep.ng", phone: "+234 801 234 5678", role: "SCHOOL_ADMIN", status: "active", createdAt: "2026-01-15", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "2", fullName: "Fatima Abubakar", email: "fatima@lagosprep.ng", phone: "+234 802 345 6789", role: "TEACHER", status: "active", createdAt: "2026-02-10", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "3", fullName: "Chukwuemeka Okafor", email: "emeka@lagosprep.ng", phone: "+234 803 456 7890", role: "TEACHER", status: "active", createdAt: "2026-03-01", lastActiveAt: "2026-08-24", school: "Lagos Preparatory School", verified: true },
  { id: "4", fullName: "Amina Bello", email: "amina.bello@gmail.com", phone: "+234 804 567 8901", role: "PARENT", status: "active", createdAt: "2026-03-15", lastActiveAt: "2026-08-20", school: "Lagos Preparatory School", verified: true },
  { id: "5", fullName: "Olumide Adeyemi", email: "olumide@lagosprep.ng", phone: "+234 805 678 9012", role: "BURSAR", status: "active", createdAt: "2026-04-01", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "6", fullName: "Chioma Nwosu", email: "chioma.n@yahoo.com", phone: "+234 806 789 0123", role: "PARENT", status: "inactive", createdAt: "2026-04-10", lastActiveAt: null, school: "Lagos Preparatory School", verified: false },
  { id: "7", fullName: "Ibrahim Musa", email: "ibrahim@lagosprep.ng", phone: "+234 807 890 1234", role: "TEACHER", status: "suspended", createdAt: "2026-05-01", lastActiveAt: "2026-07-15", school: "Lagos Preparatory School", verified: true },
  { id: "8", fullName: "Blessing Eze", email: "blessing.eze@lagosprep.ng", phone: "+234 808 901 2345", role: "STUDENT", status: "active", createdAt: "2026-06-01", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "9", fullName: "Tunde Bakare", email: "tunde@lagosprep.ng", phone: "+234 809 012 3456", role: "PRINCIPAL", status: "active", createdAt: "2026-01-10", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "10", fullName: "Sade Ogunlesi", email: "sade.o@gmail.com", phone: "+234 810 123 4567", role: "PARENT", status: "active", createdAt: "2026-06-15", lastActiveAt: "2026-08-22", school: "Lagos Preparatory School", verified: true },
  { id: "11", fullName: "Yusuf Abdullahi", email: "yusuf@lagosprep.ng", phone: "+234 811 234 5678", role: "STUDENT", status: "active", createdAt: "2026-07-01", lastActiveAt: "2026-08-25", school: "Lagos Preparatory School", verified: true },
  { id: "12", fullName: "Ngozi Okonkwo", email: "ngozi@lagosprep.ng", phone: "+234 812 345 6789", role: "TEACHER", status: "active", createdAt: "2026-07-10", lastActiveAt: "2026-08-24", school: "Lagos Preparatory School", verified: true },
];

const ROLES: UserRole[] = ["SCHOOL_ADMIN", "PRINCIPAL", "TEACHER", "BURSAR", "PARENT", "STUDENT"];
const STATUSES: UserStatus[] = ["active", "inactive", "suspended"];

const ROLE_LABELS: Record<UserRole, string> = {
  SCHOOL_ADMIN: "School Admin",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  BURSAR: "Bursar",
  PARENT: "Parent",
  STUDENT: "Student",
};

const ROLE_COLORS: Record<UserRole, string> = {
  SCHOOL_ADMIN: "bg-sh-green-800 text-white",
  PRINCIPAL: "bg-sh-green-600 text-white",
  TEACHER: "bg-sh-green-200 text-sh-green-900",
  BURSAR: "bg-sh-amber-400 text-sh-amber-700",
  PARENT: "bg-sh-blue-600 text-white",
  STUDENT: "bg-sh-ink-200 text-sh-ink-900",
};

const STATUS_STYLES: Record<UserStatus, { bg: string; text: string; dot: string }> = {
  active:   { bg: "bg-emerald-500/10", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  suspended:{ bg: "bg-red-500/10", text: "text-red-700", dot: "bg-red-500" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(date: string | null) {
  if (!date) return "Never";
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return `${Math.floor(diff / 30)} months ago`;
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ type: string; user: UserRecord } | null>(null);
  const PER_PAGE = 10;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    roles: ROLES.map((r) => ({ role: r, count: users.filter((u) => u.role === r).length })),
  }), [users]);

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus } : u));
    setSelectedUser((prev) => prev?.id === userId ? { ...prev, status: newStatus } : prev);
    setShowConfirmModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--heading-color)" }}>User Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage all users across your school</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="btn-primary inline-flex items-center gap-2">
          <UserCog size={16} /> Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-sh-green-700" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Suspended", value: stats.suspended, icon: Ban, color: "text-red-600" },
          { label: "Roles", value: stats.roles.length, icon: Shield, color: "text-sh-amber-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-sh-green-50 ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold sh-numeral" style={{ color: "var(--heading-color)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="sh-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as any); setPage(1); }} className="input-field w-full sm:w-40">
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }} className="input-field w-full sm:w-36">
            <option value="all">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="sh-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Joined</th>
                <th className="hidden lg:table-cell">Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr key={user.id} className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sh-green-100 flex items-center justify-center text-sh-green-800 text-xs font-bold shrink-0">
                        {getInitials(user.fullName)}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{user.fullName}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-xs ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLES[user.status].text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[user.status].dot}`} />
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell text-sm" style={{ color: "var(--text-muted)" }}>
                    {new Date(user.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="hidden lg:table-cell text-sm" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(user.lastActiveAt)}
                  </td>
                  <td>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }} className="p-1.5 rounded-lg hover:bg-sh-green-50 transition-colors">
                      <Eye size={16} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No users found</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.7 }}>Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-sh-green-800 text-white" : "hover:bg-sh-green-50"}`} style={p !== page ? { color: "var(--text-muted)" } : {}}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-1.5 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Slide-out */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedUser(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto" style={{ backgroundColor: "var(--card-bg)" }}>
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>User Details</h2>
                  <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-sh-green-50 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-sh-green-100 flex items-center justify-center text-sh-green-800 text-lg font-bold">
                    {getInitials(selectedUser.fullName)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold" style={{ color: "var(--heading-color)" }}>{selectedUser.fullName}</p>
                    <span className={`badge text-xs ${ROLE_COLORS[selectedUser.role]}`}>{ROLE_LABELS[selectedUser.role]}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: "Email", value: selectedUser.email },
                    { icon: Phone, label: "Phone", value: selectedUser.phone || "Not provided" },
                    { icon: Shield, label: "School", value: selectedUser.school },
                    { icon: CheckCircle, label: "Status", value: selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--surface-2, var(--bg))" }}>
                      <item.icon size={16} style={{ color: "var(--text-muted)" }} />
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Account Actions</p>
                  {selectedUser.status === "active" && (
                    <button onClick={() => setShowConfirmModal({ type: "suspend", user: selectedUser })} className="btn w-full justify-start gap-2 bg-sh-amber-100 text-sh-amber-700 hover:bg-sh-amber-300/30 border-none">
                      <Ban size={16} /> Suspend User
                    </button>
                  )}
                  {selectedUser.status === "suspended" && (
                    <button onClick={() => handleStatusChange(selectedUser.id, "active")} className="btn w-full justify-start gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">
                      <CheckCircle size={16} /> Reactivate User
                    </button>
                  )}
                  <button className="btn w-full justify-start gap-2 btn-secondary">
                    <Key size={16} /> Reset Password
                  </button>
                  <button onClick={() => setShowConfirmModal({ type: "delete", user: selectedUser })} className="btn w-full justify-start gap-2 bg-red-50 text-red-600 hover:bg-red-100 border-none">
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Modals */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowConfirmModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showConfirmModal.type === "delete" ? "bg-red-100" : "bg-sh-amber-100"}`}>
                  <AlertTriangle size={20} className={showConfirmModal.type === "delete" ? "text-red-600" : "text-sh-amber-600"} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "var(--heading-color)" }}>
                    {showConfirmModal.type === "suspend" ? "Suspend User?" : "Delete User?"}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {showConfirmModal.type === "suspend"
                      ? "This user won't be able to log in until reactivated."
                      : "This action cannot be undone. All data will be permanently deleted."}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setShowConfirmModal(null)} className="btn btn-ghost">Cancel</button>
                <button
                  onClick={() => {
                    if (showConfirmModal.type === "suspend") {
                      handleStatusChange(showConfirmModal.user.id, "suspended");
                    } else {
                      setUsers((prev) => prev.filter((u) => u.id !== showConfirmModal.user.id));
                      setSelectedUser(null);
                    }
                    setShowConfirmModal(null);
                  }}
                  className={`btn ${showConfirmModal.type === "delete" ? "btn-danger" : "bg-sh-amber-500 text-white hover:bg-sh-amber-600 border-none"}`}
                >
                  {showConfirmModal.type === "suspend" ? "Suspend" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: "var(--heading-color)" }}>Invite User</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg hover:bg-sh-green-50 transition-colors"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="sh-label">Email Address</label>
                  <input type="email" placeholder="user@example.com" className="input-field" />
                </div>
                <div>
                  <label className="sh-label">Role</label>
                  <select className="input-field">
                    <option value="">Select role</option>
                    {ROLES.filter((r) => r !== "SCHOOL_ADMIN").map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowInviteModal(false)} className="btn btn-ghost">Cancel</button>
                  <button onClick={() => setShowInviteModal(false)} className="btn btn-primary">Send Invite</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
