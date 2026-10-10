import { prisma } from "../lib/prisma";

export interface CBTSubjectData {
  name: string;
  code: string;
  examTypes: string[];
  description?: string;
}

export interface CBTTopicData {
  subjectId: string;
  name: string;
  description?: string;
  yearRange?: string;
}

export interface CBTQuestionData {
  subjectId: string;
  topicId?: string;
  examType: string;
  year: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  marks?: number;
  tags?: string[];
  source?: string;
}

export interface CBTAttemptData {
  studentId: string;
  subjectId: string;
  topicId?: string;
  examType: string;
  year?: number;
  mode: "PRACTICE" | "MOCK" | "TIMED";
  questionIds: string[];
  timeLimit?: number;
}

export interface CBTSessionData {
  studentId: string;
  subjectId: string;
  examType: string;
  mode: "PRACTICE" | "MOCK" | "TIMED";
  questionCount: number;
  timeLimit?: number;
  questionIds: string[];
}

export class CBTService {
  // ===== CBT Subject =====
  async createSubject(schoolId: string, data: CBTSubjectData) {
    return prisma.cBTSubject.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  async getSubjects(schoolId: string, examType?: string) {
    return prisma.cBTSubject.findMany({
      where: {
        schoolId,
        active: true,
        ...(examType ? { examTypes: { has: examType } } : {}),
      },
      include: {
        _count: {
          select: { topics: true, questions: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getSubjectById(id: string, schoolId: string) {
    return prisma.cBTSubject.findFirst({
      where: { id, schoolId },
      include: {
        topics: {
          orderBy: { name: "asc" },
        },
      },
    });
  }

  async updateSubject(id: string, schoolId: string, data: Partial<CBTSubjectData>) {
    const existing = await prisma.cBTSubject.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Subject not found");
    return prisma.cBTSubject.update({
      where: { id },
      data,
    });
  }

  async deleteSubject(id: string, schoolId: string) {
    const existing = await prisma.cBTSubject.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Subject not found");
    return prisma.cBTSubject.delete({
      where: { id },
    });
  }

  // ===== CBT Topic =====
  async createTopic(schoolId: string, data: CBTTopicData) {
    return prisma.cBTTopic.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  async getTopics(schoolId: string, subjectId: string) {
    return prisma.cBTTopic.findMany({
      where: { schoolId, subjectId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getTopicById(id: string, schoolId: string) {
    return prisma.cBTTopic.findFirst({
      where: { id, schoolId },
    });
  }

  async updateTopic(id: string, schoolId: string, data: Partial<CBTTopicData>) {
    const existing = await prisma.cBTTopic.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Topic not found");
    return prisma.cBTTopic.update({
      where: { id },
      data,
    });
  }

  async deleteTopic(id: string, schoolId: string) {
    const existing = await prisma.cBTTopic.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Topic not found");
    return prisma.cBTTopic.delete({
      where: { id },
    });
  }

  // ===== CBT Question =====
  async createQuestion(schoolId: string, data: CBTQuestionData) {
    return prisma.cBTQuestion.create({
      data: {
        ...data,
        schoolId,
      },
    });
  }

  async bulkCreateQuestions(schoolId: string, questions: CBTQuestionData[]) {
    return prisma.cBTQuestion.createMany({
      data: questions.map((q) => ({ ...q, schoolId })),
      skipDuplicates: true,
    });
  }

  async getQuestions(
    schoolId: string,
    filters: {
      subjectId?: string;
      topicId?: string;
      examType?: string;
      year?: number;
      difficulty?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { subjectId, topicId, examType, year, difficulty, limit = 50, offset = 0 } = filters;

    const [questions, total] = await Promise.all([
      prisma.cBTQuestion.findMany({
        where: {
          schoolId,
          active: true,
          ...(subjectId ? { subjectId } : {}),
          ...(topicId ? { topicId } : {}),
          ...(examType ? { examType } : {}),
          ...(year ? { year } : {}),
          ...(difficulty ? { difficulty } : {}),
        },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, name: true } },
        },
        orderBy: [{ examType: "asc" }, { year: "desc" }, { questionNumber: "asc" }],
        take: limit,
        skip: offset,
      }),
      prisma.cBTQuestion.count({
        where: {
          schoolId,
          active: true,
          ...(subjectId ? { subjectId } : {}),
          ...(topicId ? { topicId } : {}),
          ...(examType ? { examType } : {}),
          ...(year ? { year } : {}),
          ...(difficulty ? { difficulty } : {}),
        },
      }),
    ]);

    return { questions, total };
  }

  async getQuestionById(id: string, schoolId: string) {
    return prisma.cBTQuestion.findFirst({
      where: { id, schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, name: true } },
      },
    });
  }

  async getRandomQuestions(
    schoolId: string,
    subjectId: string,
    count: number,
    filters?: { examType?: string; year?: number; topicId?: string; difficulty?: string }
  ) {
    const questions = await prisma.cBTQuestion.findMany({
      where: {
        schoolId,
        subjectId,
        active: true,
        ...(filters?.examType ? { examType: filters.examType } : {}),
        ...(filters?.year ? { year: filters.year } : {}),
        ...(filters?.topicId ? { topicId: filters.topicId } : {}),
        ...(filters?.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctAnswer: true,
        explanation: true,
        difficulty: true,
        marks: true,
        examType: true,
        year: true,
        questionNumber: true,
      },
      take: count * 3, // Get more than needed for random selection
    });

    // Shuffle and return requested count
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async getQuestionStats(schoolId: string, subjectId: string) {
    const stats = await prisma.cBTQuestion.groupBy({
      by: ["examType", "year", "difficulty"],
      where: { schoolId, subjectId, active: true },
      _count: true,
    });

    return stats;
  }

  async updateQuestion(id: string, schoolId: string, data: Partial<CBTQuestionData>) {
    const existing = await prisma.cBTQuestion.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Question not found");
    return prisma.cBTQuestion.update({
      where: { id },
      data,
    });
  }

  async deleteQuestion(id: string, schoolId: string) {
    const existing = await prisma.cBTQuestion.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!existing) throw new Error("Question not found");
    return prisma.cBTQuestion.delete({
      where: { id },
    });
  }

  // ===== CBT Attempt =====
  async createAttempt(schoolId: string, data: CBTAttemptData) {
    // Calculate score
    const questions = await prisma.cBTQuestion.findMany({
      where: { id: { in: data.questionIds } },
      select: { id: true, correctAnswer: true, marks: true },
    });

    let totalMarks = 0;

    for (const q of questions) {
      totalMarks += q.marks;
    }

    return prisma.cBTAttempt.create({
      data: {
        ...data,
        schoolId,
        total: totalMarks,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: data.questionIds.length,
        answers: {}, // Required field
      },
    });
  }

  async submitAttempt(
    attemptId: string,
    schoolId: string,
    answers: Record<string, string>
  ) {
    const attempt = await prisma.cBTAttempt.findFirst({
      where: { id: attemptId, schoolId },
      include: {
        question: {
          select: { id: true, correctAnswer: true, marks: true },
        },
      },
    });

    if (!attempt) throw new Error("Attempt not found");

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let score = 0;

    const q = attempt.question;
    if (q) {
      const userAnswer = answers[q.id];
      if (!userAnswer) {
        skippedCount++;
      } else if (userAnswer === q.correctAnswer) {
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
      }
    }

    return prisma.cBTAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score,
        total: attempt.total,
        correctCount,
        wrongCount,
        skippedCount,
        completedAt: new Date(),
      },
    });
  }

  async getAttempts(
    schoolId: string,
    filters: {
      studentId?: string;
      subjectId?: string;
      examType?: string;
      mode?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const { studentId, subjectId, examType, mode, limit = 20, offset = 0 } = filters;

    const [attempts, total] = await Promise.all([
      prisma.cBTAttempt.findMany({
        where: {
          schoolId,
          ...(studentId ? { studentId } : {}),
          ...(subjectId ? { subjectId } : {}),
          ...(examType ? { examType } : {}),
          ...(mode ? { mode } : {}),
        },
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true } },
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, name: true } },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.cBTAttempt.count({
        where: {
          schoolId,
          ...(studentId ? { studentId } : {}),
          ...(subjectId ? { subjectId } : {}),
          ...(examType ? { examType } : {}),
          ...(mode ? { mode } : {}),
        },
      }),
    ]);

    return { attempts, total };
  }

  async getAttemptById(id: string, schoolId: string) {
    return prisma.cBTAttempt.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, name: true } },
      },
    });
  }

