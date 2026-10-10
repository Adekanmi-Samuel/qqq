import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authorize } from "../middleware/auth";
import { getParam } from "../utils/getParam";
import { AuthenticatedRequest } from "../types";
import { Response } from "express";

const router = Router();

const ADMIN_BURSAR = ["SUPER_ADMIN", "SCHOOL_ADMIN", "BURSAR"] as const;

// Validation schemas
const createFeeSchema = z.object({
  studentId: z.string().uuid("Valid student ID is required."),
  amount: z.number().positive("Amount must be positive."),
  description: z.string().min(1, "Description is required."),
  term: z.number().int().min(1).max(3),
  session: z.string().min(1, "Session is required."),
});

const updateFeeSchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]).optional(),
  paymentMethod: z.string().optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  paidAt: z.string().optional(),
});

// GET /api/fees — list fee records for the school
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "School not identified." });

    const { studentId, session, term, status } = req.query;
    const where: any = { schoolId };
    if (studentId) where.studentId = studentId as string;
    if (session) where.session = session as string;
    if (term) where.term = parseInt(term as string);
    if (status) where.status = status as string;

    const fees = await prisma.feeRecord.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: fees });
  } catch (error: any) {
    console.error("[Fees] List error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch fee records." });
  }
});

// POST /api/fees — create a fee record
router.post("/", authorize(...ADMIN_BURSAR), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "School not identified." });

    const { studentId, amount, description, term, session } = createFeeSchema.parse(req.body);

    // Verify student belongs to this school
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) return res.status(404).json({ success: false, error: "Student not found in your school." });

    const fee = await prisma.feeRecord.create({
      data: {
        schoolId,
        studentId,
        amount,
        description,
        term,
        session,
        recordedById: req.user!.userId,
      },
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
    });

    res.status(201).json({ success: true, data: fee });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e: any) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    console.error("[Fees] Create error:", error);
    res.status(500).json({ success: false, error: "Failed to create fee record." });
  }
});

// PATCH /api/fees/:id — update a fee record
router.patch("/:id", authorize(...ADMIN_BURSAR), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    const id = getParam(req, "id");

    const existing = await prisma.feeRecord.findFirst({
      where: { id, schoolId: schoolId! },
    });
    if (!existing) return res.status(404).json({ success: false, error: "Fee record not found." });

    const body = updateFeeSchema.parse(req.body);
    const updateData: any = { ...body };

    // If marking as paid, auto-set paidAt
    if (body.status === "PAID" && !body.paidAt) {
      updateData.paidAt = new Date();
    }

    const fee = await prisma.feeRecord.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
    });

    res.json({ success: true, data: fee });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e: any) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    console.error("[Fees] Update error:", error);
    res.status(500).json({ success: false, error: "Failed to update fee record." });
  }
});

// DELETE /api/fees/:id — delete a fee record (admin only)
router.delete("/:id", authorize("SUPER_ADMIN", "SCHOOL_ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    const id = getParam(req, "id");

    const existing = await prisma.feeRecord.findFirst({
      where: { id, schoolId: schoolId! },
    });
    if (!existing) return res.status(404).json({ success: false, error: "Fee record not found." });

    await prisma.feeRecord.delete({ where: { id } });
    res.json({ success: true, message: "Fee record deleted." });
  } catch (error: any) {
    console.error("[Fees] Delete error:", error);
    res.status(500).json({ success: false, error: "Failed to delete fee record." });
  }
});

export default router;
