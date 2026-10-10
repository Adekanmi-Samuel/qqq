import { Response } from "express";
import { z } from "zod";
import { complianceService } from "../services/compliance.service";
import { AuthenticatedRequest } from "../types";

type ComplianceReportType =
  | "STUDENT_NOMINAL_ROLL"
  | "STAFF_NOMINAL_ROLL"
  | "ATTENDANCE_SUMMARY"
  | "FEE_COLLECTION_REPORT"
  | "EXAM_REGISTRATION_SUMMARY"
  | "INFRASTRUCTURE_CHECKLIST";

export class ComplianceController {
  /**
   * POST /api/compliance/generate — Generate a compliance report
   */
  async generateReport(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { reportType, filters, save, title, description } = req.body;
      if (!reportType) return res.status(400).json({ success: false, error: "reportType is required" });

      let report: any;

      switch (reportType) {
        case "STUDENT_NOMINAL_ROLL":
          report = await complianceService.generateStudentNominalRoll(schoolId, filters || {});
          break;
        case "STAFF_NOMINAL_ROLL":
          report = await complianceService.generateStaffNominalRoll(schoolId);
          break;
        case "ATTENDANCE_SUMMARY":
          report = await complianceService.generateAttendanceSummary(schoolId, filters || {});
          break;
        case "FEE_COLLECTION_REPORT":
          report = await complianceService.generateFeeCollectionReport(schoolId, filters || {});
          break;
        case "EXAM_REGISTRATION_SUMMARY":
          report = await complianceService.generateExamRegistrationSummary(schoolId, filters || {});
          break;
        case "INFRASTRUCTURE_CHECKLIST":
          report = await complianceService.generateInfrastructureChecklist(schoolId);
          break;
        default:
          return res.status(400).json({ success: false, error: "Invalid report type" });
      }

      // Save if requested
      if (save && req.user?.userId) {
        report = await complianceService.saveReport(
          schoolId,
          reportType,
          title || report.title,
          description,
          report,
          req.user.userId
        );
      }

      res.json({ success: true, data: report });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message || "Failed to generate report" });
    }
  }

  /**
   * POST /api/compliance/reports — Save a generated report
   */
  async saveReport(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      const userId = req.user?.userId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });
      if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

      const { reportType, title, description, data } = req.body;
      if (!reportType || !data) {
        return res.status(400).json({ success: false, error: "reportType and data are required" });
      }

      const report = await complianceService.saveReport(
        schoolId,
        reportType,
        title,
        description,
        data,
        userId
      );

      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to save report" });
    }
  }

  /**
   * GET /api/compliance/reports — Get saved reports
   */
  async getReports(req: AuthenticatedRequest, res: Response) {
    try {
      const schoolId = req.tenantId || req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ success: false, error: "Tenant not identified." });

      const { reportType, limit, offset } = req.query;
      const result = await complianceService.getReports(
        schoolId,
        reportType as ComplianceReportType | undefined,
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );

      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch reports" });
    }
  }

  /**
   * GET /api/compliance/reports/:id — Get report by ID
   */
  async getReportById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = await complianceService.getReportById(id as string);
      if (!report) return res.status(404).json({ success: false, error: "Report not found" });
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to fetch report" });
    }
  }

  /**
   * DELETE /api/compliance/reports/:id — Delete report
   */
  async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await complianceService.deleteReport(id as string);
      res.json({ success: true, message: "Report deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to delete report" });
    }
  }

  /**
   * GET /api/compliance/types — Get available report types
   */
  async getReportTypes(req: AuthenticatedRequest, res: Response) {
    const types = [
      { value: "STUDENT_NOMINAL_ROLL", label: "Student Nominal Roll", description: "Complete list of all students with details" },
      { value: "STAFF_NOMINAL_ROLL", label: "Staff Nominal Roll", description: "Complete list of all staff with roles and assignments" },
      { value: "ATTENDANCE_SUMMARY", label: "Attendance Summary", description: "Attendance statistics for a period" },
      { value: "FEE_COLLECTION_REPORT", label: "Fee Collection Report", description: "Fee payment status and collection summary" },
      { value: "EXAM_REGISTRATION_SUMMARY", label: "Exam Registration Summary", description: "Summary of exams and registered students" },
      { value: "INFRASTRUCTURE_CHECKLIST", label: "Infrastructure & Compliance Checklist", description: "School infrastructure and regulatory compliance checklist" },
    ];

    res.json({ success: true, data: types });
  }
}

export const complianceController = new ComplianceController();
