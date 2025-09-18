import { api } from "@/lib/api"
import type { UserItem, UserQueryParams, PaginatedUsers } from "@/types/user"

function mapDtoToUser(dto: any): UserItem {
  const rawName = dto.name ?? `${dto.first_name ?? ""}${dto.last_name ?? ""}`
  const name = (rawName || dto.username || "").trim() || dto.username

  return {
    id: String(dto.id),
    username: dto.username,
    email: dto.email || "",
    name,
    firstName: dto.first_name ?? dto.firstName ?? undefined,
    lastName: dto.last_name ?? dto.lastName ?? undefined,
    isActive: dto.is_active ?? dto.isActive ?? true,
    isStaff: dto.is_staff ?? dto.isStaff ?? false,
    dateJoined: dto.date_joined ?? dto.dateJoined,
    lastLogin: dto.last_login ?? dto.lastLogin ?? null,
  }
}

export const userService = {
  async getUsers(params: UserQueryParams = {}): Promise<PaginatedUsers> {
    const { page = 1, pageSize = 20, search = "" } = params
    const data = await api.get("/users/", {
      params: {
        page,
        page_size: pageSize,
        search: search || undefined,
      },
    })
    const payload = (data as any)?.data ?? data
    const results = payload?.results ?? []
    const pagination = payload?.pagination ?? {}
    return {
      users: results.map(mapDtoToUser),
      pagination: {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? pageSize,
        total: pagination.total_count ?? 0,
        totalPages: pagination.total_pages ?? 0,
      },
    }
  },

  async createUser(input: Partial<UserItem> & { password: string }): Promise<UserItem> {
    const payload: Record<string, unknown> = {
      username: input.username,
      email: input.email,
      name: input.name,
      is_active: input.isActive ?? true,
      is_staff: input.isStaff ?? false,
      password: input.password,
    }
    const data = await api.post("/users/", payload)
    const body = (data as any)?.data ?? data
    return mapDtoToUser(body)
  },

  async updateUser(id: string, input: Partial<UserItem> & { password?: string }): Promise<UserItem> {
    const payload: Record<string, unknown> = {
      username: input.username,
      email: input.email,
      name: input.name,
      is_active: input.isActive,
      is_staff: input.isStaff,
    }
    if (input.password) payload.password = input.password
    const data = await api.patch(`/users/${id}/`, payload)
    const body = (data as any)?.data ?? data
    return mapDtoToUser(body)
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}/`)
  },
}
