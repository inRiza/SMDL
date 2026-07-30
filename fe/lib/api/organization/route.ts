import type {
  CreateOrganizationInput,
  OrganizationDetail,
  OrganizationFilters,
  OrganizationInviteInput,
  OrganizationInviteResult,
  OrganizationListItem,
  OrganizationListResponse,
} from "@/types/organization.types";
import { getApiBeOrganizations } from "../api.be";

function buildQuery(filters: OrganizationFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

const fetchOpts: RequestInit = {
  credentials: "include",
};

export async function fetchOrganizations(
  filters: OrganizationFilters = {}
): Promise<OrganizationListResponse> {
  const query = buildQuery(filters);
  const res = await fetch(`${getApiBeOrganizations()}?${query}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch organizations: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchOrganizationById(
  id: string
): Promise<OrganizationDetail | null> {
  const res = await fetch(`${getApiBeOrganizations()}/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch organization: ${res.statusText}`);
  }

  return res.json();
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<OrganizationListItem> {
  const res = await fetch(getApiBeOrganizations(), {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string;
      details?: Record<string, string[]>;
    } | null;
    const message =
      data?.details?.name?.[0] ?? data?.error ?? "Gagal membuat organisasi";
    throw new Error(message);
  }

  return res.json();
}

export async function inviteOrganizationMembers(
  organizationId: string,
  invites: OrganizationInviteInput[]
): Promise<OrganizationInviteResult[]> {
  const res = await fetch(`${getApiBeOrganizations()}/${organizationId}/invites`, {
    ...fetchOpts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invites }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Gagal mengirim undangan");
  }

  const json = (await res.json()) as { data: OrganizationInviteResult[] };
  return json.data;
}
