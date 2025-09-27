import { api } from "../lib/api"
import { useTabStore } from "@/stores/tabStore"

interface Tokens {
  access?: string
  refresh?: string
}

function extractTokens(res: any): Tokens {
  const payload = res?.data ?? res
  return {
    access: payload?.access ?? payload?.token ?? payload?.access_token,
    refresh: payload?.refresh ?? payload?.refresh_token,
  }
}

export const authService = {
  async login(input: { username: string; password: string }): Promise<void> {
    // 兼容多种后端登录端点：/auth/login/ 与 SimpleJWT /token/
    const tryEndpoints = async (): Promise<Tokens> => {
      try {
        const res = await api.post("/auth/login/", input)
        return extractTokens(res)
      } catch (e: any) {
        // 尝试 SimpleJWT 默认端点
        const res2 = await api.post("/token/", {
          username: input.username,
          password: input.password,
        })
        return extractTokens(res2)
      }
    }

    const tokens = await tryEndpoints()
    if (!tokens.access) {
      throw new Error("登录失败：未获取到访问令牌")
    }
    localStorage.setItem("access_token", tokens.access)
    if (tokens.refresh) localStorage.setItem("refresh_token", tokens.refresh)
    // 登录成功后重置标签页，确保新会话从默认状态开始
    useTabStore.getState().clearTabs()
  },

  async getCurrentUser(): Promise<{ id: number; username: string; name: string; email?: string; is_staff?: boolean; is_superuser?: boolean } | null> {
    try {
      const res = await api.get('/auth/me/')
      const body = res?.data ?? res
      return body ?? null
    } catch (e) {
      return null
    }
  },

  async updateProfile(input: { first_name?: string; last_name?: string; email?: string }) {
    const res = await api.patch('/auth/me/', input)
    return res?.data ?? res
  },

  async changePassword(input: { old_password: string; new_password: string }) {
    const res = await api.post('/auth/change-password/', input)
    return res?.data ?? res
  },

  logout() {
    useTabStore.getState().clearTabs()
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/login"
  },
}


