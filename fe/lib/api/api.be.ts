import { env } from "../config/api.config";

export const apiBe = env.NEXT_PUBLIC_API_BASE_URL;

export const apiBeDocuments = `${apiBe}/api/documents`;