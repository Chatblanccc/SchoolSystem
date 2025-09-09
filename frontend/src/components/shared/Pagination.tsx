import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showInfo?: boolean
  showPageSizeSelector?: boolean
  className?: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function Pagination({ 
  currentPage, 
  totalPages, 
  pageSize,
  totalItems,
  onPageChange, 
  onPageSizeChange,
  showInfo = true,
  showPageSizeSelector = true,
  className
}: PaginationProps) {
  
  const handleFirst = () => onPageChange(1)
  const handlePrevious = () => currentPage > 1 && onPageChange(currentPage - 1)
  const handleNext = () => currentPage < totalPages && onPageChange(currentPage + 1)
  const handleLast = () => onPageChange(totalPages)

  // 计算当前页显示的数据范围
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // 生成页码数组
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const sidePages = 2
      
      if (currentPage <= sidePages + 1) {
        for (let i = 1; i <= sidePages + 2; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - sidePages) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - sidePages - 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border rounded-lg", className)}>
      {/* 左侧：数据信息 */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <div className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span> 条数据，
            显示第 <span className="font-medium text-foreground">{startItem}</span> - 
            <span className="font-medium text-foreground">{endItem}</span> 条
          </div>
        )}
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页显示</span>
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size} 条
                </SelectItem>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* 右侧：分页控件 */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* 第一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFirst}
            disabled={currentPage <= 1}
            className="hidden sm:inline-flex"
            title="第一页"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          
          {/* 上一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">上一页</span>
          </Button>
          
          {/* 页码 */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="min-w-[2.5rem] h-9"
                  >
                    {page}
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {/* 下一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage >= totalPages}
          >
            <span className="hidden sm:inline">下一页</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {/* 最后一页 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLast}
            disabled={currentPage >= totalPages}
            className="hidden sm:inline-flex"
            title="最后一页"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
