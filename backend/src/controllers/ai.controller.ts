import { callAI } from "../services/aiProvider.service";
import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import { prisma } from "../lib/prisma";
import { getParam } from "../utils/getParam";
import { sanitizeHtml } from "../utils/sanitize";
import { sendSuccess, sendError } from "../utils/response";
import { buildAssignments, buildExercises, buildLessonNoteHtml, buildMidtermFocusHtml, ensureLessonSectionsInHtml } from "../utils/lessonNoteContent";

export const aiController = {
  /**
   * POST /api/ai/generate-lesson
   * Generates a time-aware lesson note using Gemini API.
   */
  async generateLessonNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { schemeId, weekNumber, force } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;

      if (!schemeId || !weekNumber) {
        sendError(res, 422, "VALIDATION_ERROR", "schemeId and weekNumber are required.", undefined, req.requestId);
        return;
      }

      const scheme = await prisma.schemeOfWork.findUnique({
        where: { id: schemeId },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      });

      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme of work not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const weeks = scheme.weeks as Array<{ week: number; topic: string; isCompleted: boolean }>;
      const weekData = weeks.find((w: any) => w.week === weekNumber);
      if (!weekData) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Week not found in scheme.", undefined, req.requestId);
        return;
      }

      // Return cached note unless force regenerate or cache looks like thin template junk
      const existing = await prisma.lessonNote.findUnique({
        where: { schemeId_weekNumber: { schemeId, weekNumber } },
      });
      const existingText = String(existing?.content || "");
      const looksThin =
        existingText.length < 1200 ||
        /explain the concept in simple words|start by writing the definition/i.test(existingText) ||
        !/Teacher Activities/i.test(existingText) ||
        !/Student Activities/i.test(existingText);
      if (existing && !force && !looksThin) {
        sendSuccess(res, existing);
        return;
      }

      const school = await prisma.school.findUnique({ where: { id: scheme.schoolId } });
      const periodsPerWeek = (scheme as any).periodsPerWeek ?? 2;
      const minutesPerPeriod = (scheme as any).minutesPerPeriod ?? 40;

      // Always produce a complete lesson note in the required school format.
      // AI may enrich the content, but if providers fail we still ship a usable note.
      const teacherUser = req.user?.userId
        ? await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { fullName: true },
          })
        : null;

      let content = buildLessonNoteHtml({
        schoolName: school?.name || "School",
        subject: scheme.subject.name,
        classLevel: scheme.class.name,
        topic: weekData.topic,
        weekNumber,
        session: scheme.session,
        term: scheme.term,
        teacherName: teacherUser?.fullName || "Class Teacher",
        periodsPerWeek,
        minutesPerPeriod,
      });
      if (weekNumber === 5) {
        content += "\n" + buildMidtermFocusHtml(scheme.subject.name, scheme.class.name, weekData.topic);
      }

      const prompt = buildLessonPrompt({
        subject: scheme.subject.name,
        classLevel: scheme.class.name,
        topic: weekData.topic,
        weekNumber,
        title: scheme.title,
        periodsPerWeek,
        minutesPerPeriod,
      });

      try {
        const aiText = await callAI(prompt);
        if (aiText) {
          const parsed = parseAIResponse(aiText);
          const aiHtml = sanitizeHtml(parsed.lessonNoteContent || "");
          const hasTopic = aiHtml.toLowerCase().includes(String(weekData.topic || "").toLowerCase().slice(0, 12));
          const hasStructure =
            /Learning Objectives|Lesson Objectives/i.test(aiHtml) &&
            /Lesson Development|Teaching Content|Main Content/i.test(aiHtml) &&
            /Teacher Activities/i.test(aiHtml) &&
            /Student Activities/i.test(aiHtml) &&
            /Classwork/i.test(aiHtml) &&
            /Homework|Assignment/i.test(aiHtml);
          const isSubstantial = aiHtml.replace(/<[^>]+>/g, " ").trim().length >= 800;
          const isJunk = /No content generated|undefined|null|\[object Object\]|lorem ipsum/i.test(aiHtml);

          // Only replace the structured template when AI clearly produced a full lesson note.
          if (aiHtml && hasStructure && hasTopic && isSubstantial && !isJunk) {
            content = aiHtml;
          } else {
            console.warn("[AI] Lesson note rejected (incomplete template note kept). length=", aiHtml.length);
          }

          content = ensureLessonSectionsInHtml(content, {
            schoolName: school?.name || "School",
            subject: scheme.subject.name,
            classLevel: scheme.class.name,
            topic: weekData.topic,
            weekNumber,
            session: scheme.session,
            term: scheme.term,
            teacherName: teacherUser?.fullName || "Class Teacher",
            periodsPerWeek,
            minutesPerPeriod,
          });

          const exercises = Array.isArray(parsed.classroomExercises) && parsed.classroomExercises.length
            ? parsed.classroomExercises
            : buildExercises(scheme.subject.name, weekData.topic, scheme.class.name);
          const assignments = Array.isArray(parsed.homeworkAssignment) && parsed.homeworkAssignment.length
            ? parsed.homeworkAssignment
            : buildAssignments(weekData.topic, scheme.subject.name);

          const lessonNote = await prisma.lessonNote.upsert({
            where: { schemeId_weekNumber: { schemeId, weekNumber } },
            update: {
              topic: weekData.topic,
              content,
              exercises: exercises as any,
              assignments: assignments as any,
            },
            create: {
              schemeId,
              weekNumber,
              topic: weekData.topic,
              content,
              exercises: exercises as any,
              assignments: assignments as any,
            },
          });

          sendSuccess(res, lessonNote);
          return;
        }
      } catch (aiErr) {
        console.error("[AI] lesson enrichment failed, using template note:", aiErr);
      }

      const exercises = buildExercises(scheme.subject.name, weekData.topic, scheme.class.name);
      const assignments = buildAssignments(weekData.topic, scheme.subject.name);

      content = ensureLessonSectionsInHtml(content, {
        schoolName: school?.name || "School",
        subject: scheme.subject.name,
        classLevel: scheme.class.name,
        topic: weekData.topic,
        weekNumber,
        session: scheme.session,
        term: scheme.term,
        teacherName: teacherUser?.fullName || "Class Teacher",
        periodsPerWeek,
        minutesPerPeriod,
      });

      const lessonNote = await prisma.lessonNote.upsert({
        where: { schemeId_weekNumber: { schemeId, weekNumber } },
        update: {
          topic: weekData.topic,
          content,
          exercises: exercises as any,
          assignments: assignments as any,
        },
        create: {
          schemeId,
          weekNumber,
          topic: weekData.topic,
          content,
          exercises: exercises as any,
          assignments: assignments as any,
        },
      });

      sendSuccess(res, lessonNote);
    } catch (error: any) {
      console.error("[AI] Error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to generate lesson note.", undefined, req.requestId);
    }
  },

  /**
   * POST /api/ai/generate-assessment
   */
  async generateAssessment(req: AuthenticatedRequest, res: Response) {
    try {
      const { schemeId, examType, formatTemplate } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;

      if (!schemeId || !examType) {
        sendError(res, 422, "VALIDATION_ERROR", "schemeId and examType are required.", undefined, req.requestId);
        return;
      }

      const scheme = await prisma.schemeOfWork.findUnique({
        where: { id: schemeId },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          lessonNotes: { orderBy: { weekNumber: "asc" } },
        },
      });

      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const allTopics = (scheme.weeks as any[]).map((w: any) => `Week ${w.week}: ${w.topic}`);

      if (allTopics.length === 0) {
        sendError(res, 422, "VALIDATION_ERROR", "No topics found in this scheme.", undefined, req.requestId);
        return;
      }

      const prompt = buildAssessmentPrompt({
        subject: scheme.subject.name,
        classLevel: scheme.class.name,
        term: scheme.term,
        session: scheme.session,
        examType,
        taughtTopics: allTopics,
        formatTemplate: formatTemplate || null,
      });

      const aiText = await callAI(prompt);

      if (!aiText) {
        sendError(res, 503, "SERVICE_UNAVAILABLE", "AI service unavailable. All API providers exhausted.", undefined, req.requestId);
        return;
      }

      const key = examType === "midterm" ? "midtermQuestions" : "examQuestions";
      let parsed: any;
      try {
        parsed = JSON.parse(aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim());
      } catch {
        parsed = { content: aiText };
      }

      if (parsed.html) {
        parsed.html = sanitizeHtml(parsed.html);
      }

      await prisma.schemeOfWork.update({
        where: { id: schemeId },
        data: { [key]: parsed },
      });

      sendSuccess(res, parsed);
    } catch (error: any) {
      console.error("[AI] generateAssessment error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to generate assessment.", undefined, req.requestId);
    }
  },

  /**
   * POST /api/ai/complete-week
   */
  async completeWeek(req: AuthenticatedRequest, res: Response) {
    try {
      const { schemeId, weekNumber } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;

      if (!schemeId || !weekNumber) {
        sendError(res, 422, "VALIDATION_ERROR", "schemeId and weekNumber are required.", undefined, req.requestId);
        return;
      }

      const scheme = await prisma.schemeOfWork.findUnique({ where: { id: schemeId } });
      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const weeks = scheme.weeks as Array<{ week: number; topic: string; isCompleted: boolean; completedAt?: string }>;
      const updatedWeeks = weeks.map((w: any) =>
        w.week === weekNumber
          ? { ...w, isCompleted: true, completedAt: new Date().toISOString() }
          : w
      );

      await prisma.schemeOfWork.update({
        where: { id: schemeId },
        data: { weeks: updatedWeeks },
      });

      sendSuccess(res, { message: `Week ${weekNumber} marked as completed.` });
    } catch (error: any) {
      console.error("[AI] completeWeek error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to mark week as completed.", undefined, req.requestId);
    }
  },

  /**
   * GET /api/ai/curriculum-tracking
   */
  async getCurriculumTracking(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) {
        sendError(res, 400, "BAD_REQUEST", "Tenant not identified.", undefined, req.requestId);
        return;
      }

      const schemes = await prisma.schemeOfWork.findMany({
        where: { schoolId },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const tracking = schemes.map((s) => {
        const weeks = s.weeks as Array<{ week: number; topic: string; isCompleted: boolean }>;
        const totalWeeks = weeks.length;
        const completedWeeks = weeks.filter((w) => w.isCompleted).length;
        const progress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
        const currentWeekIdx = weeks.findIndex((w) => !w.isCompleted);
        const currentWeek = currentWeekIdx >= 0 ? weeks[currentWeekIdx].week : totalWeeks;
        const weeksBehind = currentWeek - (weeks.filter((w) => w.isCompleted).length + 1);

        return {
          id: s.id,
          subject: s.subject.name,
          className: s.class.name,
          title: s.title,
          session: s.session,
          term: s.term,
          totalWeeks,
          completedWeeks,
          progress,
          currentWeek,
          weeksBehind: weeksBehind > 0 ? weeksBehind : 0,
          status: completedWeeks === totalWeeks ? "completed" : "in_progress",
          updatedAt: s.updatedAt,
        };
      });

      const stats = {
        totalSchemes: tracking.length,
        completedSchemes: tracking.filter((t) => t.status === "completed").length,
        inProgress: tracking.filter((t) => t.status === "in_progress").length,
        averageProgress: tracking.length > 0
          ? Math.round(tracking.reduce((a, b) => a + b.progress, 0) / tracking.length)
          : 0,
        behind: tracking.filter((t) => t.weeksBehind > 0).length,
      };

      sendSuccess(res, { schemes: tracking, stats });
    } catch (error: any) {
      console.error("[AI] curriculumTracking error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch curriculum tracking.", undefined, req.requestId);
    }
  },

  /**
   * GET /api/ai/schemes
   */
  async listSchemes(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      const { subjectId, classId } = req.query;
      const where: any = { schoolId };
      if (subjectId) where.subjectId = subjectId as string;
      if (classId) where.classId = classId as string;

      const schemes = await prisma.schemeOfWork.findMany({
        where,
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          lessonNotes: {
            select: { id: true, weekNumber: true, topic: true, content: true, exercises: true, assignments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      sendSuccess(res, schemes);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch schemes.", undefined, req.requestId);
    }
  },

  /**
   * GET /api/ai/schemes/:id
   */
  async getScheme(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id");
      const schoolId = req.tenantId || req.user?.schoolId;
      const scheme = await prisma.schemeOfWork.findUnique({
        where: { id },
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
          lessonNotes: { orderBy: { weekNumber: "asc" } },
        },
      });
      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }
      sendSuccess(res, scheme);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch scheme.", undefined, req.requestId);
    }
  },

  /**
   * POST /api/ai/schemes
   */
  async createScheme(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      const body = req.body as Record<string, any>;
      const { subjectId, classId, title, session, term, weeks } = body;
      if (!subjectId || !classId || !title || !session || !term || !weeks) {
        sendError(res, 422, "VALIDATION_ERROR", "Missing required fields.", undefined, req.requestId);
        return;
      }
      const scheme = await prisma.schemeOfWork.create({
        data: {
          schoolId: schoolId!,
          subjectId, classId, title, session, term, weeks,
          periodsPerWeek: body.periodsPerWeek ?? 2,
          minutesPerPeriod: body.minutesPerPeriod ?? 40,
        } as any,
      });
      res.status(201);
      sendSuccess(res, scheme);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to create scheme.", undefined, req.requestId);
    }
  },

  /**
   * GET /api/ai/lesson-notes/:schemeId
   */
  async getLessonNotes(req: AuthenticatedRequest, res: Response) {
    try {
      const schemeId = getParam(req, "schemeId");
      const schoolId = req.tenantId || req.user?.schoolId;

      const scheme = await prisma.schemeOfWork.findUnique({ where: { id: schemeId } });
      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const notes = await prisma.lessonNote.findMany({
        where: { schemeId },
        orderBy: { weekNumber: "asc" },
      });
      sendSuccess(res, notes);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to fetch lesson notes.", undefined, req.requestId);
    }
  },

  /**
   * GET /api/ai/lesson-notes/:id/pdf
   */
  async downloadLessonNotePdf(req: AuthenticatedRequest, res: Response) {
    try {
      const id = getParam(req, "id");
      const note = await prisma.lessonNote.findUnique({
        where: { id },
        include: {
          scheme: {
            include: {
              subject: true,
              class: true,
              school: true,
            }
          }
        }
      });

      if (!note) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Lesson note not found.", undefined, req.requestId);
        return;
      }

      if (note.scheme.schoolId !== (req.tenantId || req.user?.schoolId)) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      const PdfPrinter = require('pdfmake');
      const htmlToPdfmake = require('html-to-pdfmake');

      // Minimal DOM shim for html-to-pdfmake (no jsdom dependency)
      const minimalWindow = {
        document: {
          createElement: (tag: string) => ({
            tagName: tag.toUpperCase(),
            style: {},
            childNodes: [],
            attributes: [],
            appendChild: function(c: any) { this.childNodes.push(c); return c; },
            setAttribute: function(n: string, v: string) { this.attributes.push({name: n, value: v}); },
            getAttribute: function(n: string) { const a = this.attributes.find((a: any) => a.name === n); return a ? a.value : null; },
          }),
          createTextNode: (text: string) => ({ nodeType: 3, textContent: text }),
          createDocumentFragment: () => ({ childNodes: [], appendChild: function(c: any) { this.childNodes.push(c); } }),
        },
      };

      const fonts = {
        Roboto: {
          normal: 'Helvetica',
          bold: 'Helvetica-Bold',
          italics: 'Helvetica-Oblique',
          bolditalics: 'Helvetica-BoldOblique'
        }
      };

      const printer = new PdfPrinter(fonts);

      const htmlContent = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>${note.scheme.school.name}</h2>
          <h3>Lesson Note: ${note.scheme.subject.name} - ${note.scheme.class.name}</h3>
          <p><strong>Week:</strong> ${note.weekNumber} | <strong>Topic:</strong> ${note.topic}</p>
        </div>
        <hr>
        ${note.content}
      `;

      const pdfContent = htmlToPdfmake(htmlContent, { window: minimalWindow });

      const docDefinition = {
        content: pdfContent,
        defaultStyle: {
          font: 'Roboto'
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="LessonNote_Week${note.weekNumber}_${note.scheme.subject.shortCode}.pdf"`);

      pdfDoc.pipe(res);
      pdfDoc.end();

    } catch (error: any) {
      console.error("[AI] Error generating PDF:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to generate PDF.", undefined, req.requestId);
    }
  },

  async generatePastQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { subject, classLevel, topic, examBody, count } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!subject || !classLevel || !examBody) {
        sendError(res, 422, "VALIDATION_ERROR", "subject, classLevel, and examBody are required.", undefined, req.requestId);
        return;
      }

      let cacheKey = `${subject}-${classLevel}-${examBody}-${topic || 'mixed'}-${count || 20}`;
      const cached = await prisma.pastQuestionCache.findUnique({
        where: { schoolId_cacheKey: { schoolId: schoolId!, cacheKey } }
      });
      if (cached && cached.expiresAt > new Date()) {
        sendSuccess(res, cached.questions);
        return;
      }

      const prompt = buildPastQuestionPrompt({ subject, classLevel, topic, examBody, count: count || 20 });
      const aiText = await callAI(prompt);
      if (!aiText) {
        sendError(res, 503, "SERVICE_UNAVAILABLE", "AI service unavailable.", undefined, req.requestId);
        return;
      }

      let parsed: any;
      try {
        const clean = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
        parsed = JSON.parse(clean);
      } catch {
        sendError(res, 500, "SERVER_ERROR", "AI returned invalid format.", undefined, req.requestId);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.pastQuestionCache.upsert({
        where: { schoolId_cacheKey: { schoolId: schoolId!, cacheKey } },
        update: { questions: parsed, expiresAt },
        create: { schoolId: schoolId!, cacheKey, questions: parsed, expiresAt }
      });

      sendSuccess(res, parsed);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to generate past questions.", undefined, req.requestId);
    }
  },

  async generateMockExam(req: AuthenticatedRequest, res: Response) {
    try {
      const { examBody, subjects, classLevel } = req.body;
      if (!examBody || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
        sendError(res, 422, "VALIDATION_ERROR", "examBody and subjects array are required.", undefined, req.requestId);
        return;
      }

      const subjectResults = await Promise.all(
        subjects.map(async (subject: string) => {
          const count = examBody === "JAMB" ? 40 : 20;
          const prompt = buildPastQuestionPrompt({ subject, classLevel: classLevel || "SS3", examBody, count });
          const aiText = await callAI(prompt);
          if (!aiText) return { subject, questions: [] };
          try {
            const clean = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
            const parsed = JSON.parse(clean);
            return { subject, questions: parsed.questions || [] };
          } catch {
            return { subject, questions: [] };
          }
        })
      );

      const duration = examBody === "JAMB" ? 100 : 90;
      sendSuccess(res, {
        examBody,
        classLevel,
        duration,
        totalQuestions: subjectResults.reduce((s: any, r: any) => s + r.questions.length, 0),
        sections: subjectResults,
      });
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to generate mock exam.", undefined, req.requestId);
    }
  },

  async generateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentName, averageScore, attendanceRate, bestSubject, weakestSubject, commentType, tone } = req.body;
      const prompt = `You are a Nigerian secondary school ${commentType === "principal" ? "principal" : "class teacher"} writing a term report card comment.\n\nStudent: ${studentName}\nAverage Score: ${averageScore}%\nAttendance: ${attendanceRate}%\nBest Subject: ${bestSubject}\nWeakest Subject: ${weakestSubject}\nTone: ${tone || "encouraging"}\n\nWrite a ${commentType === "principal" ? "principal's" : "class teacher's"} comment for this student's report card.\n\nRULES:\n- Maximum 2 sentences\n- Must mention performance and attendance\n- Must feel personal, not generic\n- Tone must be ${tone || "encouraging"}\n- Use formal Nigerian school language\n- Do not start with "I" or the student's name\n- End with a clear recommendation or wish\n\nRespond ONLY with valid JSON:\n{ "comment": "The full comment text here." }`;

      const aiText = await callAI(prompt);
      if (!aiText) {
        sendError(res, 503, "SERVICE_UNAVAILABLE", "AI unavailable.", undefined, req.requestId);
        return;
      }

      const clean = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      const parsed = JSON.parse(clean);
      sendSuccess(res, { comment: parsed.comment });
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to generate comment.", undefined, req.requestId);
    }
  },

  async explainTopic(req: AuthenticatedRequest, res: Response) {
    try {
      const { subject, topic, classLevel, question } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!subject || !topic) {
        sendError(res, 422, "VALIDATION_ERROR", "subject and topic are required.", undefined, req.requestId);
        return;
      }

      let cacheKey = `explain-${subject}-${topic}-${classLevel || 'JSS3'}`;
      const cached = await prisma.pastQuestionCache.findUnique({
        where: { schoolId_cacheKey: { schoolId: schoolId!, cacheKey } }
      });
      if (cached && cached.expiresAt > new Date()) {
        sendSuccess(res, cached.questions);
        return;
      }

      const prompt = `You are a friendly Nigerian secondary school teacher helping a ${classLevel || "JSS3"} student understand a topic.\n\nSubject: ${subject}\nTopic: ${topic}\n${question ? `Student's question: ${question}` : ""}\n\nExplain this topic clearly for a Nigerian secondary school student.\n\nRULES:\n- Use simple, clear English a Nigerian student can understand\n- Use Nigerian examples where possible (local foods, places, people, currency)\n- Break it into: simple definition -> how it works -> real-world example -> key point to remember\n- Keep the total explanation under 300 words\n- End with one memory tip or mnemonic\n\nRespond ONLY with valid JSON:\n{\n  "title": "Topic title",\n  "explanation": "The full explanation in HTML using only <p>, <ul>, <li>, <strong>",\n  "memoryTip": "One sentence memory tip or mnemonic",\n  "relatedTopics": ["Related topic 1", "Related topic 2"]\n}`;

      const aiText = await callAI(prompt);
      if (!aiText) {
        sendError(res, 503, "SERVICE_UNAVAILABLE", "AI unavailable.", undefined, req.requestId);
        return;
      }

      const clean = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      const parsed = JSON.parse(clean);

      if (parsed.explanation) {
        parsed.explanation = sanitizeHtml(parsed.explanation);
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await prisma.pastQuestionCache.upsert({
        where: { schoolId_cacheKey: { schoolId: schoolId!, cacheKey } },
        update: { questions: parsed, expiresAt },
        create: { schoolId: schoolId!, cacheKey, questions: parsed, expiresAt }
      });

      sendSuccess(res, parsed);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to explain topic.", undefined, req.requestId);
    }
  },

  async generateScheme(req: AuthenticatedRequest, res: Response) {
    try {
      const { subject, classLevel, term, session, totalWeeks } = req.body;
      if (!subject || !classLevel || !term) {
        sendError(res, 422, "VALIDATION_ERROR", "subject, classLevel, and term are required.", undefined, req.requestId);
        return;
      }

      const weeks = totalWeeks || 13;
      const prompt = `You are an expert Nigerian curriculum planner aligned to the NERDC/WAEC syllabus.\n\nGenerate a complete scheme of work for:\nSubject: ${subject}\nClass: ${classLevel}\nTerm: ${term} (First=1, Second=2, Third=3)\nSession: ${session || "2025/2026"}\nTotal Weeks: ${weeks}\n\nRULES:\n- Topics must follow the official Nigerian NERDC curriculum sequence for this subject and class\n- Week 1: Revision/Introduction\n- Week ${Math.ceil(weeks / 2)}: Midterm break (mark topic as "MID-TERM BREAK" - no lesson)\n- Week ${weeks - 1}: Revision\n- Week ${weeks}: Examinations\n- All other weeks: one clear teaching topic per week\n- Topics must build logically on each other\n\nRespond ONLY with valid JSON:\n{\n  "title": "Scheme of Work - ${subject} - ${classLevel} - Term ${term}",\n  "weeks": [\n    { "week": 1, "topic": "...", "isCompleted": false, "completedAt": null }\n  ]\n}`;

      const aiText = await callAI(prompt);
      if (!aiText) {
        sendError(res, 503, "SERVICE_UNAVAILABLE", "AI unavailable.", undefined, req.requestId);
        return;
      }

      const clean = aiText.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      const parsed = JSON.parse(clean);
      sendSuccess(res, parsed);
    } catch (error: any) {
      sendError(res, 500, "SERVER_ERROR", "Failed to generate scheme.", undefined, req.requestId);
    }
  },

  /**
   * POST /api/ai/save-midterm-questions
   */
  async saveMidtermQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { schemeId, questions } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schemeId || !questions) {
        sendError(res, 422, "VALIDATION_ERROR", "schemeId and questions are required.", undefined, req.requestId);
        return;
      }
      const scheme = await prisma.schemeOfWork.findUnique({ where: { id: schemeId } });
      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      await prisma.schemeOfWork.update({
        where: { id: schemeId },
        data: { midtermQuestions: questions },
      });
      sendSuccess(res, { message: "Midterm questions saved." });
    } catch (error: any) {
      console.error("[AI] saveMidtermQuestions error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to save midterm questions.", undefined, req.requestId);
    }
  },

  /**
   * POST /api/ai/save-exam-questions
   */
  async saveExamQuestions(req: AuthenticatedRequest, res: Response) {
    try {
      const { schemeId, questions } = req.body;
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schemeId || !questions) {
        sendError(res, 422, "VALIDATION_ERROR", "schemeId and questions are required.", undefined, req.requestId);
        return;
      }
      const scheme = await prisma.schemeOfWork.findUnique({ where: { id: schemeId } });
      if (!scheme) {
        sendError(res, 404, "RESOURCE_NOT_FOUND", "Scheme not found.", undefined, req.requestId);
        return;
      }
      if (scheme.schoolId !== schoolId) {
        sendError(res, 403, "FORBIDDEN", "Unauthorized.", undefined, req.requestId);
        return;
      }

      await prisma.schemeOfWork.update({
        where: { id: schemeId },
        data: { examQuestions: questions },
      });
      sendSuccess(res, { message: "Exam questions saved." });
    } catch (error: any) {
      console.error("[AI] saveExamQuestions error:", error);
      sendError(res, 500, "SERVER_ERROR", "Failed to save exam questions.", undefined, req.requestId);
    }
  },
};

