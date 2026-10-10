import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { config } from "../config/env";
import { UnauthorizedError } from "../utils/errors";
import { JwtPayload } from "../types";

const JWT_SECRET = config.JWT_SECRET;

export interface SupabaseJwtPayload {
  sub: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  role?: string;
  aud?: string;
}

function getSupabaseProjectUrl(): string | undefined {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    undefined
  );
}

function getSupabaseServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    undefined
  );
}

/**
 * Verify a Supabase access token.
 * Prefers local HS256 verification when SUPABASE_JWT_SECRET is set.
 * Falls back to Supabase Auth API introspection using the service role key,
 * so Google OAuth works as long as project URL + service key are configured.
 * Never trust client-supplied email or user id.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseJwtPayload> {
  const secret = process.env.SUPABASE_JWT_SECRET || config.SUPABASE_JWT_SECRET;
  if (secret) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
        audience: "authenticated",
      }) as SupabaseJwtPayload;

      if (!decoded || !decoded.email || !decoded.sub) {
        throw new UnauthorizedError("Invalid Supabase token.");
      }
      return decoded;
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError("Invalid Supabase token.");
    }
  }

  const projectUrl = getSupabaseProjectUrl();
  const serviceKey = getSupabaseServiceKey();
  if (!projectUrl || !serviceKey) {
    throw new UnauthorizedError("Supabase verification is not configured.");
  }

  let res: Response;
  try {
    res = await fetch(`${projectUrl.replace(/\/+$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: serviceKey,
      },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new UnauthorizedError("Supabase verification is unavailable.");
  }

  if (!res.ok) {
    throw new UnauthorizedError("Invalid Supabase token.");
  }

  const user = (await res.json()) as {
    id?: string;
    email?: string;
    user_metadata?: { full_name?: string; avatar_url?: string };
  };

  if (!user?.email || !user?.id) {
    throw new UnauthorizedError("Invalid Supabase token.");
  }

  return {
    sub: user.id,
    email: user.email,
    user_metadata: {
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
    },
  };
}

/**
 * Find or create a SchoolPilot user from a verified Supabase OAuth login.
 * Returns access token + refresh token for our API.
 *
 * Google sign up works: if the Google email has no SchoolPilot account yet,
 * we create one so the user can finish setup instead of bouncing home.
 */
export async function syncSupabaseUser(data: {
  supabaseUserId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  defaultRole?: string;
}) {
  const email = data.email.toLowerCase();

  let user = await prisma.user.findUnique({
    where: { email },
    include: {
      school: {
        select: {
          id: true, name: true, slug: true, verified: true, logoUrl: true, motto: true, status: true,
        },
      },
    },
  });

  let created = false;
  if (!user) {
    // First Google login for this email. Create a real SchoolPilot account
    // so sign up does not dead-end on the homepage.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
    const fullName =
      (data.fullName || "").trim() ||
      email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const role = (data.defaultRole || "PARENT").toUpperCase();
    const allowedRoles = new Set([
      "SUPER_ADMIN",
      "SCHOOL_ADMIN",
      "PRINCIPAL",
      "TEACHER",
      "BURSAR",
      "PARENT",
      "STUDENT",
    ]);

    user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role: (allowedRoles.has(role) ? role : "PARENT") as any,
        schoolId: null,
        active: true,
        studentId: null,
      },
      include: {
        school: {
          select: {
            id: true, name: true, slug: true, verified: true, logoUrl: true, motto: true, status: true,
          },
        },
      },
    });
    created = true;
  }

  if (!user.active) {
    throw new UnauthorizedError("This account has been deactivated. Contact your school admin.");
  }

  const payload: JwtPayload = {
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
    tokenPurpose: "access",
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "15m",
    jwtid: crypto.randomUUID(),
  });

  const refreshToken = jwt.sign(
    { ...payload, tokenVersion: Date.now(), tokenPurpose: "refresh" } as any,
    JWT_SECRET,
    { expiresIn: "7d", jwtid: crypto.randomUUID() }
  );

  const crypto2 = await import("crypto");
  const tokenHash = crypto2.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Do NOT auto-clear passwordResetRequired on OAuth sync.
  // Forced password change must be completed through set-password.

  return {
    accessToken,
    refreshToken,
    created,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      passwordResetRequired: user.passwordResetRequired,
    },
    school: user.school,
  };
}
