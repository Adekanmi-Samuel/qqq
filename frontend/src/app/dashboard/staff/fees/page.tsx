"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { DollarSign, Loader2, Search, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/config";

interface FeeRecord {
  id: string;
  amount: number;
  description: string;
  term: number;
  session: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  student: { id: string; fullName: string; admissionNumber: string };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  channel: string;
  reference: string;
  paidAt: string | null;
  createdAt: string;
  student: { id: string; fullName: string; admissionNumber: string };
}

export default function StaffFeesPage() {
  // cookie auth: token always null
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const [feeRes, payRes] = await Promise.all([
          fetch(`${API_URL}/api/fees`, { credentials: "include" }),
          fetch(`${API_URL}/api/payments`, { credentials: "include" }),
        ]);
        const feeData = await feeRes.json();
        const payData = await payRes.json();
        if (feeData.success) setFees(feeData.data || []);
        if (payData.success) setPayments(payData.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = fees.filter((f) =>
    !search || f.student?.fullName.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpected = filtered.reduce((s, f) => s + f.amount, 0);
  const totalPaid = filtered.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
  const outstanding = totalExpected - totalPaid;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-50 text-green-700", PARTIAL: "bg-yellow-50 text-yellow-700",
      PENDING: "bg-gray-100 text-gray-600", OVERDUE: "bg-red-50 text-red-600", WAIVED: "bg-blue-50 text-blue-600",
    };
    const icons: Record<string, any> = { PAID: <CheckCircle className="w-3 h-3" />, PARTIAL: <Clock className="w-3 h-3" />, PENDING: <Clock className="w-3 h-3" />, OVERDUE: <AlertTriangle className="w-3 h-3" />, WAIVED: <CheckCircle className="w-3 h-3" /> };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-sans ${styles[status] || styles.PENDING}`}>
        {icons[status]} {status}
      </span>
    );
  };

  if (loading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Fee Records</h1>
        <p className="text-sm text-gray-500 font-sans">View school fees and payment history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Total Expected</p>
          <p className="text-xl font-bold mt-1 font-sans text-gray-900">₦{totalExpected.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Total Collected</p>
          <p className="text-xl font-bold mt-1 font-sans text-green-600">₦{totalPaid.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Outstanding</p>
          <p className={`text-xl font-bold mt-1 font-sans ${outstanding > 0 ? "text-red-500" : "text-green-600"}`}>
            {outstanding > 0 ? `₦${outstanding.toLocaleString()}` : "₦0"}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by student or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-schoolhub-500"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Student</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Term</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-sans">
                      <p className="font-medium text-gray-900">{fee.student?.fullName || " "}</p>
                      <p className="text-xs text-gray-500">{fee.student?.admissionNumber}</p>
                    </td>
                    <td className="px-3 py-3 font-sans text-gray-700">{fee.description}</td>
                    <td className="px-3 py-3 text-right font-sans font-semibold">₦{fee.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-center font-sans text-gray-600 text-xs">Term {fee.term}</td>
                    <td className="px-3 py-3 text-center">{statusBadge(fee.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No fee records found.</p>
        </div>
      )}
    </div>
  );
}
