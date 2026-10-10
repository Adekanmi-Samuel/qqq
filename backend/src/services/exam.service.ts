import { prisma } from "../lib/prisma";

export class ExamService {
  /**
   * POST /api/exams — create exam
   */
  async create(data: {
    schoolId: string;
    title: string;
    instructions?: string;
    duration: number;
    classArmId: string;
    subjectId: string;
    session: string;
    term: number;
  }) {
    return prisma.exam.create({ data });
  }

  /**
   * PUT /api/exams/:id — update exam (except questions)
   */
  async update(id: string, data: {
    title?: string;
    instructions?: string;
    duration?: number;
    active?: boolean;
  }) {
    return prisma.exam.update({ where: { id }, data });
  }

  /**
   * GET /api/exams — list exams, optionally filtered by classArmId
   */
  async list(schoolId: string, classArmId?: string) {
    const where: any = { schoolId };
    if (classArmId) where.classArmId = classArmId;

    return prisma.exam.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        arm: {
          select: { id: true, name: true, class: { select: { name: true } } },
        },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * GET /api/exams/:id — get exam with questions
   */
  async getById(id: string, includeAnswers = false) {
    const selectFields = includeAnswers
      ? { id: true, examId: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, correctAnswer: true, marks: true }
      : { id: true, examId: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true };

    return prisma.exam.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true } },
        arm: { select: { id: true, name: true, class: { select: { name: true } } } },
        questions: { select: selectFields, orderBy: { id: "asc" } },
      },
    });
  }

  /**
   * POST /api/exams/:id/questions — add question
   */
  async addQuestion(examId: string, data: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    marks?: number;
  }) {
    const question = await prisma.examQuestion.create({
      data: { examId, ...data, marks: data.marks ?? 1 },
    });

    // Update total marks
    const agg = await prisma.examQuestion.aggregate({
      where: { examId },
      _sum: { marks: true },
    });
    await prisma.exam.update({
      where: { id: examId },
      data: { totalMarks: agg._sum.marks ?? 0 },
    });

    return question;
  }

  /**
   * POST /api/exams/questions/:id/bulk — add multiple questions at once
   */
  async bulkAddQuestions(examId: string, questions: Array<{
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    marks?: number;
  }>) {
    const created = await prisma.examQuestion.createMany({
      data: questions.map(q => ({
        examId,
        ...q,
        marks: q.marks ?? 1,
      })),
    });

    // Update total marks
    const agg = await prisma.examQuestion.aggregate({
      where: { examId },
      _sum: { marks: true },
    });
    await prisma.exam.update({
      where: { id: examId },
      data: { totalMarks: agg._sum.marks ?? 0 },
    });

    return created;
  }

  /**
   * DELETE /api/exams/questions/:id — remove question
   */
  async deleteQuestion(questionId: string) {
    const question = await prisma.examQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) throw { statusCode: 404, message: "Question not found." };

    await prisma.examQuestion.delete({ where: { id: questionId } });

    // Update total marks
    const agg = await prisma.examQuestion.aggregate({
      where: { examId: question.examId },
      _sum: { marks: true },
    });
    await prisma.exam.update({
      where: { id: question.examId },
      data: { totalMarks: agg._sum.marks ?? 0 },
    });

    return { message: "Question deleted." };
  }

  /**
   * POST /api/exams/:id/submit — submit student answers
   */
  async submitExam(examId: string, studentId: string, answers: Record<string, string>) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });
    if (!exam) throw { statusCode: 404, message: "Exam not found." };
    if (!exam.active) throw { statusCode: 400, message: "Exam is no longer active." };

    let score = 0;
    const total = exam.questions.reduce((s, q) => s + q.marks, 0);

    for (const q of exam.questions) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && studentAnswer.toUpperCase() === q.correctAnswer) {
        score += q.marks;
      }
    }

    const attempt = await prisma.examAttempt.upsert({
      where: { examId_studentId: { examId, studentId } },
      create: {
        examId,
        studentId,
        score,
        total,
        answers,
        submittedAt: new Date(),
      },
      update: {
        score,
        total,
        answers,
        submittedAt: new Date(),
      },
    });

    return attempt;
  }

  /**
   * GET /api/exams/:id/attempts — get attempts for an exam
   */
  async getAttempts(examId: string) {
    return prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
      orderBy: { score: "desc" },
    });
  }

  /**
   * GET /api/exams/student/:studentId — get exams for a student
   */
  async getStudentExams(studentId: string) {
    // Get student's class arm
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { armId: true, schoolId: true },
    });
    if (!student) throw { statusCode: 404, message: "Student not found." };

    const exams = await prisma.exam.findMany({
      where: {
        classArmId: student.armId!,
        active: true,
      },
      include: {
        subject: { select: { id: true, name: true, shortCode: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId },
          select: { score: true, total: true, submittedAt: true },
        },
      },
    });

    return exams;
  }
}

export const examService = new ExamService();
