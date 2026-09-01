import type { AuditListQuery } from "@/validators/audit.validator";
import { AuditRepository } from "./audit.repository";

export class AuditService {
  constructor(private readonly repo = new AuditRepository()) {}

  list(query: AuditListQuery) {
    return this.repo.list(query);
  }

  getById(id: string) {
    return this.repo.getById(id);
  }

  getOverview() {
    return this.repo.getOverviewStats();
  }
}
