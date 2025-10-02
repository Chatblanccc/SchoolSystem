import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '/api/v1' : 'http://localhost:8000/api/v1')

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 这里可以添加 token 等认证信息
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    // 处理错误响应
    if (error.response?.status === 401) {
      // 未授权，可能需要刷新 token 或重新登录
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)
