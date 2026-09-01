import type { AdminAccountUpdateInput } from "@/validators/admin-account.validator";
import { AdminAccountRepository } from "./admin-account.repository";

export class AdminAccountService {
  constructor(private readonly repo = new AdminAccountRepository()) {}

  update(
    targetId: string,
    input: AdminAccountUpdateInput,
    actor: { id: string; email: string; name: string }
  ) {
    if (targetId === actor.id && (input.status === "deactivated" || input.role)) {
      return Promise.resolve({ error: "SELF_MODIFY" as const });
    }
    return this.repo.updateAccount(targetId, input, actor);
  }

  softDelete(targetId: string, actor: { id: string; email: string; name: string }) {
    if (targetId === actor.id) {
      return Promise.resolve({ error: "SELF_MODIFY" as const });
    }
    return this.repo.softDelete(targetId, actor);
  }
}
