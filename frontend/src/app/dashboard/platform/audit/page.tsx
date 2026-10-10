"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollText, Search, ChevronDown, ChevronUp,
  Download, Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  User, CreditCard, Settings, Activity, Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import { platformFetch, extractApiErrorMessage } from "@/lib/platformFetch";

type AuditAction = "auth" | "admin" | "payment" | "data" | "permission";
type AuditResult = "success" | "failure";

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  actionCategory: AuditAction;
  resource: string;
  resourceId: string;
  ipAddress: string;
  result: AuditResult;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  details?: string | null;
  errorMessage?: string | null;
}

function categorize(action: string, resource: string): AuditAction {
  const a = (action || "").toLowerCase();
  const r = (resource || "").toLowerCase();
  if (a.includes("login") || a.includes("auth") || a.includes("password") || a.includes("invite") || r.includes("session")) return "auth";
  if (a.includes("payment") || a.includes("refund") || r.includes("payment") || r.includes("fee")) return "payment";
  if (a.includes("role") || a.includes("permission") || a.includes("impersonate") || a.includes("settings")) return "admin";
  return "data";
}

const CATEGORY_CONFIG: Record<AuditAction, { label: string; icon: any; color: string }> = {
  auth:       { label: "Authentication", icon: Shield, color: "text-sh-blue-600" },
  admin:      { label: "Admin Action", icon: Settings, color: "text-sh-amber-600" },
  payment:    { label: "Payment", icon: CreditCard, color: "text-emerald-600" },
  data:       { label: "Data Change", icon: Activity, color: "text-sh-green-700" },
  permission: { label: "Permission", icon: User, color: "text-red-600" },
};

const PER_PAGE = 25;

export default function AuditLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<AuditResult | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
  }, [user, router]);

  const fetchAudit = useCallback(async () => {
    if (!user || user.role !== "SUPER_ADMIN") return;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (resultFilter !== "all") params.set("result", resultFilter);
      if (search.trim()) params.set("action", search.trim());

      const res = await platformFetch(`/api/platform/audit?${params}`);
      const data = await res.json();
      if (data.success) {
        const mapped: AuditEntry[] = (data.data || []).map((row: any) => ({
          id: row.id,
          timestamp: row.timestamp || row.createdAt,
          userId: row.userId || "",
          userName: row.userName || "System",
          action: row.action || "unknown",
          actionCategory: categorize(row.action || "", row.resource || ""),
          resource: row.resource || "",
          resourceId: row.resourceId || "",
          ipAddress: row.ipAddress || "",
          result: (row.result === "failure" ? "failure" : "success") as AuditResult,
          oldValues: row.oldValues,
          newValues: row.newValues,
          details: row.errorMessage || row.details || null,
          errorMessage: row.errorMessage || null,
        }));
        setEntries(mapped);
        setTotalPages(data.meta?.totalPages || 1);
      } else {
        setError(extractApiErrorMessage(data.error, "Failed to load audit logs."));
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }, [user, page, resultFilter, search]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const exportCsv = () => {
    if (!entries.length) return;
    const headers = ["timestamp", "user", "action", "resource", "resourceId", "ipAddress", "result"];
    const rows = entries.map((e) =>
      [
        e.timestamp,
        e.userName,
        e.action,
        e.resource,
        e.resourceId,
        e.ipAddress,
        e.result,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    total: entries.length,
    failed: entries.filter((e) => e.result === "failure").length,
    today: entries.filter((e) => {
      const d = new Date(e.timestamp);
      return d.toDateString() === new Date().toDateString();
    }).length,
  }), [entries]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (!user || user.role !== "SUPER_ADMIN") {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-amber-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--heading-color)" }}>Audit Log</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Track all system actions and security events</p>
        </div>
        <button onClick={exportCsv} className="btn btn-secondary inline-flex items-center gap-2" disabled={!entries.length}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sh-green-50 text-sh-green-700">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold sh-numeral" style={{ color: "var(--heading-color)" }}>{stats.total}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Events On Page</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
              <XCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold sh-numeral text-red-600">{stats.failed}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Failed Actions</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sh-amber-50 text-sh-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold sh-numeral" style={{ color: "var(--heading-color)" }}>{stats.today}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Events Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="sh-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by action..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value as any); setPage(1); }}
            className="input-field w-full sm:w-32"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} /> {error}
          </div>
        </div>
      )}

      <div className="sh-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No audit events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th className="hidden md:table-cell">Resource</th>
                  <th className="hidden lg:table-cell">IP Address</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const cat = CATEGORY_CONFIG[entry.actionCategory];
                  const CatIcon = cat.icon;
                  const isExpanded = expandedId === entry.id;
                  const hasDetails = Boolean(entry.oldValues || entry.newValues || entry.details || entry.errorMessage);
                  return (
                    <FragmentRow
                      key={entry.id}
                      entry={entry}
                      cat={cat}
                      CatIcon={CatIcon}
                      isExpanded={isExpanded}
                      hasDetails={hasDetails}
                      onToggle={() => setExpandedId(isExpanded ? null : entry.id)}
                      formatTimestamp={formatTimestamp}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FragmentRow({
  entry,
  cat,
  CatIcon,
  isExpanded,
  hasDetails,
  onToggle,
  formatTimestamp,
}: {
  entry: AuditEntry;
  cat: { label: string; icon: any; color: string };
  CatIcon: any;
  isExpanded: boolean;
  hasDetails: boolean;
  onToggle: () => void;
  formatTimestamp: (ts: string) => string;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer ${hasDetails ? "" : "pointer-events-none"}`}
        onClick={() => hasDetails && onToggle()}
      >
        <td>
          {hasDetails && (
            <button className="p-1" aria-label="Expand details">
              {isExpanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
            </button>
          )}
        </td>
        <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{formatTimestamp(entry.timestamp)}</td>
        <td>
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{entry.userName}</span>
        </td>
        <td>
          <div className="flex items-center gap-2">
            <CatIcon size={14} className={cat.color} />
            <span className="text-sm" style={{ color: "var(--text)" }}>{entry.action}</span>
          </div>
        </td>
        <td className="hidden md:table-cell">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface-2, var(--bg))", color: "var(--text-muted)" }}>
            {entry.resource}{entry.resourceId ? `:${entry.resourceId.slice(0, 8)}` : ""}
          </span>
        </td>
        <td className="hidden lg:table-cell text-xs" style={{ color: "var(--text-muted)" }}>{entry.ipAddress || " "}</td>
        <td>
          {entry.result === "success" ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle size={12} /> Success
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
              <XCircle size={12} /> Failure
            </span>
          )}
        </td>
      </tr>
      {isExpanded && hasDetails && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-gray-50/60">
            <pre className="text-xs whitespace-pre-wrap" style={{ color: "var(--text)" }}>
              {JSON.stringify(
                {
                  details: entry.details || entry.errorMessage || undefined,
                  oldValues: entry.oldValues || undefined,
                  newValues: entry.newValues || undefined,
                },
                null,
                2
              )}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
