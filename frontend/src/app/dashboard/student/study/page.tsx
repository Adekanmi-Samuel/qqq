"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth/CookieAuthProvider";
import { Loader2, Search, BookOpen, Brain, CheckCircle2, XCircle, ArrowRight, RefreshCcw, Award } from "lucide-react";
import { API_URL } from "@/lib/config";


const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", 
  "Biology", "Economics", "Government", "Literature in English",
  "Agricultural Science", "Civic Education"
];

const EXAM_BODIES = ["WAEC", "JAMB", "NECO", "COMMON_ENTRANCE"];

export default function StudentStudyPage() {
  // cookie auth: token always null
  const [activeTab, setActiveTab] = useState<"practice" | "explain">("practice");

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-fraunces font-bold text-brand-ink">AI Study Assistant</h1>
        <p className="text-gray-500 font-sans mt-1">Practice past questions or get topics explained instantly.</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "practice" ? "bg-white text-schoolhub-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Practice Questions
        </button>
        <button
          onClick={() => setActiveTab("explain")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "explain" ? "bg-white text-schoolhub-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Explain a Topic
        </button>
      </div>

      {activeTab === "practice" ? <PracticeTab /> : <ExplainTab />}
    </div>
  );
}

function PracticeTab() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [examBody, setExamBody] = useState(EXAM_BODIES[0]);
  const [topic, setTopic] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showResults, setShowResults] = useState(false);

  const startPractice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/generate-past-questions`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, classLevel: "SS3", topic, examBody, count: 10 }),
      });
      const data = await res.json();
      if (data.success && data.data.questions) {
        setQuestions(data.data.questions);
        setCurrentIndex(0);
        setScore(0);
        setAnswered({});
        setShowResults(false);
        setFeedback(null);
      }
    } catch (e) {
      alert("Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionKey: string) => {
    if (answered[currentIndex]) return;
    
    const q = questions[currentIndex];
    const isCorrect = optionKey === q.answer;
    
    setAnswered(prev => ({ ...prev, [currentIndex]: optionKey }));
    setFeedback(isCorrect ? "correct" : "wrong");
    
    if (isCorrect) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    setFeedback(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setShowResults(true);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Brain className="w-12 h-12 animate-pulse mx-auto text-schoolhub-500 mb-4" />
        <h3 className="font-fraunces text-xl font-semibold text-gray-900">Generating your questions...</h3>
        <p className="text-gray-500 font-sans mt-2">AI is preparing your practice session.</p>
      </div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    let grade = "F9";
    if (percentage >= 75) grade = "A1 - Excellent!";
    else if (percentage >= 65) grade = "B2 - Very Good!";
    else if (percentage >= 50) grade = "C6 - Credit";
    else if (percentage >= 40) grade = "E8 - Pass";

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
        <h2 className="text-2xl font-fraunces font-bold text-gray-900 mb-2">Practice Complete</h2>
        <div className="text-6xl font-fraunces font-bold text-schoolhub-600 my-6">{score}/{questions.length}</div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-schoolhub-50 text-schoolhub-700 font-semibold mb-8">
          <Award className="w-5 h-5" /> {grade}
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setQuestions([])} className="px-6 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Setup New Practice
          </button>
          <button onClick={startPractice} className="px-6 py-2.5 bg-schoolhub-600 text-white rounded-xl font-semibold hover:bg-schoolhub-700 transition-colors inline-flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> Practice Again
          </button>
        </div>
      </div>
    );
  }

  if (questions.length > 0) {
    const q = questions[currentIndex];
    const isAnswered = !!answered[currentIndex];
    const selected = answered[currentIndex];

    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm font-semibold text-gray-400 font-sans uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</div>
          <div className="text-sm font-semibold text-schoolhub-600 bg-schoolhub-50 px-3 py-1 rounded-full">{subject} - {examBody}</div>
        </div>

        <h3 className="text-xl font-sans font-semibold text-brand-ink mb-8 leading-relaxed">
          {q.question}
        </h3>

        <div className="space-y-3">
          {Object.entries(q.options).map(([key, text]) => {
            let btnClass = "border-gray-200 hover:border-schoolhub-400 hover:bg-schoolhub-50";
            if (isAnswered) {
              if (key === q.answer) btnClass = "border-green-500 bg-green-50 text-green-900";
              else if (key === selected) btnClass = "border-red-500 bg-red-50 text-red-900";
              else btnClass = "border-gray-100 opacity-50";
            } else if (selected === key) {
              btnClass = "border-amber-500 bg-amber-50"; // Selection lock highlight
            }

            return (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={isAnswered}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}
                style={{ minHeight: '52px' }}
              >
                <span className="font-bold shrink-0">{key}.</span>
                <span className="font-sans text-gray-800">{text as React.ReactNode}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 animate-fade-in ${feedback === 'correct' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
            {feedback === 'correct' ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold">{feedback === 'correct' ? 'Correct!' : 'Incorrect'}</p>
              <p className="text-sm mt-1 opacity-90">{q.explanation}</p>
            </div>
          </div>
        )}

        {isAnswered && (
          <div className="mt-8 flex justify-end">
            <button onClick={nextQuestion} className="bg-schoolhub-600 hover:bg-schoolhub-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Body</label>
          <select value={examBody} onChange={e => setExamBody(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50">
            {EXAM_BODIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Topic (Optional)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Quadratic Equations"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50"
          />
        </div>
      </div>
      <button onClick={startPractice} className="w-full bg-brand-ink text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-colors shadow-sm">
        Start Practice Session
      </button>
    </div>
  );
}

function ExplainTab() {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const explainTopic = async (overrideTopic?: string) => {
    const t = overrideTopic || topic;
    if (!t) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/explain-topic`, {
        method: "POST",
        credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, classLevel: "SS3", topic: t, question }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (e) {
      alert("Failed to explain topic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic to Explain</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50"
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Question (Optional)</label>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="e.g. Why do plants need sunlight?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-schoolhub-400 font-sans bg-gray-50/50"
          />
        </div>
        <button 
          onClick={() => explainTopic()}
          disabled={!topic || loading}
          className="w-full bg-brand-ink text-white py-3.5 rounded-xl font-semibold hover:bg-gray-900 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Explain this"}
        </button>
      </div>

      {result && !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm animate-fade-in">
          <h2 className="text-2xl font-fraunces font-bold text-gray-900 mb-6">{result.title}</h2>
          
          <div 
            className="prose prose-sm sm:prose-base max-w-none prose-p:text-gray-600 prose-headings:font-fraunces prose-li:text-gray-600 mb-8"
            dangerouslySetInnerHTML={{ __html: result.explanation }}
          />

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-8">
            <p className="text-amber-900 font-sans">
              <span className="font-bold">💡 Remember:</span> {result.memoryTip}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Related Topics</h4>
            <div className="flex flex-wrap gap-2">
              {result.relatedTopics?.map((t: string) => (
                <button
                  key={t}
                  onClick={() => { setTopic(t); setQuestion(""); explainTopic(t); }}
                  className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
