"use client";

import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { useState, useRef } from "react";
import { Upload, Users, Loader2, AlertCircle, CheckCircle, X, Download } from "lucide-react";
import { API_URL } from "@/lib/config";


export default function BulkImportPage() {
  // cookie auth: token always null
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one student.");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const required = ["fullname", "admissionnumber", "class", "arm"];
      const missing = required.filter(r => !headers.some(h => h.replace(/[^a-z]/g, "") === r.replace(/[^a-z]/g, "")));
      if (missing.length) {
        setError(`Missing required columns: ${missing.join(", ")}. Required: FullName, AdmissionNumber, Class, Arm`);
        return;
      }

      const parsed = lines.slice(1).map((line, i) => {
        const vals = line.split(",").map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
        return row;
      }).filter(r => r.fullname);

      setPreview(parsed.slice(0, 20));
    };
    reader.readAsText(f);
  };

  const doImport = async () => {
    if (!file || !preview.length) return;
    setImporting(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim());
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        const students = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = vals[idx] || ""; });
          return {
            fullName: row.fullname || "",
            admissionNumber: row.admissionnumber || row["admission no"] || row["admission_no"] || "",
            className: row.class || "",
            armName: row.arm || "",
            gender: row.gender || "",
            dob: row.dob || row.dateofbirth || "",
            parentName: row.parentname || row["parent name"] || "",
            parentEmail: row.parentemail || row["parent email"] || "",
            parentPhone: row.parentphone || row["parent phone"] || "",
          };
        }).filter(s => s.fullName && s.admissionNumber);

        const res = await fetch(`${API_URL}/api/students/bulk`, {
          method: "POST",
          credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            students: students.map((s: any) => ({
              fullName: s.fullName,
              admissionNumber: s.admissionNumber,
              className: s.className,
              armName: s.armName,
              gender: s.gender,
              parentName: s.parentName,
              parentEmail: s.parentEmail,
              parentPhone: s.parentPhone,
            })),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setResult({ success: data.data?.count || students.length, errors: data.data?.errors || [] });
        } else {
          setError(data.error || "Import failed.");
        }
      };
      reader.readAsText(file);
    } catch {
      setError("Network error during import.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `FullName,AdmissionNumber,Class,Arm,Gender,DOB,ParentName,ParentEmail,ParentPhone\nJohn Doe,STU001,JSS 1,A, Male,2010-01-15,Mr. Doe,parent@email.com,08012345678\nJane Smith,STU002,JSS 1,B,Female,2011-03-20,Mrs. Smith,smith@email.com,08098765432`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">Bulk Student Import</h1>
          <p className="text-sm text-gray-500 font-sans">Upload a CSV file to register multiple students at once</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium font-sans text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-schoolhub-400 hover:bg-schoolhub-50/30 transition-all"
      >
        <Upload className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm font-medium text-gray-700 font-sans">{file ? file.name : "Click to select CSV file"}</p>
        <p className="text-xs text-gray-400 mt-1 font-sans">Required columns: FullName, AdmissionNumber, Class, Arm</p>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-2">Preview ({preview.length} of {file ? "up to total" : "0"} rows)</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 font-sans">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 font-sans">Admission No.</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 font-sans">Class</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 font-sans">Arm</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 font-sans">Parent Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-sans text-gray-800 font-medium">{r.fullname}</td>
                    <td className="px-3 py-2 font-sans text-gray-600">{r.admissionnumber}</td>
                    <td className="px-3 py-2 font-sans text-gray-600">{r.class}</td>
                    <td className="px-3 py-2 font-sans text-gray-600">{r.arm}</td>
                    <td className="px-3 py-2 font-sans text-gray-500">{r.parentemail || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={doImport}
            disabled={importing}
            className="mt-4 px-6 py-2.5 bg-schoolhub-500 text-white rounded-lg text-sm font-medium font-sans hover:bg-schoolhub-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? `Importing ${preview.length} students...` : `Import ${preview.length} Students`}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-sans">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-green-700 font-semibold font-sans mb-1">
            <CheckCircle className="w-5 h-5" />
            {result.success} student(s) imported successfully!
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-xs text-red-600 font-sans">
              {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
