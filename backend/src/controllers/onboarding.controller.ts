import { Response } from "express";
import { onboardingService } from "../services/onboarding.service";
import { sessionService } from "../services/session.service";
import { authService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types";
import { sendSuccess, sendError } from "../utils/response";

export class OnboardingController {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      // Create school + SCHOOL_ADMIN (and academic calendar / classes)
      const result = await onboardingService.onboard(req.body);

      // Same session + cookie path as authService.register / authService.login
      const deviceId = req.deviceId || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const remember = req.body?.remember ?? false;

      const { accessToken, refreshToken, session } = await sessionService.createSession(
        result.user.id,
        result.school.id,
        result.user.role,
        deviceId,
        userAgent,
        ipAddress,
        remember
      );

      authService.setAuthCookies(res, accessToken, refreshToken, remember);

      res.status(201);
      // Cookies carry auth; body still includes user/school for the client
      sendSuccess(res, {
        user: result.user,
        school: result.school,
        session,
      });
    } catch (error: any) {
      sendError(res, error.statusCode || 500, error.code || "SERVER_ERROR", error.message || "Registration failed. Please try again.", undefined, req.requestId);
    }
  }
}

export const onboardingController = new OnboardingController();
