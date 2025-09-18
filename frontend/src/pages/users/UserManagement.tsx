import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/shared/Pagination"
import { CompactTableSettings } from "@/components/shared/CompactTableSettings"
import { userService } from "@/services/userService"
import type { UserItem, UserQueryParams, PaginatedUsers } from "@/types/user"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { UserFormModal } from "@/components/shared/UserFormModal"

export default function UserManagement() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [tableHeight, setTableHeight] = useState(500)
  const [queryParams, setQueryParams] = useState<UserQueryParams>({ page: 1, pageSize: 20, search: "" })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<UserItem | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const result: PaginatedUsers = await userService.getUsers(queryParams)
      setUsers(result.users)
      setPagination(result.pagination)
    } catch (error) {
      console.error("加载用户失败", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [queryParams])

  const handleSearch = (value: string) => setQueryParams((params) => ({ ...params, search: value, page: 1 }))
  const handlePageChange = (page: number) => setQueryParams((params) => ({ ...params, page }))
  const handlePageSizeChange = (size: number) => {
    setQueryParams((params) => ({ ...params, pageSize: size, page: 1 }))
    setPagination((prev) => ({ ...prev, pageSize: size }))
  }
  const handleTableHeightChange = (height: number) => setTableHeight(height)
  const handleRefresh = () => loadUsers()

  const handleAdd = () => setAddOpen(true)
  const handleEdit = (user: UserItem) => {
    setEditing(user)
    setEditOpen(true)
  }
  const handleDelete = (user: UserItem) => {
    setToDelete(user)
    setConfirmOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            新增用户
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <CompactTableSettings
            pageSize={pagination.pageSize}
            onPageSizeChange={handlePageSizeChange}
            tableHeight={tableHeight}
            onTableHeightChange={handleTableHeightChange}
            onRefresh={handleRefresh}
            refreshing={loading}
          />
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="搜索用户名 / 姓名 / 邮箱..."
            className="w-64"
            icon={<Search className="w-4 h-4" />}
            value={queryParams.search}
            onChange={(event) => handleSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md overflow-auto" style={{ height: tableHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50">
            <tr>
              {[
                "用户名",
                "姓名",
                "邮箱",
                "激活",
                "管理员",
                "加入时间",
                "操作",
              ].map((header) => (
                <th key={header} className="px-4 py-3 text-center">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-muted-foreground">
                  暂无数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-accent/30">
                  <td className="px-4 py-2 text-center">{user.username}</td>
                  <td className="px-4 py-2 text-center">{user.name}</td>
                  <td className="px-4 py-2 text-center">{user.email}</td>
                  <td className="px-4 py-2 text-center">{user.isActive ? "是" : "否"}</td>
                  <td className="px-4 py-2 text-center">{user.isStaff ? "是" : "否"}</td>
                  <td className="px-4 py-2 text-center">{user.dateJoined?.slice(0, 19).replace("T", " ")}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="text-primary hover:underline" onClick={() => handleEdit(user)}>
                        编辑
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button className="text-destructive hover:underline" onClick={() => handleDelete(user)}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        showInfo
        showPageSizeSelector={false}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="删除用户"
        description={toDelete ? `确定要删除用户「${toDelete.username}」吗？该操作不可撤销。` : ""}
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => {
          setConfirmOpen(false)
          setToDelete(null)
        }}
        onConfirm={async () => {
          if (!toDelete) return
          try {
            await userService.deleteUser(toDelete.id)
            setConfirmOpen(false)
            setToDelete(null)
            loadUsers()
          } catch (error) {
            alert("删除失败，请重试")
          }
        }}
      />

      <UserFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (values) => {
          try {
            await userService.createUser({
              username: values.username,
              email: values.email,
              name: values.name,
              isActive: values.isActive,
              isStaff: values.isStaff,
              password: values.password || "",
            })
            setAddOpen(false)
            loadUsers()
          } catch (error: any) {
            const message = error?.response?.data?.error?.message || "创建失败，请重试"
            const details = error?.response?.data?.error?.details
            console.error("createUser error", error?.response?.data || error)
            alert(`${message}${details ? `\n${JSON.stringify(details)}` : ""}`)
          }
        }}
      />

      <UserFormModal
        isOpen={editOpen}
        title="编辑用户"
        defaultValues={editing ? {
          username: editing.username,
          email: editing.email,
          name: editing.name,
          isActive: editing.isActive,
          isStaff: editing.isStaff,
        } : undefined}
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        onSubmit={async (values) => {
          if (!editing) return
          try {
            await userService.updateUser(editing.id, {
              username: values.username,
              email: values.email,
              name: values.name,
              isActive: values.isActive,
              isStaff: values.isStaff,
              password: values.password || undefined,
            })
            setEditOpen(false)
            setEditing(null)
            loadUsers()
          } catch (error: any) {
            const message = error?.response?.data?.error?.message || "更新失败，请重试"
            const details = error?.response?.data?.error?.details
            console.error("updateUser error", error?.response?.data || error)
            alert(`${message}${details ? `\n${JSON.stringify(details)}` : ""}`)
          }
        }}
      />
    </div>
  )
}
