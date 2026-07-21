import type { UserRole } from "@prisma/client";

export type AppEnv = {
  Variables: {
    userId?: string;
    userRole?: UserRole;
    userEmail?: string;
  };
};
