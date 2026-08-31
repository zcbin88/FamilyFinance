import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Briefcase,
  Car,
  Clapperboard,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Trophy,
  Utensils,
  Zap,
} from 'lucide-react'

/** 分类图标预设（与 seed 数据一致；数据库存 key） */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  home: Home,
  zap: Zap,
  smartphone: Smartphone,
  'heart-pulse': HeartPulse,
  clapperboard: Clapperboard,
  'graduation-cap': GraduationCap,
  gift: Gift,
  plane: Plane,
  ellipsis: Ellipsis,
  banknote: Banknote,
  trophy: Trophy,
  'trending-up': TrendingUp,
  briefcase: Briefcase,
}

/** 付款方式预设 */
export const PAY_METHODS = ['现金', '微信', '支付宝', '银行卡', '信用卡'] as const

export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string
  color?: string
  className?: string
}) {
  const Icon = CATEGORY_ICONS[icon] ?? Ellipsis
  return <Icon className={className} style={{ color }} />
}
