import { Request } from "express";
import { Role } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  schoolId: string | null;
  role: Role;
  /** Access tokens omit this or set "access". Reset/setup tokens must set a purpose. */
  tokenPurpose?: "access" | "reset" | "setup";
  /** SUPER_ADMIN id when this session is an impersonation. */
  impersonatorId?: string;
  jti?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  schoolId: string | null;
  role: Role;
  tokenVersion: number;
  jti?: string;
}

export interface BillingLock {
  locked: boolean;
  amountOwed: number;
  activeStudents: number;
  feePerStudent: number;
  expectedBill: number;
}

export interface KnownDevice {
  id: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  lastActiveAt: Date;
  isTrusted: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  tenantId?: string | null;
  billingLock?: BillingLock;
  deviceId?: string;
  deviceFingerprint?: {
    deviceId: string;
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    screenResolution?: string;
    timezone?: string;
    platform?: string;
  };
  csrfToken?: string;
  suspiciousLogin?: {
    isNewDevice: boolean;
    isNewLocation: boolean;
    knownDevices: KnownDevice[];
  };
  loginAttempts?: {
    recordFailure: () => void;
    recordSuccess: () => void;
    getIpStatus: () => { count: number; locked: boolean; remainingSeconds: number } | null;
    getEmailStatus: () => { count: number; locked: boolean; remainingSeconds: number } | null;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
