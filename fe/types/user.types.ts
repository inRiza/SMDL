export type UserOption = {
  id: string;
  name: string;
  email: string;
};

export type UserListResponse = {
  data: UserOption[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type UserListFilters = {
  q?: string;
  page?: number;
  limit?: number;
};
