"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { Copy, Check, Plus, Users, Briefcase, Shield, Clock, GraduationCap, Heart } from "lucide-react";
import { API_URL } from "@/lib/config";


interface Invite {
  id: string;
  code: string;
  role: string;
  used: boolean;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  TEACHER: "Teacher",
  BURSAR: "Bursar",
  PRINCIPAL: "Principal",
  STUDENT: "Student",
  PARENT: "Parent",
};

const roleIcons: Record<string, any> = {
  TEACHER: Users,
  BURSAR: Briefcase,
  PRINCIPAL: Shield,
  STUDENT: GraduationCap,
  PARENT: Heart,
};

export default function InvitesPage() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("TEACHER");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showGenerated, setShowGenerated] = useState<{ code: string; role: string }[]>([]);
  const [message, setMessage] = useState("");

  async function loadInvites() {
    try {
      const token = null;
      const res = await fetch(`${API_URL}/api/invites`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setInvites(data.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInvites(); }, []);

  async function generateCodes() {
    setGenerating(true);
    setMessage("");
    setShowGenerated([]);
    try {
      const token = null;
      const res = await fetch(`${API_URL}/api/invites/generate`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, role: selectedRole }),
      });
      const data = await res.json();
      if (data.success) {
        setShowGenerated(data.data);
        setMessage(data.message);
        loadInvites();
      } else {
        setMessage(data.error || "Failed to generate codes.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  }

  const activeInvites = invites.filter((i) => !i.used);
  const usedInvites = invites.filter((i) => i.used);

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-brand-ink font-fraunces">Staff Invites</h1>
        <p className="text-sm text-gray-500 font-sans mt-1">
          Generate invite codes for teachers and staff to join your school.
        </p>
      </div>

      {/* Generate form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink font-fraunces mb-4">
          Generate New Codes
        </h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">Role</label>
            <div className="flex flex-wrap gap-2">
              {(["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium font-sans transition-all ${
                    selectedRole === role
                      ? "bg-schoolhub-500 text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="w-28">
            <label className="block text-xs font-medium text-gray-600 mb-1.5 font-sans">Count</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-sans bg-white"
            >
              {[1, 2, 3, 5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <button
            onClick={generateCodes}
            disabled={generating}
            className="px-5 py-2 bg-schoolhub-500 text-white rounded-lg text-sm font-medium font-sans
              hover:bg-schoolhub-600 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>

        {message && (
          <p className="mt-3 text-sm text-gray-600 font-sans">{message}</p>
        )}

        {/* Generated codes */}
        {showGenerated.length > 0 && (
          <div className="mt-4 p-4 bg-schoolhub-50 border border-schoolhub-100 rounded-xl">
            <p className="text-xs font-medium text-schoolhub-700 uppercase tracking-wider mb-3 font-sans">
              New Codes   Share with your staff
            </p>
            <div className="space-y-2">
              {showGenerated.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-schoolhub-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-schoolhub-700 text-sm">{item.code}</span>
                    <span className="text-xs bg-schoolhub-100 text-schoolhub-700 px-2 py-0.5 rounded-full font-sans">
                      {roleLabels[item.role] || item.role}
                    </span>
                  </div>
                  <button
                    onClick={() => copyCode(item.code)}
                    className="p-1.5 hover:bg-schoolhub-100 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    {copiedCode === item.code ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
              <p className="text-xs text-schoolhub-600 font-sans mt-2">
                Codes expire after 7 days. Share with your staff via WhatsApp or email.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active codes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-brand-ink font-fraunces mb-4 flex items-center justify-between">
          <span>Active Codes ({activeInvites.length})</span>
          {loading && <div className="w-4 h-4 border-2 border-gray-300 border-t-schoolhub-600 rounded-full animate-spin" />}
        </h2>

        {!loading && activeInvites.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-sans">No active invite codes. Generate some above.</p>
          </div>
        )}

        <div className="space-y-2">
          {activeInvites.map((invite) => {
            const Icon = roleIcons[invite.role] || Users;
            const expiresIn = invite.expiresAt
              ? Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 7;

            return (
              <div key={invite.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-schoolhub-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-schoolhub-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm">{invite.code}</span>
                      <span className="text-xs bg-schoolhub-50 text-schoolhub-700 px-2 py-0.5 rounded-full font-sans">
                        {roleLabels[invite.role] || invite.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-sans">
                      Expires in {expiresIn} days
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyCode(invite.code)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  {copiedCode === invite.code ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Used codes */}
      {usedInvites.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-brand-ink font-fraunces mb-4">
            Used Codes ({usedInvites.length})
          </h2>
          <div className="space-y-2">
            {usedInvites.slice(0, 20).map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-400 line-through">{invite.code}</span>
                  <span className="text-xs text-gray-400 font-sans">
                    {roleLabels[invite.role] || invite.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
