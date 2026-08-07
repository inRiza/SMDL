import type { UserListQueryInput } from "@/validators/user.validator";
import { UserRepository } from "./user.repository";

export class UserService {
  constructor(private readonly repository: UserRepository = new UserRepository()) {}

  async listUsers(query: UserListQueryInput, excludeUserId?: string) {
    const { rows, total } = await this.repository.findMany(query, excludeUserId);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      data: rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }
}
