import { cn } from "@/lib/utils"

export function AvatarInitials({ name, className }: { name?: string; className?: string }) {
  const initials = (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className={cn("h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold", className)}>
      {initials}
    </div>
  )
}


