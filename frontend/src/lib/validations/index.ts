import { z } from "zod";

// Nigerian phone number regex: +234XXXXXXXXXX or 0XXXXXXXXX
const NG_PHONE_REGEX = /^(\+234|0)[789]\d{9}$/;

// Nigerian academic session format: YYYY/YYYY
const SESSION_REGEX = /^\d{4}\/\d{4}$/;

export const studentSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  gender: z.enum(["male", "female"], { message: "Gender is required" }),
  classId: z.string().uuid("Invalid class selection").optional().or(z.literal("")),
  armId: z.string().uuid("Invalid arm selection").optional().or(z.literal("")),
  dob: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().regex(NG_PHONE_REGEX, "Invalid Nigerian phone number").optional().or(z.literal("")),
  parentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type StudentFormData = z.infer<typeof studentSchema>;

export const feeSchema = z.object({
  studentId: z.string().uuid("Student is required"),
  term: z.coerce.number().int().min(1).max(3, "Term must be 1, 2, or 3"),
  session: z.string().regex(SESSION_REGEX, "Session must be in format YYYY/YYYY"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(2, "Description is required"),
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]).default("PENDING"),
  paymentMethod: z.enum(["cash", "transfer", "pos", "card", "online"]).optional(),
  paidAt: z.string().optional(),
});

export type FeeFormData = z.infer<typeof feeSchema>;

export const resultSchema = z.object({
  studentId: z.string().uuid("Student is required"),
  classArmId: z.string().uuid("Class arm is required"),
  session: z.string().regex(SESSION_REGEX, "Session must be in format YYYY/YYYY"),
  term: z.coerce.number().int().min(1).max(3, "Term must be 1, 2, or 3"),
  subjectId: z.string().uuid("Subject is required"),
  caScore: z.coerce.number().min(0).max(40, "CA score must be 0-40").optional(),
  examScore: z.coerce.number().min(0).max(100, "Exam score must be 0-100").optional(),
  totalScore: z.coerce.number().min(0).max(100, "Total must be 0-100").optional(),
});

export type ResultFormData = z.infer<typeof resultSchema>;

export const attendanceSchema = z.object({
  classArmId: z.string().uuid("Class arm is required"),
  date: z.string().min(1, "Date is required"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
});

export type AttendanceFormData = z.infer<typeof attendanceSchema>;

export const noticeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  targetType: z.enum(["ALL", "CLASS", "ARM"]),
  targetId: z.string().optional(),
  attachmentUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type NoticeFormData = z.infer<typeof noticeSchema>;

/**
 * Platform invite generate payload matches backend schoolInviteSchema:
 * backend only accepts { count, role }. Full name/email are collected later
 * during register-with-invite.
 */
export const staffInviteSchema = z.object({
  count: z.coerce.number().int().min(1).max(50).default(1),
  role: z.enum(["TEACHER", "BURSAR", "PRINCIPAL", "STUDENT", "PARENT"]),
});

export type StaffInviteFormData = z.infer<typeof staffInviteSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(NG_PHONE_REGEX, "Invalid Nigerian phone number").optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  schoolName: z.string().min(2, "School name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  schoolType: z.enum(["NURSERY", "PRIMARY", "SECONDARY", "COMBINED"]),
  ownershipType: z.enum(["PRIVATE", "GOVERNMENT"]),
  state: z.string().min(2, "State is required"),
  lga: z.string().min(1, "LGA is required"),
  address: z.string().min(5, "Address is required"),
  cacNumber: z.string().optional(),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  arms: z.array(z.string()).optional(),
});

export type ClassFormData = z.infer<typeof classSchema>;

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  shortCode: z.string().min(1, "Short code is required").max(10, "Max 10 characters"),
});

export type SubjectFormData = z.infer<typeof subjectSchema>;
