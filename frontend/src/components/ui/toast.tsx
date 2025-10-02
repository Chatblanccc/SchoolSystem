import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  )
}

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function Toast({ id, title, description, variant = "default" }: ToastProps) {
  const { dismiss } = useToast()

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
        "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-bottom-2",
        variant === "default" && "bg-background text-foreground",
        variant === "destructive" && "bg-destructive text-destructive-foreground border-destructive"
      )}
      data-state="open"
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      <button
        onClick={() => dismiss(id)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          "hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          variant === "destructive" && "hover:bg-destructive/90"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
