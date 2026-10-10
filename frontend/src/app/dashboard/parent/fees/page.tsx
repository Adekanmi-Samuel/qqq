"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import { DollarSign, Loader2, CheckCircle, Clock } from "lucide-react";
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
  studentId: string;
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
  studentId: string;
  student: { id: string; fullName: string };
}

interface Child {
  id: string;
  fullName: string;
  admissionNumber: string;
}

export default function ParentFeesPage() {
  // cookie auth: token always null
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState("");

  useEffect(() => {
  // cookie auth
    (async () => {
      try {
        const [feeRes, payRes, childRes] = await Promise.all([
          fetch(`${API_URL}/api/fees`, { credentials: "include" }),
          fetch(`${API_URL}/api/payments`, { credentials: "include" }),
          fetch(`${API_URL}/api/dashboard/parent`, { credentials: "include" }),
        ]);
        const [feeData, payData, childData] = await Promise.all([feeRes.json(), payRes.json(), childRes.json()]);
        if (feeData.success) setFees(feeData.data || []);
        if (payData.success) setPayments(payData.data || []);
        if (childData.success) setChildren(childData.data?.children || childData.data?.students || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filteredFees = selectedChild ? fees.filter((f) => f.studentId === selectedChild) : fees;
  const filteredPayments = selectedChild ? payments.filter((p) => p.studentId === selectedChild) : payments;

  const totalDue = filteredFees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const balance = totalDue - totalPaid;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-50 text-green-700", PENDING: "bg-gray-100 text-gray-600", PARTIAL: "bg-yellow-50 text-yellow-700",
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-sans ${styles[status] || styles.PENDING}`}>
        {status === "PAID" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />} {status}
      </span>
    );
  };

  if (loading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-schoolhub-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Fee Records</h1>
        <p className="text-sm text-gray-500 font-sans">View school fees and payment history</p>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedChild("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-colors ${!selectedChild ? "bg-schoolhub-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            All Children
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChild(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-colors ${selectedChild === c.id ? "bg-schoolhub-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c.fullName}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Total Due</p>
          <p className="text-xl font-bold mt-1 font-sans text-gray-900">₦{totalDue.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Total Paid</p>
          <p className="text-xl font-bold mt-1 font-sans text-green-600">₦{totalPaid.toLocaleString()}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xs text-gray-500 font-medium font-sans">Balance</p>
          <p className={`text-xl font-bold mt-1 font-sans ${balance <= 0 ? "text-green-600" : "text-red-500"}`}>
            {balance <= 0 ? "₦0" : `₦${balance.toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Fee Records */}
      {filteredFees.length > 0 && (
        <div>
          <h2 className="text-lg font-fraunces font-semibold text-brand-ink mb-3">Fee Records</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Description</th>
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-sans text-gray-900 font-medium">{fee.student?.fullName || " "}</td>
                      <td className="px-3 py-3 font-sans text-gray-700">{fee.description}</td>
                      <td className="px-3 py-3 text-right font-sans font-semibold">₦{fee.amount.toLocaleString()}</td>
                      <td className="px-3 py-3 text-center">{statusBadge(fee.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {filteredPayments.length > 0 && (
        <div>
          <h2 className="text-lg font-fraunces font-semibold text-brand-ink mb-3">Payment History</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Student</th>
                    <th className="text-right px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-center px-3 py-3 font-semibold text-gray-700 font-sans text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-sans text-gray-700 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3 font-sans text-gray-900 font-medium">{p.student?.fullName || " "}</td>
                      <td className="px-3 py-3 text-right font-sans font-semibold">₦{(p.amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 font-sans">
                          <CheckCircle className="w-3 h-3" /> {p.status || "Completed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!filteredFees.length && !filteredPayments.length && (
        <div className="text-center py-16 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-sans">No fee records available.</p>
        </div>
      )}
    </div>
  );
}
