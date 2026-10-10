"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import SchoolLogo from "@/components/SchoolLogo";

interface School {
  id: string;
  name: string;
  slug: string;
  schoolType: string;
  ownershipType: string;
  state: string;
  lga: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  logoUrl: string;
  verified: boolean;
  classes: any[];
  notices: any[];
  _count: { students: number };
}

function SchoolContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchool() {
      try {
        // Public school page must use the public route. /api/schools/:slug is
// mounted behind authenticate and returns 401 for unauthenticated visitors.
        const res = await fetch(`${API_URL}/api/public/schools/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setSchool(data.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchSchool();
  }, [slug]);

  if (!slug) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No school specified</h1>
          <p className="text-gray-500 mb-4">Please select a school to view its profile.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-schoolhub-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">School not found</h1>
          <p className="text-gray-500 mb-4">This school profile doesn&apos;t exist yet.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <SchoolLogo size={32} withWordmark />
          </Link>
        </div>
      </header>

      <main className="container-wide py-8">
        <div className="card p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 flex items-center justify-center flex-shrink-0">
              <SchoolLogo
                logoUrl={school.logoUrl}
                schoolName={school.name}
                size={96}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{school.name}</h1>
                {school.verified && (
                  <span className="badge-green flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                {school.schoolType && <span className="capitalize">{school.schoolType.toLowerCase().replace("_", " ")}</span>}
                {school.ownershipType && (<><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="capitalize">{school.ownershipType.toLowerCase()}</span></>)}
                {school.state && (<><span className="w-1 h-1 rounded-full bg-gray-300" /><span>{school.state} State{school.lga ? `, ${school.lga}` : ""}</span></>)}
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={`https://wa.me/?text=Check%20out%20${encodeURIComponent(school.name)}%20on%20SchoolPilot`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {school.description || `${school.name} is a school located in ${school.lga}, ${school.state} State.`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">School type</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{school.schoolType?.toLowerCase().replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Ownership</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{school.ownershipType?.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Students enrolled</p>
                  <p className="text-sm font-medium text-gray-900">{school._count?.students || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={school.verified ? "badge-success" : "badge-warning"}>
                    {school.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
              </div>
            </div>

            {school.classes?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Classes</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {school.classes.map((cls: any) => (
                    <div key={cls.id} className="bg-gray-50 rounded-xl p-4">
                      <p className="font-medium text-gray-900">{cls.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{cls.arms?.length} arm(s)   {cls._count?.students || 0} student(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-4">
                {school.phone && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                    <a href={`tel:${school.phone}`} className="text-sm text-schoolhub-600 hover:underline">{school.phone}</a>
                  </div>
                )}
                {school.email && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${school.email}`} className="text-sm text-schoolhub-600 hover:underline">{school.email}</a>
                  </div>
                )}
                {school.address && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Address</p>
                    <p className="text-sm text-gray-700">{school.address}</p>
                  </div>
                )}
              </div>
            </div>

            {school.notices?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
                <div className="space-y-3">
                  {school.notices.slice(0, 5).map((notice: any) => (
                    <div key={notice.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-gray-900">{notice.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notice.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SchoolProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-schoolhub-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SchoolContent />
    </Suspense>
  );
}
