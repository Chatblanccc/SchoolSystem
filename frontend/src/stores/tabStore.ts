import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_TABS = 10

// 简化的标签类型，不包含图标
export type StoredTab = {
  id: string
  title: string
  page: string
  closable?: boolean
}

interface TabState {
  tabs: StoredTab[]
  activeTabId: string | null
  
  // 添加标签
  addTab: (tab: StoredTab) => boolean
  
  // 移除标签
  removeTab: (tabId: string) => void
  
  // 设置激活标签
  setActiveTab: (tabId: string) => void
  
  // 更新标签信息
  updateTab: (tabId: string, updates: Partial<StoredTab>) => void
  
  // 清空所有标签
  clearTabs: () => void
  
  // 检查标签是否存在
  hasTab: (tabId: string) => boolean
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [
        {
          id: 'dashboard',
          title: '仪表盘',
          page: 'dashboard',
          closable: false // 仪表盘不可关闭
        }
      ],
      activeTabId: 'dashboard',
      
      addTab: (tab) => {
        const { tabs } = get()
        const exists = tabs.find(t => t.id === tab.id)
        
        if (exists) {
          // 如果标签已存在，直接激活
          set({ activeTabId: tab.id })
          return true
        }

        // 限制最大标签数量（含仪表盘）
        if (tabs.length >= MAX_TABS) {
          return false
        }

        set({
          tabs: [...tabs, tab],
          activeTabId: tab.id
        })
        return true
      },
      
      removeTab: (tabId) => {
        const { tabs, activeTabId } = get()
        const index = tabs.findIndex(t => t.id === tabId)
        
        if (index === -1) return
        
        const newTabs = tabs.filter(t => t.id !== tabId)
        let newActiveTabId = activeTabId
        
        // 如果删除的是当前激活的标签
        if (activeTabId === tabId) {
          // 优先激活右边的标签，否则激活左边的
          if (index < tabs.length - 1) {
            newActiveTabId = tabs[index + 1].id
          } else if (index > 0) {
            newActiveTabId = tabs[index - 1].id
          } else {
            newActiveTabId = newTabs[0]?.id || null
          }
        }
        
        set({
          tabs: newTabs,    
          activeTabId: newActiveTabId
        })
      },
      
      setActiveTab: (tabId) => {
        const { tabs } = get()
        const exists = tabs.find(t => t.id === tabId)
        if (exists) {
          set({ activeTabId: tabId })
        }
      },
      
      updateTab: (tabId, updates) => {
        set(state => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          )
        }))
      },
      
      clearTabs: () => {
        set({
          tabs: [
            {
              id: 'dashboard',
              title: '仪表盘',
              page: 'dashboard',
              closable: false
            }
          ],
          activeTabId: 'dashboard'
        })
      },
      
      hasTab: (tabId) => {
        return get().tabs.some(t => t.id === tabId)
      }
    }),
    {
      name: 'tab-storage',
      version: 5,
      migrate: () => ({
        tabs: [
          {
            id: 'dashboard',
            title: '仪表盘',
            page: 'dashboard',
            closable: false
          }
        ],
        activeTabId: 'dashboard'
      })
    }
  )
)
