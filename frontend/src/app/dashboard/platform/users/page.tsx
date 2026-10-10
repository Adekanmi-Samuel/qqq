"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  Users, Search, Loader2, Plus, KeyRound, UserCog, UserX, UserCheck, X, ShieldCheck, Pencil, Trash2,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { csrfHeaders, extractApiErrorMessage } from "@/lib/utils";

interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  schoolId: string | null;
  passwordResetRequired: boolean;
  createdAt: string;
  school?: { id: string; name: string } | null;
}

interface SchoolOption {
  id: string;
  name: string;
}

export default function PlatformUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState<PlatformUser | null>(null);
  const [showImpersonate, setShowImpersonate] = useState<PlatformUser | null>(null);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "success">("success");
  const [editing, setEditing] = useState<PlatformUser | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "TEACHER",
    schoolId: "",
  });
  const [passwordValue, setPasswordValue] = useState("");
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "TEACHER",
    schoolId: "",
    active: true,
    passwordResetRequired: false,
  });

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    loadSchools();
  }, [user]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") fetchUsers();
  }, [user, page, roleFilter, schoolFilter]);

  const loadSchools = async () => {
    try {
      const res = await fetch(`${API_URL}/api/platform/schools?limit=100`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setSchools((data.data || []).map((s: any) => ({ id: s.id, name: s.name })));
    } catch {
      // school list is optional for user table
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (schoolFilter) params.set("schoolId", schoolFilter);

      const res = await fetch(`${API_URL}/api/platform/users?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      } else {
        setError(data.error || "Failed to load users");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId("create");
    setMessage("");
    setMessageKind("error");
    try {
      const res = await fetch(`${API_URL}/api/platform/users`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessageKind("success");
        setMessage(`User ${data.data.email} created.`);
        setShowCreate(false);
        setCreateForm({ fullName: "", email: "", password: "", role: "TEACHER", schoolId: "" });
        fetchUsers();
      } else {
        setMessageKind("error");
        setMessage(extractApiErrorMessage(data.error, "Failed to create user"));
      }
    } catch {
      setMessageKind("error");
      setMessage("Failed to create user");
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (u: PlatformUser) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      schoolId: u.schoolId || "",
      active: u.active,
      passwordResetRequired: u.passwordResetRequired,
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setBusyId(editingUser.id);
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        fullName: editForm.fullName,
        email: editForm.email,
        role: editForm.role,
        active: editForm.active,
        passwordResetRequired: editForm.passwordResetRequired,
      };
      if (editForm.schoolId) body.schoolId = editForm.schoolId;
      const res = await fetch(`${API_URL}/api/platform/users/${editingUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setMessageKind("success");
        setMessage("User updated.");
        setEditingUser(null);
        fetchUsers();
      } else {
        setMessageKind("error");
        setMessage(extractApiErrorMessage(data.error, "Failed to update user"));
      }
    } catch {
      setMessageKind("error");
      setMessage("Failed to update user");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (u: PlatformUser) => {
    if (!window.confirm(`Deactivate ${u.email} and revoke their sessions?`)) return;
    setBusyId(u.id);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/platform/users/${u.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: csrfHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMessageKind("success");
        setMessage(data.message || "User deactivated.");
        fetchUsers();
      } else {
        setMessageKind("error");
        setMessage(extractApiErrorMessage(data.error, "Failed to deactivate user"));
      }
    } catch {
      setMessageKind("error");
      setMessage("Failed to deactivate user");
    } finally {
      setBusyId(null);
    }
  };

  const setPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPassword) return;
    setBusyId(showPassword.id);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/platform/users/${showPassword.id}/password`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify({ password: passwordValue }),
      });
      const data = await res.json();
      setMessage(data.success ? "Password updated." : extractApiErrorMessage(data.error, "Failed to set password"));
      if (data.success) setShowPassword(null);
    } catch {
      setMessage("Failed to set password");
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (u: PlatformUser) => {
    setBusyId(u.id);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/platform/users/${u.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify({ active: !u.active }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else {
        setMessageKind("error");
        setMessage(extractApiErrorMessage(data.error, "Failed to update user"));
      }
    } catch {
      setMessageKind("error");
      setMessage("Failed to update user");
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (u: PlatformUser) => {
    setBusyId(u.id);
    try {
      const res = await fetch(`${API_URL}/api/platform/impersonate`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = u.role === "SUPER_ADMIN" ? "/dashboard/platform" : "/dashboard";
      } else {
        setMessage(extractApiErrorMessage(data.error, "Impersonation failed"));
      }
    } catch {
      setMessage("Impersonation failed");
    } finally {
      setBusyId(null);
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-100 text-purple-700",
      SCHOOL_ADMIN: "bg-amber-100 text-amber-700",
      PRINCIPAL: "bg-blue-100 text-blue-700",
      TEACHER: "bg-emerald-100 text-emerald-700",
      BURSAR: "bg-cyan-100 text-cyan-700",
      STUDENT: "bg-gray-100 text-gray-700",
      PARENT: "bg-rose-100 text-rose-700",
    };
    return styles[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" /> Platform Users
          </h1>
          <p className="text-gray-500 mt-1">{total} users across all schools</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {message && (
        <div
          role={messageKind === "error" ? "alert" : "status"}
          className={`text-sm p-3 rounded-lg border ${
            messageKind === "error"
              ? "bg-red-50 text-red-700 border-red-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or email"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All roles</option>
            {["SUPER_ADMIN","SCHOOL_ADMIN","PRINCIPAL","TEACHER","BURSAR","STUDENT","PARENT"].map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={schoolFilter}
            onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }}
          >
            <option value="">All schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleBadge(u.role)}`}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.school?.name || "Platform"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => impersonate(u)}
                          disabled={busyId === u.id}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                          title="Sign in as this user"
                        >
                          {busyId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          disabled={busyId === u.id}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setShowPassword(u); setPasswordValue(""); }}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                          title="Set password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                          title={u.active ? "Deactivate" : "Activate"}
                        >
                          {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={busyId === u.id || u.role === "SUPER_ADMIN"}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                          title={u.role === "SUPER_ADMIN" ? "Cannot deactivate super admin" : "Deactivate and revoke sessions"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create platform user</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createUser} className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Full name"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                required
                autoComplete="name"
              />
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
                autoComplete="username"
              />
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              >
                {["TEACHER","SCHOOL_ADMIN","PRINCIPAL","BURSAR","STUDENT","PARENT"].map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                value={createForm.schoolId}
                onChange={(e) => setCreateForm({ ...createForm, schoolId: e.target.value })}
                required
              >
                <option value="">Select school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busyId === "create"}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm inline-flex items-center justify-center gap-2"
              >
                {busyId === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
                Create user
              </button>
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters with uppercase, lowercase and a number.
              </p>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit user</h2>
              <button onClick={() => setEditingUser(null)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Full name"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                required
                autoComplete="name"
              />
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
                autoComplete="username"
              />
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                {["TEACHER","SCHOOL_ADMIN","PRINCIPAL","BURSAR","STUDENT","PARENT","SUPER_ADMIN"].map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                value={editForm.schoolId}
                onChange={(e) => setEditForm({ ...editForm, schoolId: e.target.value })}
              >
                <option value="">Platform</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editForm.passwordResetRequired}
                  onChange={(e) => setEditForm({ ...editForm, passwordResetRequired: e.target.checked })}
                />
                Require password reset on next login
              </label>
              <button
                type="submit"
                disabled={busyId === editingUser.id}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm inline-flex items-center justify-center gap-2"
              >
                {busyId === editingUser.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Save user
              </button>
            </form>
          </div>
        </div>
      )}

      {showPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Set password for {showPassword.email}</h2>
              <button onClick={() => setShowPassword(null)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={setPassword} className="space-y-3">
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="New password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={busyId === showPassword.id}
                className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm"
              >
                {busyId === showPassword.id ? "Saving..." : "Save password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showImpersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Sign in as {showImpersonate.fullName}?</h2>
            <p className="text-sm text-gray-500">This switches your session to that account so you can edit anything they can.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowImpersonate(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
              <button onClick={() => impersonate(showImpersonate)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                Switch account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
