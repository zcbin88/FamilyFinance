import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  type InfiniteScrollCustomEvent,
} from '@ionic/react'
import { TransactionDeleteAlert, TransactionEditModal } from '@/components/transaction/TransactionDialogs'
import TransactionList from '@/components/transaction/TransactionList'
import type { TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import {
  useDeleteTransaction,
  useSearchTransactions,
  useUpdateTransaction,
  type TransactionSearchType,
} from '@/hooks/useTransactions'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { ProfileLite, Transaction } from '@/types/database'

/** 关键词输入防抖时长，避免中文输入法组合期间反复打请求 */
const SEARCH_DEBOUNCE_MS = 300

export default function TransactionSearchPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [input, setInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<TransactionSearchType>('all')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(input.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input])

  const { data: categories } = useCategories(family?.id)
  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c])),
    [categories],
  )

  // 分类名命中关键词的分类 id：让「搜餐饮」也能搜到餐饮分类下的账单
  const keywordCategoryIds = useMemo(() => {
    if (!keyword || !categories) return []
    return categories.filter((c) => c.name.includes(keyword)).map((c) => c.id)
  }, [keyword, categories])

  const { data, isLoading, isFetching, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSearchTransactions({
      ledgerId: currentLedger?.id,
      keyword,
      type,
      categoryIds,
      keywordCategoryIds,
    })

  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()

  const transactions = useMemo(() => data?.pages.flatMap((p) => p.transactions) ?? [], [data])
  const total = data?.pages[0]?.total ?? 0
  const profileMap = useMemo(() => {
    const map = new Map<string, ProfileLite>()
    data?.pages.forEach((p) => p.profileMap.forEach((v, k) => map.set(k, v)))
    return map
  }, [data])

  const hasCriteria = !!keyword || type !== 'all' || categoryIds.length > 0
  // 关键词还在防抖中（输入值已变、查询值还没跟上）
  const isDebouncing = input.trim() !== keyword
  const searching = isLoading || isDebouncing

  // 全部加载完后再显示收支合计，避免只统计到部分数据造成误读
  const { expense, income } = useMemo(() => {
    let expense = 0
    let income = 0
    if (!hasNextPage) {
      for (const t of transactions) {
        if (t.type === 'expense') expense += t.amount
        else income += t.amount
      }
    }
    return { expense, income }
  }, [transactions, hasNextPage])

  const visibleCategories =
    type === 'all' ? categories ?? [] : (categories ?? []).filter((c) => c.type === type)

  function handleTypeChange(next: TransactionSearchType) {
    setType(next)
    // 切换类型后已选分类可能不属于该类型，清空避免出现空结果
    setCategoryIds([])
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
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
        账本：{currentLedger?.name ?? '…'} · 搜索全部月份
      </p>

      <IonSearchbar
        className="transactions-searchbar"
        value={input}
        placeholder="搜索备注或分类"
        enterkeyhint="search"
        debounce={0}
        onIonInput={(e) => setInput(e.detail.value ?? '')}
        onIonClear={() => setInput('')}
      />

      {/* 类型筛选 */}
      <IonSegment value={type} onIonChange={(e) => handleTypeChange(e.detail.value as TransactionSearchType)}>
        <IonSegmentButton value="all">
          <IonLabel>全部</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="expense">
          <IonLabel>支出</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="income">
          <IonLabel>收入</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {/* 分类筛选：横向滚动的胶囊按钮 */}
      {visibleCategories.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-1">
            <button
              type="button"
              onClick={() => setCategoryIds([])}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors',
                categoryIds.length === 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground active:bg-muted',
              )}
            >
              全部分类
            </button>
            {visibleCategories.map((cat) => {
              const active = categoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground active:bg-muted',
                  )}
                >
                  <CategoryIcon icon={cat.icon} color={active ? undefined : cat.color} className="size-3.5" />
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 结果统计 */}
      {hasCriteria && !searching && (
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>{isFetching ? '搜索中…' : `共 ${total} 笔`}</span>
          {!hasNextPage && transactions.length > 0 && (
            <span>
              {income > 0 && <span className="text-red-600">收 {formatMoney(income)} </span>}
              {expense > 0 && <span className="text-green-600">支 {formatMoney(expense)}</span>}
            </span>
          )}
        </div>
      )}

      {/* 结果列表 */}
      {!hasCriteria && !input.trim() ? (
        <div className="py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 text-muted-foreground">输入关键词或选择筛选条件开始搜索</p>
        </div>
      ) : searching ? (
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
          <p className="text-4xl">🫥</p>
          <p className="mt-3 text-muted-foreground">没有找到相关账单</p>
        </div>
      ) : (
        <>
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