function buildPastQuestionPrompt({ subject, classLevel, topic, examBody, count }: {
  subject: string; classLevel: string; topic?: string;
  examBody: string; count: number;
}) {
  const topicLine = topic ? `Topic: ${topic}` : `Topic: Mixed (cover key curriculum topics)`;
  const optionCount = examBody === "JAMB" ? 4 : 5;
  const optionLetters = optionCount === 4 ? "A, B, C, D" : "A, B, C, D, E";

  return `You are an expert Nigerian examination officer who has written ${examBody} questions for 20 years.

Generate ${count} multiple-choice questions in EXACTLY the style of ${examBody} for:
Subject: ${subject}
Class Level: ${classLevel}
${topicLine}
Exam Body: ${examBody}

RULES:
- Questions must match the exact difficulty and style of real ${examBody} questions
- Each question has exactly ${optionCount} options (${optionLetters})
- Questions must be based on the Nigerian curriculum (NERDC/WAEC syllabus)
- Include a mix of: recall, application, and analysis questions
- No trick questions - just realistic exam questions
- Vary difficulty: 40% easy, 40% medium, 20% hard

Respond ONLY with valid JSON. No markdown fences. No extra text:
{
  "subject": "${subject}",
  "classLevel": "${classLevel}",
  "examBody": "${examBody}",
  "questions": [
    {
      "number": 1,
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "...${optionCount === 5 ? ', "E": "..."' : ""}" },
      "answer": "A",
      "explanation": "Brief explanation of why this is correct, referencing the topic"
    }
  ]
}`;
}

