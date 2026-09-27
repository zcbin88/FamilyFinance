import { Link } from 'react-router'
import { ChevronRight, CircleUserRound, Tags, Users, Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import EntryRow from '@/components/settings/EntryRow'
import { useCurrentFamily, useFamilyMembers } from '@/hooks/useFamily'
import { useLedgers } from '@/hooks/useLedgers'
import { useCategories } from '@/hooks/useCategories'

/** 按当前时间给出温馨问候 */
function greeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，早点休息'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

/** 自家庭创建起算的累计天数（首日计 1 天） */
function daysSince(createdAt: string) {
  return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000) + 1)
}

export default function SettingsPage() {
  const { data: family } = useCurrentFamily()
  const { data: members, isLoading: membersLoading } = useFamilyMembers(family?.id)
  const { data: ledgers } = useLedgers(family?.id)
  const { data: categories } = useCategories(family?.id)

  const memberCount = members?.length
  const avatarMembers = (members ?? []).slice(0, 5)

  return (
    <div className="space-y-6">
      {/* ─── 暖色英雄卡：家庭信息 + 温馨氛围，点击进入「我的家庭」 ─── */}
      <Link
        to="/settings/family"
        className="relative block overflow-hidden rounded-3xl text-white shadow-sm transition-transform active:scale-[0.99]"
      >
        {/* 暖金渐变 + 柔光斑 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600" />
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -left-8 size-40 rounded-full bg-orange-300/40 blur-2xl" />
        <span className="pointer-events-none absolute bottom-2 right-4 select-none text-6xl opacity-15">
          🏡
        </span>

        <div className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/85">{greeting()}</p>
              <p className="mt-1 truncate text-2xl font-bold tracking-tight">
                {family?.name ?? '我的家庭'}
              </p>
            </div>
            <ChevronRight className="mt-1 size-5 shrink-0 text-white/70" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            {membersLoading ? (
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="size-8 rounded-full ring-2 ring-white/40"
                  />
                ))}
              </div>
            ) : (
              <div className="flex -space-x-2">
                {avatarMembers.map((m) => (
                  <span
                    key={m.id}
                    className="flex size-8 items-center justify-center rounded-full bg-white/90 text-xs font-semibold text-[#8a6420] ring-2 ring-white/40"
                  >
                    {(m.profile?.name ?? '?').trim().slice(0, 1).toUpperCase() || '?'}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-white/90">
              {memberCount ?? '…'} 位成员
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white/90">
              财源广进 {family ? daysSince(family.created_at) : '…'} 天
            </p>
            <span className="text-xs text-white/70">我的家庭 · 邀请家人一起记账</span>
          </div>
        </div>
      </Link>

      {/* ─── 入口列表 ─── */}
      <div className="space-y-2.5">
        <EntryRow
          to="/settings/members"
          icon={<Users className="size-5" />}
          iconClass="bg-orange-500/15 text-orange-600"
          title="家庭成员"
          description="查看和管理家庭成员"
          badge={memberCount != null ? `${memberCount} 位` : undefined}
        />
        <EntryRow
          to="/settings/ledgers"
          icon={<Wallet className="size-5" />}
          iconClass="bg-emerald-500/15 text-emerald-600"
          title="账本管理"
          description="日常 / 旅行 / 装修… 多账本"
          badge={ledgers ? `${ledgers.length} 个` : undefined}
        />
        <EntryRow
          to="/settings/categories"
          icon={<Tags className="size-5" />}
          iconClass="bg-violet-500/15 text-violet-600"
          title="分类管理"
          description="自定义收支分类，全家共享"
          badge={categories ? `${categories.length} 个` : undefined}
        />
        <EntryRow
          to="/settings/profile"
          icon={<CircleUserRound className="size-5" />}
          iconClass="bg-slate-500/15 text-slate-600"
          title="个人信息"
          description="昵称 · 邮箱 · 退出登录"
        />
      </div>
    </div>
  )
}
