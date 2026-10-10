"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import {
  Timer,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  Flag,
  LayoutDashboard,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import confetti from "canvas-confetti";
import { API_URL } from "@/lib/config";


interface CBTQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  marks: number;
  examType: string;
  year: number;
  questionNumber: number;
}

interface CBTSession {
  id: string;
  subjectId: string;
  examType: string;
  mode: "PRACTICE" | "MOCK" | "TIMED";
  questionCount: number;
  timeLimit: number | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  questionIds: string[];
  subject: {
    id: string;
    name: string;
    code: string;
  };
  year: number;
}

interface CBTAttempt {
  id: string;
  score: number;
  total: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpent: number;
  completedAt: string | null;
  subject: {
    name: string;
    code: string;
  };
}

export default function CBTPlayer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // cookie auth: token always null

  // Session state
  const [session, setSession] = useState<CBTSession | null>(null);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attemptResult, setAttemptResult] = useState<CBTAttempt | null>(null);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Get session ID from URL or search params
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  // Fetch session and questions
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/cbt/sessions/${sessionId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch session");
      setSession(data.data);
      return data.data; // Return for chaining
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
      return null;
    } finally {
      setLoading(false);
    }
  }, [ sessionId]);

  const fetchQuestions = useCallback(async (sessionData?: any) => {
    const s = sessionData || session;
    if (!s?.questionIds?.length) return;

    try {
      const res = await fetch(
        `${API_URL}/api/cbt/questions?ids=${s.questionIds.join(",")}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success) {
        // Sort questions to match the session's questionIds order
        const sortedQuestions = s.questionIds
          .map((id: string) => data.data.find((q: CBTQuestion) => q.id === id))
          .filter(Boolean);
        setQuestions(sortedQuestions);

        // Restore answers if session has them
        if (s.answers && Object.keys(s.answers).length > 0) {
          setAnswers(s.answers);
        }

        // Set current index from session
        setCurrentIndex(s.currentQuestionIndex || 0);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  }, [ session]);

  // Load session on mount, then fetch questions
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      const sessionData = await fetchSession();
      // fetchQuestions will use the passed sessionData before state settles
      fetchQuestions(sessionData || undefined);
    })();
  }, []); // Only run on mount

  // Timer logic   ticks every second
  useEffect(() => {
    if (!session || showResults || isPaused) return;

    const limit = session.timeLimit;
    if (!limit) {
      setTimeRemaining(null);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, limit - elapsed);
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        handleSubmit();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.timeLimit, showResults, isPaused]);

  // Auto-save answers periodically
  useEffect(() => {
    if (!session || showResults) return;

    const saveInterval = setInterval(() => {
      saveProgress();
    }, 30000); // Every 30 seconds

    return () => clearInterval(saveInterval);
  }, [session, showResults, answers]);

  const saveProgress = async () => {
    if (!session) return;

    try {
      await fetch(`${API_URL}/api/cbt/sessions/${session.id}/answers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({
          answers,
          currentQuestionIndex: currentIndex,
        }),
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      startTimeRef.current = Date.now() - ((session?.timeLimit ?? 0) - (timeRemaining ?? 0)) * 1000;
    }
  };

  const handleSubmit = async () => {
    if (!session) return;

    try {
      const res = await fetch(`${API_URL}/api/cbt/sessions/${session.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
                  },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (data.success) {
        // Fetch the attempt result
        const attemptRes = await fetch(`${API_URL}/api/cbt/attempts/${data.data.attemptId}`, {
          credentials: "include",
        });
        const attemptData = await attemptRes.json();
        if (attemptData.success) {
          setAttemptResult(attemptData.data);
        }
        setShowResults(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setError(data.error || "Failed to submit");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    const answered = Object.keys(answers).length;
    return Math.round((answered / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sh-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading CBT session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Session</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/dashboard/student/study")}>
              Back to Study
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sh-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Preparing questions...</p>
        </div>
      </div>
    );
  }

  if (showResults && attemptResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Card className="mb-6">
            <div className="p-6 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                attemptResult.score / attemptResult.total >= 0.7 ? "bg-green-100 text-green-600" :
                attemptResult.score / attemptResult.total >= 0.5 ? "bg-yellow-100 text-yellow-600" :
                "bg-red-100 text-red-600"
              }`}>
                <span className="text-3xl font-bold">
                  {Math.round((attemptResult.score / attemptResult.total) * 100)}%
                </span>
              </div>
              <h1 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                {attemptResult.score / attemptResult.total >= 0.7 ? "Great Job!" : 
                 attemptResult.score / attemptResult.total >= 0.5 ? "Good Effort!" : "Keep Practicing!"}
              </h1>
              <p className="text-gray-600">
                {attemptResult.subject.name} ({attemptResult.subject.code})
              </p>
            </div>
          </Card>

          <Card className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{attemptResult.correctCount}</p>
                  <p className="text-sm text-green-700">Correct</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">{attemptResult.wrongCount}</p>
                  <p className="text-sm text-red-700">Wrong</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <p className="text-2xl font-bold text-yellow-600">{attemptResult.skippedCount}</p>
                  <p className="text-sm text-yellow-700">Skipped</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{formatTime(attemptResult.timeSpent)}</p>
                  <p className="text-sm text-blue-700">Time Spent</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard/student/study")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Back to Study
            </Button>
            <Button onClick={() => router.push(`/dashboard/student/cbt?subjectId=${session.subjectId}`)}>
              Practice More
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = getProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-semibold text-gray-900">
                {session.subject.name} ({session.subject.code})
              </h1>
              <p className="text-sm text-gray-500">
                {session.examType} · {session.mode} · Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="hidden md:block w-48">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sh-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">{progress}% Complete</p>
            </div>

            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                timeRemaining < 300 ? "bg-red-50 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"
              }`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono font-semibold text-sm">{formatTime(timeRemaining)}</span>
              </div>
            )}

            {/* Pause Button */}
            {session.timeLimit && (
              <Button variant="ghost" size="icon" onClick={handlePause} className="md:hidden">
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden px-4 pb-3 border-t border-gray-100">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-sh-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Question Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Questions:</span>
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  i === currentIndex
                    ? "bg-sh-green-500 text-white"
                    : answers[questions[i].id]
                    ? "bg-green-100 text-green-700"
                    : flagged.has(questions[i].id)
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                aria-label={`Question ${i + 1}`}
              >
                {flagged.has(questions[i].id) ? (
                  <Flag className="w-4 h-4 mx-auto" />
                ) : (
                  i + 1
                )}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {Object.keys(answers).length} / {questions.length} answered
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <div className="p-6">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-sh-green-100 text-sh-green-700">
                  {session.examType} {session.year}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  currentQuestion.difficulty === "EASY" ? "bg-green-100 text-green-700" :
                  currentQuestion.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                  {currentQuestion.marks} mark{currentQuestion.marks > 1 ? "s" : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFlag(currentQuestion.id)}
                className={flagged.has(currentQuestion.id) ? "text-yellow-500" : "text-gray-400"}
              >
                <Flag className="w-5 h-5" />
              </Button>
            </div>

            {/* Question Text */}
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-lg font-medium text-gray-900 whitespace-pre-wrap">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {["A", "B", "C", "D"].map((option) => {
                const optionText = currentQuestion[`option${option}` as keyof CBTQuestion] as string;
                const isSelected = answers[currentQuestion.id] === option;
                const isCorrect = currentQuestion.correctAnswer === option;

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "bg-sh-green-50 border-sh-green-500"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                          isSelected
                            ? "bg-sh-green-500 text-white border-sh-green-500"
                            : "bg-white text-gray-600 border-gray-300"
                        } border-2`}
                      >
                        {option}
                      </div>
                      <span className="text-gray-900">{optionText}</span>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-sh-green-500 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation (show after answer in practice mode) */}
            {currentQuestion.explanation && answers[currentQuestion.id] && session.mode === "PRACTICE" && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 mb-1">Explanation</p>
                    <p className="text-blue-700 text-sm">{currentQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleFlag(currentQuestion.id)}>
              <Flag className={`w-4 h-4 mr-2 ${flagged.has(currentQuestion.id) ? "text-yellow-500" : ""}`} />
              {flagged.has(currentQuestion.id) ? "Unflag" : "Flag"}
            </Button>

            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                className="bg-green-600 hover:bg-green-700"
                disabled={Object.keys(answers).length === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Test
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Pause Modal */}
        {isPaused && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="p-6 text-center">
                <Pause className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Test Paused</h2>
                <p className="text-gray-600 mb-6">
                  The timer has been paused. Your progress is saved automatically.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={handlePause}>
                    Resume
                  </Button>
                  <Button onClick={() => router.push("/dashboard/student/study")}>
                    Exit Test
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
