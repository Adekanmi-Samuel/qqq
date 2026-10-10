import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authorize } from "../middleware/auth";
import { getParam } from "../utils/getParam";
import { AuthenticatedRequest } from "../types";
import { Response } from "express";

const router = Router();

const ADMIN_BURSAR = ["SUPER_ADMIN", "SCHOOL_ADMIN", "BURSAR"] as const;

const createPaymentSchema = z.object({
  studentId: z.string().uuid("Valid student ID is required."),
  amount: z.number().positive("Amount must be positive."),
  feeItemId: z.string().uuid().optional(),
  session: z.string().min(1, "Session is required."),
  channel: z.enum(["cash", "transfer", "pos", "card", "other"]),
  reference: z.string().optional(),
});

const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  channel: z.enum(["cash", "transfer", "pos", "card", "other"]).optional(),
  reference: z.string().optional(),
});

// GET /api/payments — list payments for the school
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "School not identified." });

    const { studentId, session } = req.query;
    const where: any = { schoolId };
    if (studentId) where.studentId = studentId as string;
    if (session) where.session = session as string;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: payments });
  } catch (error: any) {
    console.error("[Payments] List error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch payments." });
  }
});

// POST /api/payments — record a manual payment
router.post("/", authorize(...ADMIN_BURSAR), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    if (!schoolId) return res.status(400).json({ success: false, error: "School not identified." });

    const { studentId, amount, feeItemId, session, channel, reference } = createPaymentSchema.parse(req.body);

    // Verify student belongs to this school
    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) return res.status(404).json({ success: false, error: "Student not found in your school." });

    // If feeItemId provided, verify it belongs to this school and student
    let feeRecord: any = null;
    if (feeItemId) {
      feeRecord = await prisma.feeRecord.findFirst({
        where: { id: feeItemId, schoolId, studentId },
      });
      if (!feeRecord) return res.status(404).json({ success: false, error: "Fee record not found." });
    }

    // Create payment record
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          schoolId,
          studentId,
          feeItemId,
          amount,
          reference: reference || `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: "success",
          channel,
          paidAt: new Date(),
          session,
        },
        include: {
          student: { select: { id: true, fullName: true, admissionNumber: true } },
        },
      });

      // If feeItemId provided, update the fee record status
      if (feeItemId && feeRecord) {
        // Calculate total paid for this fee record
        const totalPaid = await tx.payment.aggregate({
          where: { feeItemId, schoolId, status: "success" },
          _sum: { amount: true },
        });
        const paidAmount = Number(totalPaid._sum.amount || 0);

        let newStatus: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED" = "PENDING";
        if (paidAmount >= feeRecord.amount) newStatus = "PAID";
        else if (paidAmount > 0) newStatus = "PARTIAL";

        await tx.feeRecord.update({
          where: { id: feeItemId },
          data: { status: newStatus, paidAt: newStatus === "PAID" ? new Date() : null },
        });
      }

      return newPayment;
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e: any) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    console.error("[Payments] Create error:", error);
    res.status(500).json({ success: false, error: "Failed to record payment." });
  }
});

// PATCH /api/payments/:id — update a payment record (admin only)
router.patch("/:id", authorize("SUPER_ADMIN", "SCHOOL_ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.tenantId || req.user?.schoolId;
    const id = getParam(req, "id");

    const existing = await prisma.payment.findFirst({
      where: { id, schoolId: schoolId! },
    });
    if (!existing) return res.status(404).json({ success: false, error: "Payment not found." });

    const body = updatePaymentSchema.parse(req.body);

    const payment = await prisma.payment.update({
      where: { id },
      data: body,
      include: {
        student: { select: { id: true, fullName: true, admissionNumber: true } },
      },
    });

    res.json({ success: true, data: payment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e: any) => e.message).join(" ");
      return res.status(400).json({ success: false, error: messages });
    }
    console.error("[Payments] Update error:", error);
    res.status(500).json({ success: false, error: "Failed to update payment." });
  }
});

export default router;