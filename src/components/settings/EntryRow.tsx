import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EntryRowProps {
  to: string
  icon: ReactNode
  /** 图标块的暖色配色，例如 bg-amber-500/15 text-amber-600 */
  iconClass: string
  title: string
  description: string
  badge?: string
}

/** 「我的」页入口行：图标块 + 标题 + 描述 + 角标 + chevron */
export default function EntryRow({
  to,
  icon,
  iconClass,
  title,
  description,
  badge,
}: EntryRowProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-foreground/10 transition-colors active:bg-muted"
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          iconClass,
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
      </div>
      {badge && (
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {badge}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
