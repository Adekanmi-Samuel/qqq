"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  BookOpen,
  Timer,
  Target,
  Award,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  BarChart2,
  Clock,
  Zap,
  Trophy,
} from "lucide-react";
import { Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { API_URL } from "@/lib/config";


interface CBTSubject {
  id: string;
  name: string;
  code: string;
  examTypes: string[];
  description?: string;
  _count: {
    topics: number;
    questions: number;
  };
}

interface CBTStats {
  attempts: number;
  subjectStats: Record<string, {
    totalAttempts: number;
    totalScore: number;
    totalPossible: number;
    correctCount: number;
    wrongCount: number;
    avgTimeSpent: number;
    averageScore: number;
  }>;
}

export default function StudentCBTPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // cookie auth: token always null

  const [subjects, setSubjects] = useState<CBTSubject[]>([]);
  const [stats, setStats] = useState<CBTStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSubjects = useCallback(async () => {
  // cookie auth
    try {
      const params = new URLSearchParams();
      if (selectedExamType !== "ALL") params.append("examType", selectedExamType);
      const res = await fetch(`${API_URL}/api/cbt/subjects?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setSubjects(data.data || []);
    } catch (err) {
      setError("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [ selectedExamType]);

  const fetchStats = useCallback(async () => {
  // cookie auth
    try {
      const res = await fetch(`${API_URL}/api/cbt/students/me/stats`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchStats();
  }, [fetchSubjects, fetchStats]);

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExamTypeBadge = (types: string[]) => {
    const colors: Record<string, string> = {
      JAMB: "bg-green-100 text-green-700",
      WAEC: "bg-blue-100 text-blue-700",
      NECO: "bg-purple-100 text-purple-700",
      POST_UTME: "bg-orange-100 text-orange-700",
      UTME: "bg-red-100 text-red-700",
    };
    return types.map((t) => (
      <span key={t} className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[t] || "bg-gray-100 text-gray-700"}`}>
        {t}
      </span>
    ));
  };

  const handleStartPractice = async (subject: CBTSubject, mode: "PRACTICE" | "MOCK" | "TIMED") => {
  // cookie auth
    try {
      // Get random questions for this subject
      const questionCount = mode === "MOCK" ? 50 : mode === "TIMED" ? 30 : 10;
      const questionsRes = await fetch(
        `${API_URL}/api/cbt/questions/random?subjectId=${subject.id}&count=${questionCount}&examType=${selectedExamType !== "ALL" ? selectedExamType : ""}`,
        { credentials: "include" }
      );
      const questionsData = await questionsRes.json();
      
      if (!questionsData.success || !questionsData.data?.length) {
        alert("No questions available for this subject. Please try another.");
        return;
      }

      const questionIds = questionsData.data.map((q: any) => q.id);

      // Create session
      const sessionRes = await fetch(`${API_URL}/api/cbt/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({
          subjectId: subject.id,
          examType: selectedExamType !== "ALL" ? selectedExamType : subject.examTypes[0] || "JAMB",
          mode,
          questionCount: questionIds.length,
          timeLimit: mode === "TIMED" ? 3600 : mode === "MOCK" ? 7200 : null, // 1hr, 2hr, or untimed
          questionIds,
        }),
      });
      const sessionData = await sessionRes.json();
      
      if (sessionData.success) {
        router.push(`/dashboard/student/cbt/player?sessionId=${sessionData.data.id}`);
      } else {
        alert(sessionData.error || "Failed to start session");
      }
    } catch (err) {
      alert("Failed to start practice session");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-schoolhub-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading CBT subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-fraunces font-semibold text-gray-900">CBT Practice</h1>
              <p className="text-gray-600 mt-1">Practice past questions for JAMB, WAEC, NECO & Post-UTME</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Exams</SelectItem>
                  <SelectItem value="JAMB">JAMB UTME</SelectItem>
                  <SelectItem value="WAEC">WAEC</SelectItem>
                  <SelectItem value="NECO">NECO</SelectItem>
                  <SelectItem value="POST_UTME">Post-UTME</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => router.push("/dashboard/student/cbt/analytics")}>
                <BarChart2 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => { fetchSubjects(); fetchStats(); }} disabled={loading || statsLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading || statsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      {stats && (
        <section className="px-4 py-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.attempts}</p>
                  <p className="text-sm text-gray-500">Total Attempts</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(stats.subjectStats).length > 0
                      ? Math.round(
                          Object.values(stats.subjectStats).reduce((a, b) => a + b.averageScore, 0) /
                            Object.values(stats.subjectStats).length
                        )
                      : 0}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Score</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(stats.subjectStats).length > 0
                      ? Math.round(
                          Object.values(stats.subjectStats).reduce((a, b) => a + b.avgTimeSpent, 0) /
                            Object.values(stats.subjectStats).length / 60
                        )
                      : 0} min
                  </p>
                  <p className="text-sm text-gray-500">Avg Time</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.subjectStats).length}
                  </p>
                  <p className="text-sm text-gray-500">Subjects Practiced</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Subjects Grid */}
      <main className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-fraunces font-semibold text-gray-900">
              Available Subjects ({filteredSubjects.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects..."
                className="w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-schoolhub-400"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {filteredSubjects.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
              <p className="text-gray-500">Try adjusting your search or exam type filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSubjects.map((subject) => (
                <Card key={subject.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-schoolhub-50 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-schoolhub-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{subject.code}</span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{subject.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{subject.description || "No description available"}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {getExamTypeBadge(subject.examTypes)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pt-3 border-t border-gray-100">
                    <span>{subject._count.topics} topics</span>
                    <span>{subject._count.questions} questions</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2"
                      onClick={() => handleStartPractice(subject, "PRACTICE")}
                      disabled={subject._count.questions === 0}
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      Practice
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2"
                      onClick={() => handleStartPractice(subject, "MOCK")}
                      disabled={subject._count.questions < 10}
                    >
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Mock
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2"
                      onClick={() => handleStartPractice(subject, "TIMED")}
                      disabled={subject._count.questions < 10}
                    >
                      <Timer className="w-3.5 h-3.5 mr-1.5" />
                      Timed
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
