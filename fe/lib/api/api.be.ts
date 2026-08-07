function resolveApiBase() {
  if (typeof window !== "undefined") {
    return "/backend-api";
  }

  const internal = process.env.API_INTERNAL_URL ?? "http://localhost:3001";
  return `${internal}/api`;
}

export function getApiBe() {
  return resolveApiBase();
}

export function getApiBeDocuments() {
  return `${resolveApiBase()}/documents`;
}

export function getApiBeOrganizations() {
  return `${resolveApiBase()}/organizations`;
}

export function getApiBeTells() {
  return `${resolveApiBase()}/tells`;
}

export function getApiBeAuth() {
  return `${resolveApiBase()}/auth`;
}

export function getApiBeUsers() {
  return `${resolveApiBase()}/users`;
}

// backward compat for server imports
export const apiBe = process.env.API_INTERNAL_URL
  ? `${process.env.API_INTERNAL_URL}/api`
  : "http://localhost:3001/api";

export const apiBeDocuments = `${apiBe}/documents`;
export const apiBeTells = `${apiBe}/tells`;
