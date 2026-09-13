import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSkeletonText,
} from '@ionic/react'
import {
  calendarClearOutline,
  chevronBack,
  chevronForward,
  searchOutline,
} from 'ionicons/icons'
import MonthPickerSheet from '@/components/common/MonthPickerSheet'
import type { TransactionFormValues } from '@/components/transaction/TransactionForm'
import {
  TransactionDeleteAlert,
  TransactionEditModal,
} from '@/components/transaction/TransactionDialogs'
import TransactionList from '@/components/transaction/TransactionList'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import {
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/useTransactions'
import { formatMoney } from '@/lib/money'
import type { Transaction } from '@/types/database'

export default function TransactionsPage() {
  const navigate = useNavigate()
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

      {/* 月份切换 + 搜索入口 */}
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

        <div className="mx-0.5 h-6 w-px shrink-0 bg-border" />

        <IonButton
          fill="clear"
          size="small"
          onClick={() => navigate('/transactions/search')}
          aria-label="搜索账单"
        >
          <IonIcon slot="icon-only" icon={searchOutline} />
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
      ) : !result || result.transactions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl">📒</p>
          <p className="mt-3 text-muted-foreground">{month} 还没有账单</p>
        </div>
      ) : (
        <TransactionList
          transactions={result.transactions}
          categoryMap={categoryMap}
          profileMap={result.profileMap}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
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
