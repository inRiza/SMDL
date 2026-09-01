import { prismaClient } from "@/lib/db/prisma";
import {
  generateSessionToken,
  getSessionExpiry,
  hashSessionToken,
} from "@/lib/auth/session-util";
import type { LoginInput } from "@/validators/auth.validator";

export class AuthService {
  async login(input: LoginInput) {
    const user = await prismaClient.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return { ok: false as const, reason: "invalid_credentials" };
    }

    if (user.accountStatus === "deleted") {
      return { ok: false as const, reason: "account_deleted" };
    }

    if (user.accountStatus === "deactivated") {
      return { ok: false as const, reason: "account_dormant" };
    }

    const valid = await Bun.password.verify(input.password, user.passwordHash);
    if (!valid) {
      return { ok: false as const, reason: "invalid_credentials" };
    }

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);

    await prismaClient.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: getSessionExpiry(),
      },
    });

    return {
      ok: true as const,
      token: rawToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(rawToken: string) {
    await prismaClient.session.deleteMany({
      where: { tokenHash: hashSessionToken(rawToken) },
    });
  }

  async getSessionUser(rawToken: string) {
    try {
      const session = await prismaClient.session.findUnique({
        where: { tokenHash: hashSessionToken(rawToken) },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      if (!session) return null;

      if (session.expiresAt <= new Date()) {
        await prismaClient.session.delete({ where: { id: session.id } });
        return null;
      }

      return session.user;
    } catch {
      return null;
    }
  }
}
