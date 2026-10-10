"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useEffect, useState } from "react";
import {
  FileCheck, Download, Loader2, AlertCircle, CheckCircle,
  Users, UserCog, ClipboardCheck, DollarSign, PenTool, LayoutDashboard
} from "lucide-react";
import { API_URL } from "@/lib/config";


interface ComplianceReport {
  id: string;
  type: string;
  academicSession: string;
  academicTerm: number;
  data: any;
  generatedBy: string;
  createdAt: string;
}

const REPORT_TYPES = [
  { id: "STUDENT_NOMINAL_ROLL", label: "Student Nominal Roll", icon: Users, desc: "List of all active students by class" },
  { id: "STAFF_NOMINAL_ROLL", label: "Staff Nominal Roll", icon: UserCog, desc: "List of all active staff members" },
  { id: "ATTENDANCE_SUMMARY", label: "Attendance Summary", icon: ClipboardCheck, desc: "Student attendance statistics" },
  { id: "FEE_COLLECTION", label: "Fee Collection Report", icon: DollarSign, desc: "Summary of expected vs collected fees" },
  { id: "EXAM_REGISTRATION", label: "Exam Registration Summary", icon: PenTool, desc: "Registered students for internal exams" },
  { id: "INFRASTRUCTURE", label: "Infrastructure Checklist", icon: LayoutDashboard, desc: "Classroom and facilities status" },
];

export default function ComplianceReports() {
  // cookie auth: token always null
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
  // cookie auth
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/compliance`, {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setReports(data.data || []);
      }
    } catch (e) {
      setError("Failed to load compliance reports.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(typeId: string) {
  // cookie auth
    setGenerating(typeId);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/compliance/generate`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeId })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Report generated successfully!`);
        loadReports();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to generate report.");
      }
    } catch (e) {
      setError("Network error.");
    } finally {
      setGenerating(null);
    }
  }

  function handleDownload(report: ComplianceReport) {
    // In a real app, this might generate a PDF or CSV from the report.data
    // For now, we'll download it as a formatted JSON file
    const dataStr = JSON.stringify(report.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.type}_${report.academicSession}_Term${report.academicTerm}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-ink font-fraunces">Compliance Reports</h1>
          <p className="text-sm text-gray-500 font-sans mt-0.5">Generate statutory and operational reports</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{success}
        </div>
      )}

      {/* Generate Reports Grid */}
      <h2 className="text-sm font-semibold text-gray-900 font-sans mb-3">Available Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {REPORT_TYPES.map((type) => (
          <div key={type.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col hover:border-schoolhub-200 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-schoolhub-50 flex items-center justify-center">
                <type.icon className="w-5 h-5 text-schoolhub-600" />
              </div>
              <h3 className="font-semibold text-gray-900 font-sans text-sm">{type.label}</h3>
            </div>
            <p className="text-sm text-gray-500 font-sans flex-1 mb-4">{type.desc}</p>
            <button
              onClick={() => handleGenerate(type.id)}
              disabled={generating === type.id}
              className="w-full py-2 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {generating === type.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Generate Report
            </button>
          </div>
        ))}
      </div>

      {/* Saved Reports History */}
      <h2 className="text-sm font-semibold text-gray-900 font-sans mb-3">Recent Reports</h2>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-schoolhub-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-sans">No reports generated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-sans">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-medium">
                <tr>
                  <th className="px-5 py-4 font-medium">Report Type</th>
                  <th className="px-5 py-4 font-medium">Session / Term</th>
                  <th className="px-5 py-4 font-medium">Generated On</th>
                  <th className="px-5 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.map((report) => {
                  const typeInfo = REPORT_TYPES.find(t => t.id === report.type) || { label: report.type };
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {typeInfo.label}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {report.academicSession}   Term {report.academicTerm}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDownload(report)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-xs font-medium"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