/* --- Prompt Builders --- */

function buildLessonPrompt({ subject, classLevel, topic, weekNumber, title, periodsPerWeek, minutesPerPeriod }: {
  subject: string; classLevel: string; topic: string; weekNumber: number; title: string;
  periodsPerWeek: number; minutesPerPeriod: number;
}) {
  const periodNote = periodsPerWeek <= 1
    ? "This is a ONE period lesson. Do not overload it. Fit realistically into one class period."
    : `This subject is taught ${periodsPerWeek} times a week, each period ${minutesPerPeriod} minutes. Distribute content only if it genuinely needs more than one period.`;

  return `You are an experienced Nigerian secondary-school teacher writing a complete lesson note.

Write a complete, detailed, accurate, easy-to-teach lesson note for:
Subject: ${subject}
Class: ${classLevel}
Scheme title: ${title}
Term context: follow the scheme of work topic for this week
Week: ${weekNumber}
Topic: ${topic}
Duration: ${periodsPerWeek} period(s), ${minutesPerPeriod} minutes each

${periodNote}

QUALITY RULES (from Nigerian school lesson notes):
1. Follow the Nigerian secondary-school curriculum for this class level.
2. Write at the level of the stated class. Simple, clear English. No university-level content.
3. Define important terms before explaining them.
4. Use everyday Nigerian examples where useful.
5. Show calculations step by step when maths is involved.
6. Include tables when comparison helps.
7. Include likely examination points students should remember.
8. Do NOT invent unrelated topics. Stay on: ${topic}
9. Do NOT pad with fluff. Do NOT leave placeholder text like (write here) or ...
10. Content must be specific to ${subject} and ${topic}, not generic filler.

REQUIRED HTML STRUCTURE (use ONLY these tags: h1 h2 h3 h4 p ul ol li strong em table tr th td br):
<h1>${subject.toUpperCase()}</h1>
<h2>${classLevel} | ${topic} | Week ${weekNumber}</h2>
<p><strong>CLASS:</strong> ${classLevel}<br/><strong>TERM:</strong> (state term if known, else First Term)<br/><strong>WEEK:</strong> ${weekNumber}<br/><strong>TOPIC:</strong> ${topic}<br/><strong>DURATION:</strong> ${periodsPerWeek} period(s), ${minutesPerPeriod} minutes each</p>

<h3>Learning Objectives</h3>
<p>By the end of the lesson, students should be able to:</p>
<ol>
  <li>measurable objective 1</li>
  <li>measurable objective 2</li>
  <li>measurable objective 3</li>
</ol>

<h3>Previous Knowledge</h3>
<p>What students already know that connects to this lesson.</p>

<h3>Instructional Materials</h3>
<ul>
  <li>list real materials for this subject/topic</li>
</ul>

<h3>Introduction</h3>
<ol>
  <li>2-4 oral questions the teacher can ask before teaching</li>
  <li>Link the topic to students' everyday Nigerian experience</li>
</ol>

<h3>Lesson Development</h3>
<h4>Meaning / Definition</h4>
<p>Define the topic and all essential terms in simple language.</p>
<h4>Main Content</h4>
<p>Explain the major parts with clear subheadings. Include only what applies: types, characteristics, examples, causes, effects, functions, importance, uses, rules, methods, procedures, differences, applications.</p>
<ul>
  <li><strong>Key point:</strong> specific explanation for ${topic}</li>
</ul>
<p><strong>Examples:</strong></p>
<ol>
  <li>specific example for ${topic} in Nigerian context</li>
</ol>
<h4>Teacher Explanation / Demonstration</h4>
<p>How the teacher should explain, draw, calculate, pronounce, or demonstrate this topic on the board.</p>
<h4>Teacher Activities</h4>
<ol>
  <li><strong>Introduction (5 min):</strong> greet, review last lesson, introduce ${topic} with a question</li>
  <li><strong>Explanation (15-20 min):</strong> teach main content with board work and examples</li>
  <li><strong>Demonstration (10 min):</strong> work one full example step by step</li>
  <li><strong>Guided practice (10 min):</strong> class works one problem together</li>
  <li><strong>Summary (5 min):</strong> recap key points and preview next lesson</li>
</ol>
<h4>Student Activities</h4>
<ol>
  <li>Listen and take notes</li>
  <li>Answer oral questions</li>
  <li>Work in pairs on the classwork</li>
  <li>Complete evaluation questions</li>
</ol>
<h4>Class Participation</h4>
<ul>
  <li>oral questions, short calculations, board work related to ${topic}</li>
</ul>

<h3>Evaluation</h3>
<p>5 to 8 questions that check whether students understood ${topic}. Mix objective, short-answer, fill-in, true/false, or calculation as appropriate.</p>
<ol>
  <li>evaluation question</li>
</ol>

<h3>Classwork</h3>
<ol>
  <li>classwork question on ${topic}</li>
</ol>

<h3>Homework</h3>
<ol>
  <li>small realistic homework task on ${topic}</li>
</ol>

<h3>Key Points to Remember</h3>
<ul>
  <li>most important revision points for ${topic}</li>
</ul>

<h3>Teacher's Note</h3>
<ul>
  <li>common mistakes, exam points, safety notes if relevant to ${subject}</li>
</ul>

CRITICAL JSON RESPONSE FORMAT. Respond ONLY with valid JSON. No markdown fences. No extra text.
{
  "lessonNoteHtml": "<h1>...full lesson note HTML using the structure above...</h1>",
  "classroomExercises": [{ "question": "...", "answer": "..." }],
  "homeworkAssignment": [{ "question": "..." }]
}

classroomExercises: at least 5 real questions with real answers about ${topic}.
homeworkAssignment: at least 3 real homework questions about ${topic}.
Every exercise and homework item must be specific to ${subject} and ${topic}. Never return empty strings or placeholders.`;
}

