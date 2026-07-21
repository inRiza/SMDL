export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "owner" | "viewer" | "auditor";
};
