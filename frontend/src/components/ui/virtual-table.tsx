import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  title: React.ReactNode
  width: number | 'auto' | string // 支持自动宽度、固定宽度、百分比宽度（如 '16%'）
  minWidth?: number // 最小宽度
  render?: (value: any, record: T, index: number) => React.ReactNode
  className?: string
}

interface VirtualTableProps<T> {
  data: T[]
  columns: Column<T>[]
  height?: number
  itemHeight?: number
  className?: string
  onRowClick?: (record: T, index: number) => void
  loading?: boolean
  emptyText?: string
  stickyHeader?: boolean
  stickyHeaderClassName?: string
}

// 计算列宽度的辅助函数
function calculateColumnWidths<T>(columns: Column<T>[], containerWidth: number): Array<{ width: number | string; flexGrow: number; isPercentage: boolean }> {
  // 分类不同类型的列
  const fixedColumns = columns.filter(col => typeof col.width === 'number')
  const autoColumns = columns.filter(col => col.width === 'auto')
  const percentageColumns = columns.filter(col => typeof col.width === 'string' && col.width.includes('%'))
  
  // 检查是否所有列都是百分比
  const allPercentage = percentageColumns.length === columns.length
  
  if (allPercentage) {
    // 所有列都使用百分比，直接使用百分比布局
    return columns.map(col => ({
      width: col.width as string,
      flexGrow: 0,
      isPercentage: true
    }))
  }
  
  // 混合布局：计算固定宽度列的总宽度
  const fixedTotalWidth = fixedColumns.reduce((sum, col) => sum + (col.width as number), 0)
  const totalMinAutoWidth = autoColumns.reduce((sum, col) => sum + (col.minWidth || 100), 0)
  
  // 计算总需求宽度
  const totalRequiredWidth = fixedTotalWidth + totalMinAutoWidth
  
  // 如果容器宽度足够，使用 flex 布局；否则使用固定宽度
  const useFlexLayout = containerWidth > totalRequiredWidth
  
  return columns.map(col => {
    if (typeof col.width === 'number') {
      // 固定宽度
      return { width: col.width, flexGrow: 0, isPercentage: false }
    } else if (typeof col.width === 'string' && col.width.includes('%')) {
      // 百分比宽度
      return { width: col.width, flexGrow: 0, isPercentage: true }
    } else {
      // auto 宽度
      const minWidth = col.minWidth || 100
      
      if (useFlexLayout && autoColumns.length > 0) {
        // 使用 flex 布局，flexGrow 为 1，minWidth 作为最小宽度
        return { 
          width: minWidth,  // 这将作为 minWidth 使用
          flexGrow: 1,
          isPercentage: false
        }
      } else {
        // 容器太小，使用固定的最小宽度
        return { 
          width: minWidth, 
          flexGrow: 0,
          isPercentage: false
        }
      }
    }
  })
}