  async getStudentStats(schoolId: string, studentId: string) {
    const attempts = await prisma.cBTAttempt.findMany({
      where: { schoolId, studentId },
      select: {
        examType: true,
        subjectId: true,
        score: true,
        total: true,
        correctCount: true,
        wrongCount: true,
        timeSpent: true,
        mode: true,
        startedAt: true,
      },
    });

    // Calculate stats by subject
    const subjectStats: Record<string, any> = {};
    for (const a of attempts) {
      if (!subjectStats[a.subjectId]) {
        subjectStats[a.subjectId] = {
          totalAttempts: 0,
          totalScore: 0,
          totalPossible: 0,
          correctCount: 0,
          wrongCount: 0,
          avgTimeSpent: 0,
        };
      }
      subjectStats[a.subjectId].totalAttempts++;
      subjectStats[a.subjectId].totalScore += a.score;
      subjectStats[a.subjectId].totalPossible += a.total;
      subjectStats[a.subjectId].correctCount += a.correctCount;
      subjectStats[a.subjectId].wrongCount += a.wrongCount;
      subjectStats[a.subjectId].avgTimeSpent += a.timeSpent;
    }

    // Calculate averages
    for (const key of Object.keys(subjectStats)) {
      const s = subjectStats[key];
      s.averageScore = s.totalPossible > 0 ? (s.totalScore / s.totalPossible) * 100 : 0;
      s.avgTimeSpent = s.totalAttempts > 0 ? s.avgTimeSpent / s.totalAttempts : 0;
    }

    return { attempts: attempts.length, subjectStats };
  }

