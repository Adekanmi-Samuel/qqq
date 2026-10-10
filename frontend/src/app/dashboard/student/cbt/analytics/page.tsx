"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  BarChart2, TrendingUp, Award, Target, BookOpen, ArrowLeft,
  Loader2, Clock, CheckCircle, XCircle, SkipForward, Trophy,
  ChevronRight, Flame,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { API_URL } from "@/lib/config";


interface AttemptRecord {
  id: string;
  examType: string;
  subjectId: string;
  score: number;
  total: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpent: number;
  mode: string;
  startedAt: string;
  completedAt: string | null;
  subject: { id: string; name: string; code: string };
}

interface StudentStats {
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

const CHART_COLORS = [
  "#0b6e4f", "#4ccf9c", "#5ba4cf", "#e8845c", "#a855f7",
  "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899",
];

export default function CBTAnalyticsPage() {
  const router = useRouter();
  // cookie auth: token always null

  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
  // cookie auth
    try {
      const [attemptsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/cbt/attempts?limit=100`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/cbt/students/me/stats`, {
          credentials: "include",
        }),
      ]);

      const attemptsData = await attemptsRes.json();
      const statsData = await statsRes.json();

      if (attemptsData.success) setAttempts(attemptsData.data?.attempts || []);
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute derived data
  const overallAvg = stats
    ? Object.values(stats.subjectStats).length > 0
      ? Math.round(
          Object.values(stats.subjectStats).reduce((a, b) => a + b.averageScore, 0) /
          Object.values(stats.subjectStats).length
        )
      : 0
    : 0;

  const totalCorrect = stats
    ? Object.values(stats.subjectStats).reduce((a, b) => a + b.correctCount, 0)
    : 0;
  const totalWrong = stats
    ? Object.values(stats.subjectStats).reduce((a, b) => a + b.wrongCount, 0)
    : 0;

  // Score trend data (last 20 attempts, sorted chronologically)
  const scoreTrend = [...attempts]
    .filter((a) => a.completedAt)
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-20)
    .map((a, i) => ({
      attempt: i + 1,
      score: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
      subject: a.subject?.code || "N/A",
      date: new Date(a.startedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    }));

  // Subject performance data
  const subjectPerformance = stats
    ? Object.entries(stats.subjectStats).map(([subjectId, s]) => {
        const subjectAttempt = attempts.find((a) => a.subjectId === subjectId);
        return {
          name: subjectAttempt?.subject?.code || subjectId.slice(0, 4),
          fullName: subjectAttempt?.subject?.name || subjectId,
          score: Math.round(s.averageScore),
          attempts: s.totalAttempts,
          correct: s.correctCount,
          wrong: s.wrongCount,
        };
      })
    : [];

  // Pie chart data
  const pieData = [
    { name: "Correct", value: totalCorrect, color: "#16a34a" },
    { name: "Wrong", value: totalWrong, color: "#dc2626" },
  ];

  // Exam type breakdown
  const examTypeBreakdown = attempts.reduce((acc, a) => {
    acc[a.examType] = (acc[a.examType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Weakest subjects (bottom 3 by score)
  const weakestSubjects = [...subjectPerformance]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  // Strongest subjects (top 3 by score)
  const strongestSubjects = [...subjectPerformance]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Recent attempts (last 5)
  const recentAttempts = [...attempts]
    .filter((a) => a.completedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-schoolhub-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/student/cbt")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-fraunces font-semibold text-brand-ink">
              Performance Analytics
            </h1>
            <p className="text-sm text-gray-500 font-sans">
              Track your CBT practice progress and identify areas for improvement
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.attempts || 0}</p>
              <p className="text-xs text-gray-500 font-sans">Total Attempts</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overallAvg}%</p>
              <p className="text-xs text-gray-500 font-sans">Average Score</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCorrect}</p>
              <p className="text-xs text-gray-500 font-sans">Correct Answers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subjectPerformance.length}</p>
              <p className="text-xs text-gray-500 font-sans">Subjects Practiced</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-schoolhub-500" />
            Score Trend (Last 20 Attempts)
          </h3>
          {scoreTrend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#12926a" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#12926a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                      color: "var(--heading-color)",
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: any) => [`${value}%`, "Score"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    fill="url(#scoreGrad)"
                    dot={{ r: 3, fill: "var(--brand)" }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p className="font-sans text-sm">No attempts yet. Start practicing!</p>
            </div>
          )}
        </Card>

        {/* Answer Distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-schoolhub-500" />
            Answer Breakdown
          </h3>
          {totalCorrect + totalWrong > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => <span className="text-xs font-sans text-gray-600">{value}</span>}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                      color: "var(--heading-color)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p className="font-sans text-sm">No data yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Subject Performance Bar Chart */}
      {subjectPerformance.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-schoolhub-500" />
            Subject-wise Performance
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} stroke="var(--border)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--card-border)",
                    borderRadius: "0.75rem",
                    fontSize: 12,
                    color: "var(--heading-color)",
                  }}
                  formatter={(value: any) => [`${value}%`, "Avg Score"]}
                  labelFormatter={(label) => {
                    const sp = subjectPerformance.find((s) => s.name === label);
                    return sp?.fullName || label;
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {subjectPerformance.map((entry, index) => (
                    <Cell
                      key={`bar-${index}`}
                      fill={entry.score >= 70 ? "#16a34a" : entry.score >= 50 ? "#f59e0b" : "#dc2626"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Strengths & Weaknesses + Recent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strongest */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Strongest Subjects
          </h3>
          {strongestSubjects.length > 0 ? (
            <div className="space-y-3">
              {strongestSubjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">{s.fullName}</p>
                      <p className="text-xs text-gray-500 font-sans">{s.attempts} attempts</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">{s.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 font-sans">No data yet</p>
          )}
        </Card>

        {/* Weakest */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500" />
            Needs Improvement
          </h3>
          {weakestSubjects.length > 0 ? (
            <div className="space-y-3">
              {weakestSubjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center text-xs font-bold text-red-700">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">{s.fullName}</p>
                      <p className="text-xs text-gray-500 font-sans">{s.attempts} attempts</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-red-600">{s.score}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 font-sans">No data yet</p>
          )}
        </Card>

        {/* Recent Attempts */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Recent Attempts
          </h3>
          {recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.map((a) => {
                const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-sans">
                        {a.subject?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 font-sans">
                        {a.examType} · {new Date(a.startedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 font-sans">No attempts yet</p>
          )}
        </Card>
      </div>

      {/* Exam Type Breakdown */}
      {Object.keys(examTypeBreakdown).length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 font-sans mb-4">
            Attempts by Exam Type
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(examTypeBreakdown).map(([type, count]) => {
              const colors: Record<string, string> = {
                JAMB: "bg-green-100 text-green-700 border-green-200",
                WAEC: "bg-blue-100 text-blue-700 border-blue-200",
                NECO: "bg-purple-100 text-purple-700 border-purple-200",
                POST_UTME: "bg-orange-100 text-orange-700 border-orange-200",
              };
              return (
                <div
                  key={type}
                  className={`px-4 py-3 rounded-xl border ${colors[type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                >
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs font-medium">{type}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