// 简化的虚拟化行组件
function VirtualRow<T>({ 
  record, 
  index, 
  columns, 
  columnWidths,
  onRowClick,
  isVisible = true 
}: { 
  record: T
  index: number
  columns: Column<T>[]
  columnWidths: Array<{ width: number | string; flexGrow: number; isPercentage: boolean }>
  onRowClick?: (record: T, index: number) => void
  isVisible?: boolean
}) {
  if (!isVisible) return null

  return (
    <div
      className={cn(
        "flex items-center border-b hover:bg-muted/50 cursor-pointer transition-colors w-full",
        index % 2 === 0 ? "bg-background" : "bg-muted/20"
      )}
      onClick={() => onRowClick?.(record, index)}
      style={{ height: '56px' }}
    >
      {columns.map((column, colIndex) => {
        const value = typeof column.key === 'string' && column.key.includes('.') 
          ? column.key.split('.').reduce((obj: any, key: string) => obj?.[key], record)
          : record[column.key as keyof T]

        const { width, flexGrow, isPercentage } = columnWidths[colIndex] || { width: 100, flexGrow: 0, isPercentage: false }

        return (
          <div
            key={String(column.key)}
            className={cn("px-4 py-2 text-sm text-center flex items-center justify-center", column.className)}
            style={isPercentage ? {
              // 百分比宽度模式
              width: width as string,
              flexShrink: 0
            } : flexGrow > 0 ? {
              // Flex 布局模式
              flex: `${flexGrow} 0 ${width}px`,
              minWidth: `${width}px`
            } : {
              // 固定宽度模式
              width: `${width}px`,
              flexShrink: 0
            }}
          >
            <div className="truncate w-full">
              {column.render ? column.render(value, record, index) : String(value || '')}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 表头组件
function TableHeader<T>({
  columns,
  columnWidths,
  stickyHeader,
  stickyHeaderClassName,
}: {
  columns: Column<T>[]
  columnWidths: Array<{ width: number | string; flexGrow: number; isPercentage: boolean }>
  stickyHeader?: boolean
  stickyHeaderClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center bg-muted/50 border-b font-medium text-sm w-full",
        stickyHeader ? "sticky top-0 z-10" : undefined,
        stickyHeaderClassName
      )}
    >
      {columns.map((column, colIndex) => {
        const { width, flexGrow, isPercentage } = columnWidths[colIndex] || { width: 100, flexGrow: 0, isPercentage: false }
        
        return (
          <div
            key={String(column.key)}
            className={cn("px-4 py-3 text-muted-foreground text-center flex items-center justify-center", column.className)}
            style={isPercentage ? {
              // 百分比宽度模式
              width: width as string,
              flexShrink: 0
            } : flexGrow > 0 ? {
              // Flex 布局模式
              flex: `${flexGrow} 0 ${width}px`,
              minWidth: `${width}px`
            } : {
              // 固定宽度模式
              width: `${width}px`,
              flexShrink: 0
            }}
          >
            {column.title}
          </div>
        )
      })}
    </div>
  )
}

// 简化的高性能表格组件（原生虚拟化）
export function VirtualTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 56,
  className,
  onRowClick,
  loading = false,
  emptyText = '暂无数据',
  stickyHeader = false,
  stickyHeaderClassName,
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(height - 50)
  const [containerWidth, setContainerWidth] = useState(0)

  // 计算列宽度
  const columnWidths = useMemo(() => {
    // 使用一个合理的默认宽度，避免初始渲染问题
    const effectiveWidth = containerWidth || 800
    return calculateColumnWidths(columns, effectiveWidth)
  }, [columns, containerWidth])

  // 计算是否需要水平滚动
  const totalContentWidth = useMemo(() => {
    // 如果使用百分比布局，不需要计算总宽度
    const hasPercentage = columnWidths.some(col => col.isPercentage)
    if (hasPercentage) {
      return containerWidth || 800 // 使用容器宽度
    }
    return columnWidths.reduce((sum, { width }) => {
      return sum + (typeof width === 'number' ? width : 0)
    }, 0)
  }, [columnWidths, containerWidth])

  const needsHorizontalScroll = totalContentWidth > containerWidth

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      data.length
    )
    return { startIndex, endIndex }
  }, [scrollTop, containerHeight, itemHeight, data.length])

  // 处理滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (tableRef.current) {
        const rect = tableRef.current.getBoundingClientRect()
        setContainerWidth(rect.width)
        setContainerHeight(height - 50)
      }
    }

    updateSize()
    
    const resizeObserver = new ResizeObserver(updateSize)
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [height])

  if (loading) {
    return (
      <div ref={tableRef} className={cn("border rounded-lg w-full", className)}>
        <TableHeader
          columns={columns}
          columnWidths={columnWidths}
          stickyHeader={stickyHeader}
          stickyHeaderClassName={stickyHeaderClassName}
        />
        <div 
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: containerHeight }}
        >
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div ref={tableRef} className={cn("border rounded-lg w-full", className)}>
        <TableHeader
          columns={columns}
          columnWidths={columnWidths}
          stickyHeader={stickyHeader}
          stickyHeaderClassName={stickyHeaderClassName}
        />
        <div 
          className="flex items-center justify-center text-muted-foreground"
          style={{ height: containerHeight }}
        >
          {emptyText}
        </div>
      </div>
    )
  }

  const totalHeight = data.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  return (
    <div ref={tableRef} className={cn("border rounded-lg overflow-hidden w-full", className)}>
      <TableHeader
        columns={columns}
        columnWidths={columnWidths}
        stickyHeader={stickyHeader}
        stickyHeaderClassName={stickyHeaderClassName}
      />
      <div 
        ref={containerRef}
        className="overflow-auto"
        style={{ 
          height: containerHeight,
          width: '100%'
        }}
        onScroll={handleScroll}
      >
        <div 
          style={{ 
            height: totalHeight, 
            position: 'relative',
            minWidth: needsHorizontalScroll ? `${totalContentWidth}px` : '100%'
          }}
        >
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {data.slice(visibleRange.startIndex, visibleRange.endIndex).map((record, index) => (
              <VirtualRow
                key={visibleRange.startIndex + index}
                record={record}
                index={visibleRange.startIndex + index}
                columns={columns}
                columnWidths={columnWidths}
                onRowClick={onRowClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 便捷的Hook来定义列
export function useVirtualTableColumns<T>() {
  const createColumn = useCallback((
    key: keyof T | string,
    title: React.ReactNode,
    width: number | 'auto' | string, // 支持百分比字符串，如 '16%'
    options?: {
      minWidth?: number
      render?: (value: any, record: T, index: number) => React.ReactNode
      className?: string
    }
  ): Column<T> => ({
    key,
    title,
    width,
    minWidth: options?.minWidth,
    render: options?.render,
    className: options?.className
  }), [])

  return { createColumn }
}

// 导出类型
export type { Column as VirtualTableColumn }
