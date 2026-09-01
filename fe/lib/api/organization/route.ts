import type {
  CreateOrganizationInput,
  OrganizationAccessLevel,
  OrganizationDetail,
  OrganizationDocumentItem,
  OrganizationFilters,
  OrganizationInviteInput,
  OrganizationInviteResult,
  OrganizationListItem,
  OrganizationListResponse,
  OrganizationType,
} from "@/types/organization.types";
import { getApiBeOrganizations } from "../api.be";
import { fetchApi } from "../fetch-api";

function buildQuery(filters: OrganizationFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
      return;
    }
    params.set(key, String(value));
  });

  return params.toString();
}

async function readError(res: Response, fallback: string) {
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    details?: Record<string, string[]>;
  } | null;
  return data?.details?.name?.[0] ?? data?.details?.title?.[0] ?? data?.error ?? fallback;
}

export async function fetchOrganizations(
  filters: OrganizationFilters = {}
): Promise<OrganizationListResponse> {
  const query = buildQuery(filters);
  const res = await fetchApi(`${getApiBeOrganizations()}?${query}`);

  if (res.status === 401) {
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memuat organisasi"));
  }

  return res.json();
}

export async function fetchOrganizationById(
  id: string
): Promise<OrganizationDetail | null> {
  const res = await fetchApi(`${getApiBeOrganizations()}/${id}`);

  if (res.status === 404) return null;
  if (res.status === 401) {
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }
  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memuat organisasi"));
  }

  return res.json();
}

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<OrganizationListItem> {
  const res = await fetchApi(getApiBeOrganizations(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal membuat organisasi"));
  }

  return res.json();
}

export async function updateOrganization(
  organizationId: string,
  input: {
    name?: string;
    description?: string | null;
    type?: OrganizationType;
  }
) {
  const res = await fetchApi(`${getApiBeOrganizations()}/${organizationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memperbarui organisasi"));
  }

  return res.json();
}

export async function inviteOrganizationMembers(
  organizationId: string,
  invites: OrganizationInviteInput[]
): Promise<OrganizationInviteResult[]> {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/invites`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invites: invites.map((invite) => ({
          email: invite.email,
          userId: invite.userId,
          name: invite.name,
          accessLevel: invite.accessLevel,
        })),
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mengirim undangan"));
  }

  const json = (await res.json()) as { data: OrganizationInviteResult[] };
  return json.data;
}

export async function updateOrganizationMemberAccess(
  organizationId: string,
  memberId: string,
  accessLevel: Exclude<OrganizationAccessLevel, "owner">
) {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/members/${memberId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessLevel }),
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mengubah akses anggota"));
  }
}

export async function removeOrganizationMember(
  organizationId: string,
  memberId: string
): Promise<void> {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/members/${memberId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal menghapus anggota"));
  }
}

export async function uploadOrganizationDocument(
  organizationId: string,
  input: {
    title: string;
    description?: string;
    category?: string;
    file: File;
    visibility: "public" | "organization";
  }
): Promise<OrganizationDocumentItem> {
  const formData = new FormData();
  formData.set("title", input.title);
  if (input.description) formData.set("description", input.description);
  if (input.category) formData.set("category", input.category);
  formData.set("visibility", input.visibility);
  formData.set("file", input.file);

  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/documents`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mengunggah dokumen"));
  }

  return res.json();
}

export async function updateOrganizationDocument(
  organizationId: string,
  documentId: string,
  input: {
    title?: string;
    description?: string | null;
    category?: string | null;
  }
): Promise<OrganizationDocumentItem> {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/documents/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal memperbarui dokumen"));
  }

  return res.json();
}

export async function revokeOrganizationDocument(
  organizationId: string,
  documentId: string
) {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mencabut dokumen"));
  }
}

export async function transferOrganizationOwnership(
  organizationId: string,
  input: {
    newOwnerMemberId: string;
    demotedAccessLevel: "member" | "viewer";
  }
) {
  const res = await fetchApi(
    `${getApiBeOrganizations()}/${organizationId}/transfer-ownership`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal mentransfer kepemilikan"));
  }
}

export async function leaveOrganization(organizationId: string) {
  const res = await fetchApi(`${getApiBeOrganizations()}/${organizationId}/leave`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Gagal meninggalkan organisasi"));
  }

  return res.json() as Promise<{ deleted: boolean }>;
}
