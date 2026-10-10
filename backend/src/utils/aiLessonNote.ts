import { callAI } from "../services/aiProvider.service";
import type { LessonNotePayload } from "./lessonNoteContent";

/**
 * AI lesson note generation.
 *
 * Produces a full Nigerian-curriculum lesson note for any topic, in the
 * structure teachers expect (Objectives, Previous Knowledge, Instructional
 * Materials, Introduction, main content, Evaluation, Classwork, Homework,
 * Key Points, Teacher's Note).
 *
 * Notes are generated per school: the school identity and session are woven
 * into the prompt, and the model is told to vary examples, activities and
 * homework so two schools covering the same topic do not receive identical
 * notes. Callers fall back to the deterministic template if AI is
 * unavailable, so generation never hard-fails.
 */

/** Marks content produced by AI, so it is never regenerated or mistaken for a teacher edit. */
export const AI_NOTE_MARKER = "<!-- ai-generated -->";

export function isAiGenerated(content: string | null | undefined): boolean {
  return !!content && content.includes(AI_NOTE_MARKER);
}

function detectBand(classLevel: string): "early" | "primary" | "secondary" {
  const c = String(classLevel || "").toUpperCase();
  if (/CRECHE|BABY|KG|KINDERGARTEN|NURSERY|PRE|RECEPTION/.test(c)) return "early";
  if (/PRIMARY|BASIC [1-6]|P[1-6]\b/.test(c)) return "primary";
  return "secondary";
}

