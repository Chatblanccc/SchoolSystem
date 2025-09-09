// 调试工具函数
export const debugTabStore = () => {
  // 清除标签栏存储
  localStorage.removeItem('tab-storage')
  console.log('标签栏存储已清除，请刷新页面')
}

export const debugIconType = (icon: any) => {
  console.log('图标调试信息:', {
    type: typeof icon,
    value: icon,
    isFunction: typeof icon === 'function',
    constructor: icon?.constructor?.name,
    toString: icon?.toString?.()
  })
}

// 在开发环境下暴露调试函数到全局
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const win = window as any
  win.debugTabStore = debugTabStore
  win.debugIconType = debugIconType
}
