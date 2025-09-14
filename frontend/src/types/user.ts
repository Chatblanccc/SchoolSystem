export interface UserItem {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  isActive: boolean
  isStaff: boolean
  dateJoined?: string
  lastLogin?: string | null
}

export interface UserQueryParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface PaginatedUsers {
  users: UserItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}