  // ===== CBT Session =====
  async createSession(schoolId: string, data: CBTSessionData) {
    return prisma.cBTSession.create({
      data: {
        ...data,
        schoolId,
        status: "IN_PROGRESS",
        answers: {}, // Required field
      },
    });
  }

  async getSessionById(id: string, schoolId: string) {
    return prisma.cBTSession.findFirst({
      where: { id, schoolId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async getActiveSession(studentId: string, schoolId: string) {
    return prisma.cBTSession.findFirst({
      where: {
        studentId,
        schoolId,
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
    });
  }

  async updateSessionAnswers(
    id: string,
    schoolId: string,
    answers: Record<string, string>,
    currentQuestionIndex: number
  ) {
    const session = await prisma.cBTSession.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });
    if (!session) throw new Error("Session not found");
    return prisma.cBTSession.update({
      where: { id },
      data: { answers, currentQuestionIndex },
    });
  }

  async completeSession(id: string, schoolId: string) {
    const session = await prisma.cBTSession.findFirst({
      where: { id, schoolId },
    });

    if (!session) throw new Error("Session not found");

    // Calculate score
    const questions = await prisma.cBTQuestion.findMany({
      where: { id: { in: session.questionIds } },
      select: { id: true, correctAnswer: true, marks: true },
    });

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const sessionAnswers = session.answers as Record<string, string> || {};

    for (const q of questions) {
      const userAnswer = sessionAnswers[q.id];
      if (!userAnswer) {
        skippedCount++;
      } else if (userAnswer === q.correctAnswer) {
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
      }
    }

    // Create attempt record
    await prisma.cBTAttempt.create({
      data: {
        schoolId: session.schoolId,
        studentId: session.studentId,
        subjectId: session.subjectId,
        examType: session.examType,
        mode: session.mode,
        score,
        total: questions.reduce((sum, q) => sum + q.marks, 0),
        correctCount,
        wrongCount,
        skippedCount,
        timeSpent: Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
        answers: sessionAnswers,
        questionIds: session.questionIds,
        completedAt: new Date(),
      },
    });

    return prisma.cBTSession.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  async getStudentSessions(
    schoolId: string,
    studentId: string,
    limit = 20,
    offset = 0
  ) {
    const [sessions, total] = await Promise.all([
      prisma.cBTSession.findMany({
        where: { schoolId, studentId },
        include: {
          subject: { select: { id: true, name: true, code: true } },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.cBTSession.count({
        where: { schoolId, studentId },
      }),
    ]);

    return { sessions, total };
  }
}

export const cbtService = new CBTService();