function buildAssessmentPrompt({ subject, classLevel, term, session, examType, taughtTopics, formatTemplate }: {
  subject: string; classLevel: string; term: number; session: string;
  examType: string; taughtTopics: string[]; formatTemplate: string | null;
}) {
  const topicsList = taughtTopics.map((t, i) => `${i + 1}. ${t}`).join("\n");

  let formatInstruction = "";
  if (formatTemplate) {
    formatInstruction = `\nUse this specific format template for the questions:\n${formatTemplate}\n`;
  } else if (examType === "exam") {
    formatInstruction = `
Generate EXACTLY:
- 20 OBJECTIVE questions with options A through E (five options each)
- 5 THEORY questions (require written answers)

For objective questions, each MUST have exactly 5 options: A, B, C, D, E.
For theory questions, set options as an empty array [] and just provide the question and answer.`;
  } else {
    formatInstruction = `
Generate 15 objective questions with options A through D (four options each).`;
  }

  return `You are an expert Nigerian examination officer.

Generate ${examType === "midterm" ? "MIDTERM TEST" : "END OF TERM EXAMINATION"} questions for:
Subject: ${subject}
Class: ${classLevel}
Term: ${term}
Session: ${session}
Exam Type: ${examType.toUpperCase()}

ALL TOPICS IN THE SCHEME OF WORK:
${topicsList}

${formatInstruction}

CRITICAL: Respond ONLY with a valid JSON object containing these two keys (no markdown fences, no extra text):
{
  "html": "<h1>Examination</h1>...",
  "questions": [
    { "type": "objective", "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."], "answer": "..." },
    { "type": "theory", "question": "...", "options": [], "answer": "..." }
  ]
}

RULES for html:
- Use ONLY HTML tags: <h1>, <h2>, <p>, <ol>, <ul>, <li>, <strong>
- DO NOT use Markdown (#, **, *, etc)
- SECTION A: show all objective questions
- SECTION B: show all theory questions
- Include answer key at the end
- Base ALL questions strictly on the topics listed above`;
}

/* --- Response Parser --- */

function parseAIResponse(text: string) {
  let jsonStr = text.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  const codeMatch = jsonStr.match(/```\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      lessonNoteContent: sanitizeHtml(parsed.lessonNoteHtml || parsed.lessonNoteContent || parsed.html || parsed.content || ""),
      classroomExercises: Array.isArray(parsed.classroomExercises) ? parsed.classroomExercises : [],
      homeworkAssignment: Array.isArray(parsed.homeworkAssignment) ? parsed.homeworkAssignment : [],
    };
  } catch {
    return {
      lessonNoteContent: sanitizeHtml(text),
      classroomExercises: [],
      homeworkAssignment: [],
    };
  }
}
