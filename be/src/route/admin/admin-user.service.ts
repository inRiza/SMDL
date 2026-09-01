import type { AdminUserListQuery } from "@/validators/admin-user.validator";
import { AdminUserRepository } from "./admin-user.repository";

export class AdminUserService {
  constructor(private readonly repo = new AdminUserRepository()) {}

  list(query: AdminUserListQuery) {
    return this.repo.list(query);
  }

  getById(id: string) {
    return this.repo.getById(id);
  }
}
