import { Bell, Search, User } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b dark:bg-card backdrop-blur supports-[backdrop-filter]:bg-background/95">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center flex-1">
          <h1 className="text-xl font-bold mr-8">BYSS 学校管理系统</h1>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="搜索学生、教师、课程..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="flex items-center space-x-2 p-2 hover:bg-accent rounded-lg transition-colors">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">管理员</span>
          </button>
        </div>
      </div>
    </header>
  )
}
