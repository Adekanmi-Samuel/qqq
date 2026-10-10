"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import {
  Search, Building2, Shield, ShieldOff, CheckCircle, XCircle,
  Loader2, X, Plus, Pencil, BookMarked, UserCog, Download,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { csrfHeaders, extractApiErrorMessage } from "@/lib/utils";

interface School {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  state: string;
  lga: string;
  address?: string;
  motto?: string | null;
  status: string;
  planType: string;
  verified: boolean;
  verifiedAt: string | null;
  createdAt: string;
  _count: { students: number; users: number };
  users?: Array<{ id: string; fullName: string; email: string; active: boolean }>;
}

export default function SchoolDirectoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [bootstrapping, setBootstrapping] = useState<School | null>(null);
  const [bootstrapTeacherName, setBootstrapTeacherName] = useState("");
  const [bootstrapTeacherEmail, setBootstrapTeacherEmail] = useState("");
  const [bootstrapTeacherPassword, setBootstrapTeacherPassword] = useState("");
  const [bootstrapClasses, setBootstrapClasses] = useState("");
  const [bootstrapSession, setBootstrapSession] = useState("2025/2026");
  const [bootstrapTerm, setBootstrapTerm] = useState("1");
  const [bootstrapWeeks, setBootstrapWeeks] = useState("12");
  const [toolSchool, setToolSchool] = useState<School | null>(null);
  const [toolMode, setToolMode] = useState<"fill" | "import">("fill");
  const [toolOverwrite, setToolOverwrite] = useState(false);
  const [toolPayload, setToolPayload] = useState(
    JSON.stringify({
      subjects: ["English Studies", "Mathematics"],
      classes: [{ name: "JSS 1", arms: ["A"] }],
      schemes: [],
      timetables: [],
    }, null, 2)
  );
  const [toolResult, setToolResult] = useState("");

  const [createForm, setCreateForm] = useState({
    schoolName: "",
    adminFullName: "",
    email: "",
    password: "",
    phone: "",
    schoolType: "SECONDARY",
    ownershipType: "PRIVATE",
    state: "Lagos",
    lga: "Ikeja",
    address: "",
    motto: "",
    status: "PENDING_VERIFICATION",
    verified: false,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    lga: "",
    address: "",
    motto: "",
    status: "",
    planType: "",
    verified: false,
  });

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    fetchSchools();
  }, [user, page, statusFilter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${API_URL}/api/platform/schools?${params}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setSchools(data.data);
        setTotalPages(data.meta.totalPages);
        setTotal(data.meta.total);
      } else {
        setError(data.error || "Failed to load schools");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  const patchSchool = async (id: string, body: Record<string, unknown>, okMessage?: string) => {
    try {
      setActionLoading(id);
      const res = await fetch(`${API_URL}/api/platform/schools/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (okMessage) setMessage(okMessage);
        fetchSchools();
      } else {
        setMessage(extractApiErrorMessage(data.error, "Failed to update school"));
      }
    } catch {
      setMessage("Failed to update school");
    } finally {
      setActionLoading(null);
    }
  };

  const updateSchoolStatus = (id: string, status: string) =>
    patchSchool(id, { status }, status === "ACTIVE" ? "School activated." : "School suspended.");

  const toggleVerification = (id: string, currentVerified: boolean) =>
    patchSchool(id, { verified: !currentVerified }, "Verification updated.");

  const openEdit = (school: School) => {
    setEditing(school);
    setEditForm({
      name: school.name,
      email: school.email,
      phone: school.phone,
      state: school.state,
      lga: school.lga,
      address: school.address || "",
      motto: school.motto || "",
      status: school.status,
      planType: school.planType,
      verified: school.verified,
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await patchSchool(editing.id, {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone,
      state: editForm.state,
      lga: editForm.lga,
      address: editForm.address,
      motto: editForm.motto,
      status: editForm.status,
      planType: editForm.planType,
      verified: editForm.verified,
    }, "School details saved.");
    setEditing(null);
  };

  const createSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("create");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/api/platform/schools`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `School created. Admin login: ${createForm.email}. Status: PENDING_VERIFICATION until a superadmin verifies it.`
        );
        setShowCreate(false);
        setCreateForm({
          schoolName: "", adminFullName: "", email: "", password: "", phone: "",
          schoolType: "SECONDARY", ownershipType: "PRIVATE", state: "Lagos", lga: "Ikeja", address: "", motto: "",
          status: "PENDING_VERIFICATION", verified: false,
        });
        fetchSchools();
      } else {
        setMessage(extractApiErrorMessage(data.error, "Failed to create school"));
      }
    } catch {
      setMessage("Failed to create school");
    } finally {
      setActionLoading(null);
    }
  };

  const openBootstrap = (school: School) => {
    setBootstrapping(school);
    setBootstrapTeacherName("");
    setBootstrapTeacherEmail("");
    setBootstrapTeacherPassword("");
    const t = (school as any).schoolType || "SECONDARY";
    if (t === "NURSERY") setBootstrapClasses("Nursery 1, Nursery 2, Nursery 3");
    else if (t === "PRIMARY") setBootstrapClasses("Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6");
    else if (t === "COMBINED") setBootstrapClasses("Nursery 1, Primary 1, JSS 1, SS 1");
    else setBootstrapClasses("JSS 1, JSS 2, JSS 3, SS 1, SS 2, SS 3");
    setBootstrapSession("2025/2026");
    setBootstrapTerm("1");
    setBootstrapWeeks("12");
  };

  const openSchoolTools = (school: School) => {
    setToolSchool(school);
    setToolMode("fill");
    setToolOverwrite(false);
    setToolPayload(
      JSON.stringify({
        subjects: ["English Studies", "Mathematics"],
        classes: [{ name: "JSS 1", arms: ["A"] }],
        schemes: [],
        timetables: [],
      }, null, 2)
    );
    setToolResult("");
  };

  const bootstrapCurriculum = async (
    school: School,
    teacherEmail?: string,
    teacherPassword?: string,
    teacherName?: string
  ) => {
    setActionLoading(school.id + ":boot");
    setMessage("");
    try {
      if (teacherEmail && teacherPassword && teacherPassword.length < 8) {
        setMessage("Teacher password must be at least 8 characters.");
        return;
      }
      const classList = bootstrapClasses
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const termNum = Number(bootstrapTerm);
      const weeksNum = Number(bootstrapWeeks);
      const body: Record<string, unknown> = {
        classes: classList.length ? classList : ["JSS 1", "JSS 2", "JSS 3"],
        session: bootstrapSession || "2025/2026",
        term: Number.isFinite(termNum) && termNum >= 1 && termNum <= 3 ? termNum : 1,
        weeks: Number.isFinite(weeksNum) && weeksNum >= 1 && weeksNum <= 20 ? weeksNum : 12,
      };
      if (teacherEmail && teacherPassword) {
        body.teacher = {
          fullName: teacherName || "Teacher",
          email: teacherEmail,
          password: teacherPassword,
        };
      }
      const res = await fetch(`${API_URL}/api/platform/schools/${school.id}/bootstrap-curriculum`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        const slots = d.timetableSlotsCreated != null ? `, ${d.timetableSlotsCreated} timetable slots` : "";
        setMessage(
          `Curriculum ready for ${d.school?.name || school.name}: ${d.subjects?.length || 0} subjects, ${d.classes?.length || 0} classes, ${d.schemesCreated || 0} schemes, ${d.notesCreated || 0} lesson notes${slots}.`
        );
      } else {
        setMessage(extractApiErrorMessage(data.error, "Failed to bootstrap curriculum"));
      }
    } catch {
      setMessage("Failed to bootstrap curriculum");
    } finally {
      setActionLoading(null);
      setBootstrapping(null);
    }
  };

  const runSchoolTool = async (school: School) => {
    setActionLoading(school.id + ":tool");
    setToolResult("");
    try {
      const path =
        toolMode === "fill"
          ? `/api/platform/schools/${school.id}/fill-lesson-notes`
          : `/api/platform/schools/${school.id}/import-curriculum`;
      const body: Record<string, unknown> = {};
      if (toolMode === "fill") {
        body.overwrite = toolOverwrite;
      } else if (toolPayload.trim()) {
        try {
          Object.assign(body, JSON.parse(toolPayload));
        } catch {
          setToolResult("Import payload must be valid JSON.");
          return;
        }
      }
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setToolResult(
          `${toolMode === "fill" ? "Lesson notes filled" : "Import complete"}: ${JSON.stringify(data.data)}`
        );
      } else {
        setToolResult(extractApiErrorMessage(data.error, "School tool failed"));
      }
    } catch {
      setToolResult("School tool failed");
    } finally {
      setActionLoading(null);
    }
  };

  const impersonateAdmin = async (school: School) => {
    const admin = school.users?.find((u) => u.email === school.email) || school.users?.[0];
    if (!admin) {
      setMessage("No admin user found for this school.");
      return;
    }
    setActionLoading(school.id + ":imp");
    try {
      const res = await fetch(`${API_URL}/api/platform/impersonate`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify({ userId: admin.id }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard/admin";
      } else {
        setMessage(extractApiErrorMessage(data.error, "Failed to sign in as school admin"));
      }
    } catch {
      setMessage("Failed to sign in as school admin");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSchools();
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-50 text-emerald-700",
      SUSPENDED: "bg-red-50 text-red-700",
      PENDING_VERIFICATION: "bg-yellow-50 text-yellow-700",
      TRIAL: "bg-blue-50 text-blue-700",
    };
    return styles[status] || "bg-gray-50 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Directory</h1>
          <p className="text-gray-500 mt-1">{total} schools registered on the platform</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Create School
        </button>
      </div>

      {message && (
        <div className="text-sm p-3 rounded-lg bg-blue-50 text-blue-700">{message}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools by name, email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_VERIFICATION">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="TRIAL">Trial</option>
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
        ) : schools.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No schools found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">School</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stats</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{school.name}</p>
                          <p className="text-xs text-gray-400">{school.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600">{school.state}</p>
                      <p className="text-xs text-gray-400">{school.lga}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        school.planType === "FREE" ? "bg-gray-100 text-gray-600" :
                        school.planType === "PREMIUM" ? "bg-amber-50 text-amber-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>
                        {school.planType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge(school.status)}`}>
                          {school.status.replace("_", " ")}
                        </span>
                        {school.verified ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" aria-label="Verified" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-gray-300" aria-label="Not verified" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">{school._count.students} students</div>
                      <div className="text-xs text-gray-400">{school._count.users} staff</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <button
                          onClick={() => openEdit(school)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                          title="Edit school details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openBootstrap(school)}
                          disabled={actionLoading === school.id + ":boot"}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600"
                          title="Bootstrap curriculum and lesson notes"
                        >
                          {actionLoading === school.id + ":boot" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BookMarked className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openSchoolTools(school)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600"
                          title="Import curriculum or fill lesson notes"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setToolSchool(school);
                            setToolMode("fill");
                            setToolOverwrite(false);
                            setToolPayload("");
                            setToolResult("");
                          }}
                          disabled={actionLoading === school.id + ":tool"}
                          className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600"
                          title="Fill missing lesson notes or import curriculum"
                        >
                          {actionLoading === school.id + ":tool" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BookMarked className="w-4 h-4 rotate-90" />
                          )}
                        </button>
                        <button
                          onClick={() => impersonateAdmin(school)}
                          disabled={actionLoading === school.id + ":imp"}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                          title="Open school as admin"
                        >
                          {actionLoading === school.id + ":imp" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserCog className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleVerification(school.id, school.verified)}
                          disabled={actionLoading === school.id}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-amber-600"
                          title={school.verified ? "Unverify" : "Verify school"}
                        >
                          {actionLoading === school.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : school.verified ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <ShieldOff className="w-4 h-4" />
                          )}
                        </button>
                        {school.status !== "SUSPENDED" ? (
                          <button
                            onClick={() => updateSchoolStatus(school.id, "SUSPENDED")}
                            disabled={actionLoading === school.id}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Suspend school"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateSchoolStatus(school.id, "ACTIVE")}
                            disabled={actionLoading === school.id}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-500"
                            title="Activate school"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create school</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createSchool} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="School name" value={createForm.schoolName} onChange={(e) => setCreateForm({ ...createForm, schoolName: e.target.value })} required />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Admin full name" value={createForm.adminFullName} onChange={(e) => setCreateForm({ ...createForm, adminFullName: e.target.value })} required autoComplete="name" />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} required autoComplete="tel" />
              <input type="email" className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Admin email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required autoComplete="username" />
              <input type="password" className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Admin password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required minLength={8} autoComplete="new-password" />
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={createForm.schoolType} onChange={(e) => setCreateForm({ ...createForm, schoolType: e.target.value })}>
                {["NURSERY","PRIMARY","SECONDARY","COMBINED"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={createForm.ownershipType} onChange={(e) => setCreateForm({ ...createForm, ownershipType: e.target.value })}>
                {["PRIVATE","GOVERNMENT"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                {["PENDING_VERIFICATION","ACTIVE","SUSPENDED","TRIAL"].map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700 px-1">
                <input type="checkbox" checked={createForm.verified} onChange={(e) => setCreateForm({ ...createForm, verified: e.target.checked })} />
                Verified
              </label>
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="State" value={createForm.state} onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })} required />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="LGA" value={createForm.lga} onChange={(e) => setCreateForm({ ...createForm, lga: e.target.value })} required />
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Address" value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} required />
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Motto (optional)" value={createForm.motto} onChange={(e) => setCreateForm({ ...createForm, motto: e.target.value })} />
              <button type="submit" disabled={actionLoading === "create"} className="sm:col-span-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm inline-flex items-center justify-center gap-2">
                {actionLoading === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create school and admin
              </button>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit {editing.name}</h2>
              <button onClick={() => setEditing(null)} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} />
              <input className="px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.lga} onChange={(e) => setEditForm({ ...editForm, lga: e.target.value })} />
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              <input className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" value={editForm.motto} onChange={(e) => setEditForm({ ...editForm, motto: e.target.value })} placeholder="Motto" />
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {["PENDING_VERIFICATION","ACTIVE","SUSPENDED","TRIAL"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" value={editForm.planType} onChange={(e) => setEditForm({ ...editForm, planType: e.target.value })}>
                {["FREE","PREMIUM","ENTERPRISE"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={editForm.verified} onChange={(e) => setEditForm({ ...editForm, verified: e.target.checked })} />
                Verified school
              </label>
              <button type="submit" className="sm:col-span-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm">
                Save changes
              </button>
            </form>
          </div>
        </div>
      )}

      {bootstrapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Bootstrap curriculum</h2>
            <p className="text-sm text-gray-600">
              Creates the selected classes, standard subjects, optional teacher account, schemes of work, lesson notes and a default timetable grid.
            </p>
            <div className="space-y-2">
              <label className="text-xs text-gray-500">Classes (comma separated)</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="JSS 1, JSS 2, JSS 3"
                value={bootstrapClasses}
                onChange={(e) => setBootstrapClasses(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Session</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="2025/2026"
                    value={bootstrapSession}
                    onChange={(e) => setBootstrapSession(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Term</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    value={bootstrapTerm}
                    onChange={(e) => setBootstrapTerm(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Weeks</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    value={bootstrapWeeks}
                    onChange={(e) => setBootstrapWeeks(e.target.value)}
                  />
                </div>
              </div>
              <label className="text-xs text-gray-500">Teacher full name (optional)</label>
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Teacher full name (optional)"
                value={bootstrapTeacherName}
                onChange={(e) => setBootstrapTeacherName(e.target.value)}
              />
              <label className="text-xs text-gray-500">Teacher email (optional)</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Teacher email (optional)"
                value={bootstrapTeacherEmail}
                onChange={(e) => setBootstrapTeacherEmail(e.target.value)}
              />
              <label className="text-xs text-gray-500">Teacher password (optional)</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Teacher password (optional, min 8)"
                value={bootstrapTeacherPassword}
                onChange={(e) => setBootstrapTeacherPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => bootstrapCurriculum(
                  bootstrapping,
                  bootstrapTeacherEmail.trim() || undefined,
                  bootstrapTeacherPassword || undefined,
                  bootstrapTeacherName.trim() || undefined
                )}
                disabled={actionLoading === bootstrapping.id + ":boot"}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm"
              >
                {actionLoading === bootstrapping.id + ":boot"
                  ? "Working..."
                  : bootstrapTeacherEmail.trim()
                    ? "Bootstrap with teacher account"
                    : "Bootstrap without teacher"}
              </button>
              <button
                onClick={() => bootstrapCurriculum(bootstrapping)}
                disabled={actionLoading === bootstrapping.id + ":boot"}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
              >
                {actionLoading === bootstrapping.id + ":boot" ? "Working..." : "Without teacher account"}
              </button>
              <button onClick={() => setBootstrapping(null)} className="px-4 py-2 text-sm text-gray-500">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toolSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">School curriculum tools</h2>
            <p className="text-sm text-gray-600">{toolSchool.name}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setToolMode("fill")}
                className={`px-3 py-2 rounded-lg text-sm ${toolMode === "fill" ? "bg-gray-900 text-white" : "border border-gray-200"}`}
              >
                Fill lesson notes
              </button>
              <button
                onClick={() => setToolMode("import")}
                className={`px-3 py-2 rounded-lg text-sm ${toolMode === "import" ? "bg-gray-900 text-white" : "border border-gray-200"}`}
              >
                Import curriculum
              </button>
            </div>
            {toolMode === "fill" ? (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={toolOverwrite}
                  onChange={(e) => setToolOverwrite(e.target.checked)}
                />
                Overwrite existing teacher notes (default off)
              </label>
            ) : (
              <textarea
                className="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder='Paste import JSON: { "subjects": [...], "classes": [...], "schemes": [...], "timetables": [...] }'
                value={toolPayload}
                onChange={(e) => setToolPayload(e.target.value)}
              />
            )}
            {toolResult && (
              <div className="text-sm p-3 rounded-lg bg-gray-50 text-gray-700 break-all max-h-40 overflow-auto">
                {toolResult}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => runSchoolTool(toolSchool)}
                disabled={actionLoading === toolSchool.id + ":tool"}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm"
              >
                {actionLoading === toolSchool.id + ":tool" ? "Working..." : "Run tool"}
              </button>
              <button onClick={() => setToolSchool(null)} className="px-4 py-2 text-sm text-gray-500">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
