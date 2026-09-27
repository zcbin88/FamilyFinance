import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  IonButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
  type InfiniteScrollCustomEvent,
} from '@ionic/react'
import {
  calendarClearOutline,
  chevronBack,
  chevronForward,
  close,
  funnelOutline,
} from 'ionicons/icons'
import MonthPickerSheet from '@/components/common/MonthPickerSheet'
import TransactionFilterSheet from '@/components/transaction/TransactionFilterSheet'
import type { TransactionFormValues } from '@/components/transaction/TransactionForm'
import {
  TransactionDeleteAlert,
  TransactionEditModal,
} from '@/components/transaction/TransactionDialogs'
import TransactionList from '@/components/transaction/TransactionList'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily, useFamilyMembers } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import {
  useDeleteTransaction,
  useMonthSummary,
  useMonthlyTransactions,
  useUpdateTransaction,
  type MonthFilters,
  type TransactionSearchType,
} from '@/hooks/useTransactions'
import { formatMoney } from '@/lib/money'
import type { ProfileLite, Transaction } from '@/types/database'

/** 筛选栏里一个已选条件的胶囊，可点击删除 */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary transition-colors active:bg-primary/20"
    >
      <span className="max-w-24 truncate">{label}</span>
      <IonIcon icon={close} className="text-xs" />
    </button>
  )
}

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [month, setMonth] = useState(
    () => searchParams.get('month') ?? format(new Date(), 'yyyy-MM'),
  )
  const [monthOpen, setMonthOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  // 筛选条件：URL 参数为唯一数据源，多选维度用逗号分隔。
  // 从统计页钻取（?category=xxx&member=xxx&type=expense）也自然落到这里。
  const typeFilter = (searchParams.get('type') as 'expense' | 'income' | null) ?? null
  const categoryFilterIds = useMemo(
    () => searchParams.get('category')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  )
  const memberFilterIds = useMemo(
    () => searchParams.get('member')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  )
  const hasFilter = !!typeFilter || categoryFilterIds.length > 0 || memberFilterIds.length > 0
  const activeCount = (typeFilter ? 1 : 0) + categoryFilterIds.length + memberFilterIds.length

  const { data: categories } = useCategories(family?.id)
  const { data: members } = useFamilyMembers(family?.id)

  // 明细列表：服务端分页 + 筛选（无限滚动）
  const monthFilters: MonthFilters = {
    type: typeFilter ?? 'all',
    categoryIds: categoryFilterIds,
    memberIds: memberFilterIds,
  }
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMonthlyTransactions(currentLedger?.id, month, monthFilters)

  // 月度汇总：只取 type/amount 两列，轻量，且与筛选条件保持一致
  const { data: summary, isLoading: summaryLoading } = useMonthSummary(
    currentLedger?.id,
    month,
    monthFilters,
  )

  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()

  const transactions = useMemo(() => data?.pages.flatMap((p) => p.transactions) ?? [], [data])
  const total = data?.pages[0]?.total ?? 0
  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    data?.pages.forEach((p) => p.profileMap.forEach((v, k) => map.set(k, v)))
    return map
  }, [data])

  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c])),
    [categories],
  )

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>()
    members?.forEach((m) => map.set(m.user_id, m.profile?.name ?? '未设置昵称'))
    return map
  }, [members])

  // 筛选面板里的分类：跟随类型（支出只显示支出分类，收入只显示收入分类），
  // 且支出分类排在前面、收入分类排在后面
  const filterCategories = useMemo(() => {
    if (!categories) return []
    const base = !typeFilter ? categories : categories.filter((c) => c.type === typeFilter)
    return [...base].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1
      return a.sort_order - b.sort_order
    })
  }, [categories, typeFilter])

  const monthExpense = summary?.expense ?? 0
  const monthIncome = summary?.income ?? 0

  // 账本尚未解析完成时先展示骨架，避免闪现「还没有账单」空态
  const listLoading = isLoading || !currentLedger

  function updateFilters(mutate: (p: URLSearchParams) => void) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        mutate(next)
        return next
      },
      { replace: true },
    )
  }

  function applyMonth(next: string) {
    setMonth(next)
    updateFilters((p) => p.set('month', next))
  }

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    applyMonth(format(d, 'yyyy-MM'))
  }

  function setTypeFilter(next: TransactionSearchType) {
    updateFilters((p) => {
      if (next === 'all') p.delete('type')
      else p.set('type', next)

      // 类型切到支出/收入时，清掉另一类型的已选分类，避免永远空结果
      if (next !== 'all') {
        const keep = categoryFilterIds.filter((id) => categoryMap.get(id)?.type === next)
        if (keep.length) p.set('category', keep.join(','))
        else p.delete('category')
      }
    })
  }

  function toggleCategory(id: string) {
    updateFilters((p) => {
      const next = new Set(categoryFilterIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size) p.set('category', [...next].join(','))
      else p.delete('category')
    })
  }

  function toggleMember(id: string) {
    updateFilters((p) => {
      const next = new Set(memberFilterIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size) p.set('member', [...next].join(','))
      else p.delete('member')
    })
  }

  function removeCategory(id: string) {
    updateFilters((p) => {
      const list = categoryFilterIds.filter((x) => x !== id)
      if (list.length) p.set('category', list.join(','))
      else p.delete('category')
    })
  }

  function removeMember(id: string) {
    updateFilters((p) => {
      const list = memberFilterIds.filter((x) => x !== id)
      if (list.length) p.set('member', list.join(','))
      else p.delete('member')
    })
  }

  function clearCategories() {
    updateFilters((p) => p.delete('category'))
  }

  function clearMembers() {
    updateFilters((p) => p.delete('member'))
  }

  function resetFilters() {
    updateFilters((p) => {
      p.delete('type')
      p.delete('category')
      p.delete('member')
    })
  }

  async function handleUpdate(values: TransactionFormValues) {
    if (!editing) return
    try {
      await updateTx.mutateAsync({ id: editing.id, ...values })
      toast.success('已更新')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteTx.mutateAsync(deleting.id)
      toast.success('已删除')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleInfinite(ev: InfiniteScrollCustomEvent) {
    if (hasNextPage && !isFetchingNextPage) await fetchNextPage()
    await ev.target.complete()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        账本：{currentLedger?.name ?? '…'}
      </p>

      {/* 月份切换 */}
      <div className="flex items-center gap-1 rounded-xl border bg-card px-1 py-1">
        <IonButton fill="clear" size="small" onClick={() => changeMonth(-1)} aria-label="上月">
          <IonIcon slot="icon-only" icon={chevronBack} />
        </IonButton>

        <IonButton
          fill="clear"
          size="small"
          className="flex-1"
          onClick={() => setMonthOpen(true)}
        >
          <IonIcon slot="start" icon={calendarClearOutline} />
          {month}
        </IonButton>

        <IonButton fill="clear" size="small" onClick={() => changeMonth(1)} aria-label="下月">
          <IonIcon slot="icon-only" icon={chevronForward} />
        </IonButton>
      </div>

      {/* 常驻筛选栏：单行，筛选按钮 + 已选条件胶囊 + 清除 */}
      <div className="flex items-center gap-2 rounded-xl border bg-card px-2 py-1.5">
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors active:bg-muted"
        >
          <IonIcon icon={funnelOutline} className="text-sm" />
          筛选
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>

        {!hasFilter ? (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            类型 · 分类 · 成员
          </span>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
              {typeFilter && (
                <FilterChip
                  label={typeFilter === 'expense' ? '支出' : '收入'}
                  onRemove={() => setTypeFilter('all')}
                />
              )}
              {categoryFilterIds.map((id) => (
                <FilterChip
                  key={`c-${id}`}
                  label={categoryMap.get(id)?.name ?? '未知分类'}
                  onRemove={() => removeCategory(id)}
                />
              ))}
              {memberFilterIds.map((id) => (
                <FilterChip
                  key={`m-${id}`}
                  label={memberNameMap.get(id) ?? '未知成员'}
                  onRemove={() => removeMember(id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 text-sm font-medium text-primary"
            >
              清除
            </button>
          </>
        )}
      </div>

      <MonthPickerSheet
        isOpen={monthOpen}
        month={month}
        onClose={() => setMonthOpen(false)}
        onSelect={applyMonth}
      />

      <TransactionFilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        type={typeFilter ?? 'all'}
        onTypeChange={setTypeFilter}
        categories={filterCategories}
        categoryIds={categoryFilterIds}
        onToggleCategory={toggleCategory}
        onClearCategories={clearCategories}
        members={members ?? []}
        memberIds={memberFilterIds}
        onToggleMember={toggleMember}
        onClearMembers={clearMembers}
        onReset={resetFilters}
      />

      {/* 月份汇总（与筛选一致） */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">支出</p>
          <p className="truncate text-base font-semibold text-green-600 sm:text-lg">
            -{summaryLoading || !currentLedger ? '…' : formatMoney(monthExpense)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">收入</p>
          <p className="truncate text-base font-semibold text-red-600 sm:text-lg">
            +{summaryLoading || !currentLedger ? '…' : formatMoney(monthIncome)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">结余</p>
          <p className="truncate text-base font-semibold sm:text-lg">
            {summaryLoading || !currentLedger ? '…' : formatMoney(monthIncome - monthExpense)}
          </p>
        </div>
      </div>

      {/* 列表 */}
      {listLoading ? (
        <IonList>
          {[0, 1, 2, 3].map((i) => (
            <IonItem key={i}>
              <IonSkeletonText
                animated
                slot="start"
                style={{ width: 36, height: 36, borderRadius: '50%' }}
              />
              <IonLabel>
                <IonSkeletonText animated style={{ width: '60%' }} />
                <IonSkeletonText animated style={{ width: '40%' }} />
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">{hasFilter ? '🔍' : '📒'}</p>
          <p className="mt-3 text-muted-foreground">
            {hasFilter ? '没有符合条件的账单' : `${month} 还没有账单`}
          </p>
        </div>
      ) : (
        <>
          {total > 0 && (
            <p className="px-1 text-xs text-muted-foreground">共 {total} 笔</p>
          )}
          <TransactionList
            transactions={transactions}
            categoryMap={categoryMap}
            profileMap={profileMap}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
          <IonInfiniteScroll disabled={!hasNextPage} onIonInfinite={handleInfinite}>
            <IonInfiniteScrollContent loadingText="加载中…" />
          </IonInfiniteScroll>
        </>
      )}

      <TransactionEditModal
        transaction={editing}
        familyId={family?.id}
        submitting={updateTx.isPending}
        onSubmit={handleUpdate}
        onClose={() => setEditing(null)}
      />

      <TransactionDeleteAlert
        transaction={deleting}
        categoryMap={categoryMap}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
