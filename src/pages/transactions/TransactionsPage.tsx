import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import {
  calendarClearOutline,
  chevronBack,
  chevronForward,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons'
import MonthPickerSheet from '@/components/common/MonthPickerSheet'
import TransactionForm, { type TransactionFormValues } from '@/components/transaction/TransactionForm'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import {
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/useTransactions'
import { CategoryIcon } from '@/lib/category-presets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/database'

/** 按日期分组：{ '2025-02-03': [tx...] } */
function groupByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const list = groups.get(tx.occurred_at) ?? []
    list.push(tx)
    groups.set(tx.occurred_at, list)
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

export default function TransactionsPage() {
  const { data: family } = useCurrentFamily()
  const { currentLedger } = useLedgerContext()

  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [monthOpen, setMonthOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const { data: categories } = useCategories(family?.id)
  const { data: result, isLoading } = useTransactions(currentLedger?.id, month)
  const updateTx = useUpdateTransaction()
  const deleteTx = useDeleteTransaction()

  const categoryMap = new Map(categories?.map((c) => [c.id, c]))
  const profileMap = result?.profileMap

  const groups = result ? groupByDate(result.transactions) : []

  // 月份统计
  const monthExpense = result?.transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0) ?? 0
  const monthIncome = result?.transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0) ?? 0

  function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setMonth(format(d, 'yyyy-MM'))
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        账本：{currentLedger?.name ?? '…'}
      </p>

      {/* 月份切换：IonDatetime month-year 原生月份选择 */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-1 py-1">
        <IonButton fill="clear" size="small" onClick={() => changeMonth(-1)} aria-label="上月">
          <IonIcon slot="icon-only" icon={chevronBack} />
        </IonButton>

        <IonButton fill="clear" size="small" onClick={() => setMonthOpen(true)}>
          <IonIcon slot="start" icon={calendarClearOutline} />
          {month}
        </IonButton>

        <IonButton fill="clear" size="small" onClick={() => changeMonth(1)} aria-label="下月">
          <IonIcon slot="icon-only" icon={chevronForward} />
        </IonButton>
      </div>

      <MonthPickerSheet
        isOpen={monthOpen}
        month={month}
        onClose={() => setMonthOpen(false)}
        onSelect={setMonth}
      />

      {/* 月份汇总 */}
      {!isLoading && result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">支出</p>
            <p className="truncate text-base font-semibold text-green-600 sm:text-lg">
              -{formatMoney(monthExpense)}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">收入</p>
            <p className="truncate text-base font-semibold text-red-600 sm:text-lg">
              +{formatMoney(monthIncome)}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs text-muted-foreground">结余</p>
            <p className="truncate text-base font-semibold sm:text-lg">
              {formatMoney(monthIncome - monthExpense)}
            </p>
          </div>
        </div>
      )}

      {/* 列表 */}
      {isLoading ? (
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
      ) : groups.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📒</p>
          <p className="mt-3 text-muted-foreground">{month} 还没有账单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, txs]) => {
            const dayExpense = txs
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0)
            const dayIncome = txs
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amount, 0)

            return (
              <div key={date}>
                {/* 日期小标题：卡片外，与旧版一致 */}
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <p className="m-0 text-sm font-medium text-muted-foreground">
                    {format(new Date(`${date}T00:00:00`), 'M月d日 EEEE', { locale: zhCN })}
                  </p>
                  <p className="m-0 text-xs text-muted-foreground">
                    {dayIncome > 0 && (
                      <span className="text-red-600">收 {formatMoney(dayIncome)} </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-green-600">支 {formatMoney(dayExpense)}</span>
                    )}
                  </p>
                </div>

                {/* 一天一张卡片 */}
                <div className="overflow-hidden rounded-xl border bg-card">
                  {txs.map((tx, idx) => {
                    const cat = categoryMap.get(tx.category_id)
                    const recorder = profileMap?.get(tx.user_id)
                    return (
                      <IonItemSliding key={tx.id}>
                        <IonItem
                          lines={idx === txs.length - 1 ? 'none' : 'full'}
                          detail={false}
                          onClick={() => setEditing(tx)}
                          className="[--background:var(--card)] [--border-color:var(--border)] [--padding-start:0] [--inner-padding-end:0] [--min-height:0]"
                        >
                          <div className="flex w-full items-center gap-3 px-4 py-3">
                            <span
                              className="flex size-10 shrink-0 items-center justify-center rounded-full"
                              style={{ backgroundColor: `${cat?.color ?? '#6b7280'}1f` }}
                            >
                              <CategoryIcon
                                icon={cat?.icon ?? 'ellipsis'}
                                color={cat?.color}
                                className="size-5"
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-3">
                                <p className="m-0 min-w-0 flex-1 truncate text-sm font-medium">
                                  {cat?.name ?? '未知分类'}
                                </p>
                                <span
                                  className={cn(
                                    'shrink-0 text-sm font-semibold tabular-nums',
                                    tx.type === 'expense' ? 'text-green-600' : 'text-red-600',
                                  )}
                                >
                                  {tx.type === 'expense' ? '-' : '+'}
                                  {formatMoney(tx.amount)}
                                </span>
                              </div>
                              <p className="m-0 mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="min-w-0 flex-1 truncate">{tx.note}</span>
                                <span className="shrink-0">
                                  {tx.pay_method ?? '现金'} · {recorder?.name ?? '未知'}
                                </span>
                              </p>
                            </div>
                          </div>
                        </IonItem>

                        {/* 左滑操作：编辑 / 删除 */}
                        <IonItemOptions side="end">
                          <IonItemOption color="primary" onClick={() => setEditing(tx)}>
                            <IonIcon slot="icon-only" icon={pencilOutline} />
                          </IonItemOption>
                          <IonItemOption color="danger" onClick={() => setDeleting(tx)}>
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 编辑：Ionic 全屏 Modal */}
      <IonModal isOpen={!!editing} onDidDismiss={() => setEditing(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>编辑账单</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setEditing(null)}>关闭</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="mx-auto w-full max-w-lg px-4 py-5">
            {editing && family && currentLedger && (
              <TransactionForm
                key={editing.id}
                familyId={family.id}
                initial={editing}
                submitting={updateTx.isPending}
                onSubmit={handleUpdate}
                submitLabel="保存修改"
              />
            )}
          </div>
        </IonContent>
      </IonModal>

      {/* 删除确认：IonAlert 原生弹窗 */}
      <IonAlert
        isOpen={!!deleting}
        header="删除这笔账单？"
        message={
          deleting
            ? `${categoryMap.get(deleting.category_id)?.name ?? '未知分类'} · ${formatMoney(deleting.amount)} 元，删除后不可恢复。`
            : ''
        }
        buttons={[
          { text: '取消', role: 'cancel' },
          { text: '确认删除', role: 'destructive', handler: handleDelete },
        ]}
        onDidDismiss={() => setDeleting(null)}
      />
    </div>
  )
}
