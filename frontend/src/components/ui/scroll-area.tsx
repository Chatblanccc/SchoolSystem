import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

export interface BYSSScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  viewportRef?: React.Ref<HTMLDivElement>
  onViewportScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  viewportClassName?: string
  onViewportWheel?: (e: React.WheelEvent<HTMLDivElement>) => void
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  BYSSScrollAreaProps
>(({ className, children, viewportRef, onViewportScroll, onViewportWheel, viewportClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    type="always"
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={viewportRef}
      onScroll={onViewportScroll}
      onWheel={onViewportWheel}
      /* 显式允许横向滚动，避免被外层样式限制 */
      className={cn('h-full w-full rounded-[inherit] overflow-x-auto', viewportClassName)}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar orientation="horizontal" />
    <ScrollBar orientation="vertical" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = 'ScrollArea'

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.Scrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical'
        ? 'h-full w-2.5 border-l border-l-transparent p-[1px]'
        : 'h-2.5 border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.Scrollbar>
))
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }


