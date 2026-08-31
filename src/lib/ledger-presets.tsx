import type { LucideIcon } from 'lucide-react'
import {
  Book,
  Briefcase,
  Car,
  Gift,
  GraduationCap,
  Heart,
  Home,
  PiggyBank,
  Plane,
  ShoppingCart,
  Utensils,
  Wallet,
} from 'lucide-react'

/** 账本图标预设（数据库存 key，渲染时映射） */
export const LEDGER_ICONS: Record<string, LucideIcon> = {
  book: Book,
  wallet: Wallet,
  cart: ShoppingCart,
  plane: Plane,
  home: Home,
  piggy: PiggyBank,
  car: Car,
  heart: Heart,
  briefcase: Briefcase,
  gift: Gift,
  utensils: Utensils,
  grad: GraduationCap,
}

export const LEDGER_ICON_KEYS = Object.keys(LEDGER_ICONS)

/** 账本颜色预设 */
export const LEDGER_COLORS = [
  '#3b82f6', // 蓝
  '#ef4444', // 红
  '#f97316', // 橙
  '#eab308', // 黄
  '#22c55e', // 绿
  '#14b8a6', // 青
  '#8b5cf6', // 紫
  '#ec4899', // 粉
  '#64748b', // 灰
]

export function LedgerIcon({
  icon,
  color,
  className,
}: {
  icon: string
  color?: string
  className?: string
}) {
  const Icon = LEDGER_ICONS[icon] ?? Book
  return <Icon className={className} style={{ color }} />
}