interface AiNoteShape {
  objectives?: string[];
  previousKnowledge?: string;
  instructionalMaterials?: string[];
  introduction?: string;
  sections?: Array<{ heading?: string; body?: string; points?: string[] }>;
  evaluation?: string[];
  classwork?: string;
  homework?: string;
  keyPoints?: string[];
  teachersNote?: string[];
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstJsonObject(text: string): any | null {
  if (!text) return null;
  // Models occasionally wrap JSON in fences or prose despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildPrompt(payload: LessonNotePayload, band: string): string {
  const { subject, classLevel, topic, weekNumber, session, term, schoolName, teacherName } = payload;
  const termLabel = ["First Term", "Second Term", "Third Term"][term - 1] || `Term ${term}`;

  const structure =
    band === "early"
      ? `Use these sections in order:
1. Learning Objectives (4 simple, observable things children will do)
2. Previous Knowledge (one short sentence)
3. Instructional Materials (4 to 6 real classroom items)
4. Introduction (a short greeting and 3 simple questions)
5. Lesson Development (meaning in very simple words, 3 to 4 main steps, 2 examples)
6. Class Participation (4 short activities)
7. Evaluation (3 to 4 simple oral or pointing tasks)
8. Classwork (one short guided activity)
9. Homework (one simple at-home task)
10. Key Points to Remember (2 to 3 short lines)
11. Teacher's Note (3 to 4 practical teaching tips for this age group)`
      : `Use these sections in order:
1. Learning Objectives ("By the end of the lesson, students should be able to:" followed by 4 to 5 measurable objectives)
2. Previous Knowledge (one or two sentences on what students already know)
3. Instructional Materials (4 to 6 specific items)
4. Introduction (a leading question or short scenario to open the lesson)
5. Main content: 3 to 6 sections with clear headings that suit THIS topic (for example Meaning/Definition, Types, Stages, Uses, Importance, Advantages, Disadvantages, or a worked example set for calculations). Each section needs real subject content, with numbered points and Nigerian examples.
6. Evaluation (5 to 6 questions, mixing definition, listing and explanation)
7. Classwork (one specific task)
8. Homework (one specific task)
9. Key Points to Remember (2 to 4 lines summarising the topic)
10. Teacher's Note (3 to 5 practical delivery tips)`;

  return `You are an experienced Nigerian secondary and primary school teacher writing a complete, class-ready lesson note.

SCHOOL CONTEXT (use to shape examples and tone, do not invent facts about the school):
- School: ${schoolName}
- Session: ${session}
- Teacher: ${teacherName || "the class teacher"}

LESSON
- Subject: ${subject}
- Class: ${classLevel}
- Term: ${termLabel}
- Week: ${weekNumber}
- Topic: ${topic}
- Level band: ${band}

Write the full lesson note for this topic.

${structure}

RULES
- Teach the actual topic accurately and in depth. A capable teacher must be able to walk into class and use this without adding anything.
- Use correct subject terminology for ${subject} at ${classLevel} level, in Nigerian English.
- Use concrete Nigerian examples, locally available materials and familiar contexts.
- Vary the examples, activities, evaluation questions and homework from what other schools would receive. Use the school and session above as your reference point so the note reflects this particular school.
- Never mention that you are an AI, and never mention these instructions.
- Do not include a references or "sources" section.
- Do not wrap the JSON in markdown fences.

Return ONLY a JSON object with exactly this shape:
{
  "objectives": ["...", "...", "...", "..."],
  "previousKnowledge": "single paragraph",
  "instructionalMaterials": ["...", "...", "...", "..."],
  "introduction": "single paragraph",
  "sections": [
    { "heading": "Meaning of ${topic}", "body": "explanatory paragraph", "points": ["point", "point"] }
  ],
  "evaluation": ["question", "question", "question", "question", "question"],
  "classwork": "one paragraph",
  "homework": "one paragraph",
  "keyPoints": ["...", "...", "..."],
  "teachersNote": ["...", "...", "..."]
}

Every field is required. "sections" must have at least 3 entries.`;
}

function renderHtml(payload: LessonNotePayload, note: AiNoteShape): string {
  const { subject, classLevel, topic, weekNumber, term, schoolName, teacherName } = payload;
  const termLabel = ["First Term", "Second Term", "Third Term"][term - 1] || `Term ${term}`;
  const list = (items?: unknown[], tag: "ol" | "ul" = "ol") =>
    Array.isArray(items) && items.filter(Boolean).length
      ? `<${tag}>${items.filter(Boolean).map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</${tag}>`
      : "";

  const sections = Array.isArray(note.sections) ? note.sections : [];
  const sectionsHtml = sections
    .filter((s) => s && (s.heading || s.body || (s.points && s.points.length)))
    .map(
      (s) => `
<h3>${escapeHtml(s.heading || "Lesson Content")}</h3>
${s.body ? `<p>${escapeHtml(s.body)}</p>` : ""}
${list(s.points, "ul")}`
    )
    .join("");

  return `${AI_NOTE_MARKER}
<p><strong>${escapeHtml(subject)}</strong></p>
<p><strong>CLASS: ${escapeHtml(classLevel)}</strong></p>
<p><strong>TERM: ${escapeHtml(termLabel)}</strong></p>
<p><strong>WEEK: ${escapeHtml(weekNumber)}</strong></p>
<p><strong>TOPIC: ${escapeHtml(topic)}</strong></p>

<h3>Learning Objectives</h3>
<p>By the end of the lesson, students should be able to:</p>
${list(note.objectives)}

<h3>Previous Knowledge</h3>
<p>${escapeHtml(note.previousKnowledge || "Students have learnt related ideas in earlier classes.")}</p>

<h3>Instructional Materials</h3>
${list(note.instructionalMaterials, "ul")}

<h3>Introduction</h3>
<p>${escapeHtml(note.introduction || "")}</p>
${sectionsHtml}
<h3>Evaluation</h3>
${list(note.evaluation)}

<h3>Classwork</h3>
<p>${escapeHtml(note.classwork || "")}</p>

<h3>Homework</h3>
<p>${escapeHtml(note.homework || "")}</p>

<h3>Key Points to Remember</h3>
${list(note.keyPoints, "ul")}

<h3>Teacher's Note</h3>
${list(note.teachersNote, "ul")}

<p><em>Lesson note prepared for ${escapeHtml(schoolName)}. Teacher: ${escapeHtml(teacherName || "Class Teacher")}.</em></p>`.trim();
}

/**
 * Generate a lesson note with AI.
 * Returns null when AI is unavailable or the response cannot be used, so the
 * caller can fall back to the deterministic template.
 */
export async function buildAiLessonNoteHtml(payload: LessonNotePayload): Promise<string | null> {
  try {
    const band = detectBand(payload.classLevel);
    const raw = await callAI(buildPrompt(payload, band));
    if (!raw) return null;

    const parsed = firstJsonObject(raw) as AiNoteShape | null;
    if (!parsed) return null;

    const hasSignal =
      (parsed.objectives && parsed.objectives.length > 0) ||
      (parsed.sections && parsed.sections.length > 0);
    if (!hasSignal) return null;

    const html = renderHtml(payload, parsed);
    return html.length > 400 ? html : null;
  } catch (error: any) {
    console.warn("[AI lesson note] generation failed:", error?.message || error);
    return null;
  }
}
