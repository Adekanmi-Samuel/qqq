"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useRouter } from "next/navigation";
import {
  CreditCard, Plus, Loader2, Check, X, Trash2, AlertTriangle,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { csrfHeaders, extractApiErrorMessage } from "@/lib/utils";


interface Plan {
  id: string;
  name: string;
  planType?: string;
  price: number;
  maxStudents: number;
  maxStaff: number;
  features: string[];
  billingCycle: string;
  interval?: string;
  active: boolean;
}

function typeOf(plan: Plan): string {
  if (plan.planType) return plan.planType;
  if (plan.price === 0) return "FREE";
  return "PREMIUM";
}

function cycleOf(plan: Plan): string {
  return plan.billingCycle || (plan.interval === "yearly" ? "yearly" : "monthly");
}

export default function PlansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "", planType: "FREE", price: 0,
    maxStudents: 50, maxStaff: 10, billingCycle: "monthly",
    features: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "SUPER_ADMIN") {
      router.push("/dashboard/admin");
      return;
    }
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/platform/plans`, { credentials: "include", headers: csrfHeaders() });
      const data = await res.json();
      if (data.success) {
        const mapped = (data.data || []).map((p: any) => ({
          ...p,
          billingCycle: p.billingCycle || (p.interval === "yearly" ? "yearly" : "monthly"),
        }));
        setPlans(mapped);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/platform/plans`, {
        method: "POST",
        credentials: "include",
        headers: csrfHeaders(),
        body: JSON.stringify({
          name: formData.name,
          planType: formData.planType,
          price: Number(formData.price),
          maxStudents: Number(formData.maxStudents),
          maxStaff: Number(formData.maxStaff),
          features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
          billingCycle: formData.billingCycle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setFormData({ name: "", planType: "FREE", price: 0, maxStudents: 50, maxStaff: 10, billingCycle: "monthly", features: "" });
        fetchPlans();
      } else {
        setError(extractApiErrorMessage(data.error, "Failed to save plan"));
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setSaving(false);
    }
  };

  const featureList = (plan: Plan) => {
    try {
      const features = typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features;
      return Array.isArray(features) ? features : [];
    } catch { return []; }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing tiers and features for schools</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </div>

      {error && (
        <div role="alert" className="text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Create Plan</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createPlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    value={formData.planType} onChange={e => setFormData({ ...formData, planType: e.target.value })}>
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min="0"
                    value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min="1"
                    value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Staff</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" min="1"
                    value={formData.maxStaff} onChange={e => setFormData({ ...formData, maxStaff: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={formData.billingCycle} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={3}
                  placeholder="Timetable management, CBT exams, Fee management..."
                  value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className={`bg-white rounded-xl border-2 p-6 ${
            typeOf(plan) === "PREMIUM" ? "border-amber-400 shadow-lg" : "border-gray-200"
          }`}>
            <div className="text-center mb-4">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                typeOf(plan) === "FREE" ? "bg-gray-100 text-gray-600" :
                typeOf(plan) === "PREMIUM" ? "bg-amber-50 text-amber-700" :
                "bg-purple-50 text-purple-700"
              }`}>
                <CreditCard className="w-3 h-3" />
                {typeOf(plan)}
              </div>
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₦{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-400">/{cycleOf(plan) === "yearly" ? "yr" : "mo"}</span>
              </p>
            </div>
            <div className="space-y-2 mb-6">
              {featureList(plan).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-gray-300 flex-shrink-0" />
                Up to {plan.maxStudents} students
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Check className="w-4 h-4 text-gray-300 flex-shrink-0" />
                Up to {plan.maxStaff} staff
              </div>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No subscription plans created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
