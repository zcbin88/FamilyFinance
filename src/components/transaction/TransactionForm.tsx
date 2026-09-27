import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  IonButton,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/react'
import { CategoryIcon, PAY_METHODS } from '@/lib/category-presets'
import { useCategories } from '@/hooks/useCategories'
import { yuanToFen } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Transaction, TransactionType } from '@/types/database'

export interface TransactionFormValues {
  category_id: string
  type: TransactionType
  amount: number
  note?: string
  pay_method?: string | null
  occurred_at: string
}

interface TransactionFormProps {
  familyId: string
  /** 传入则为编辑模式 */
  initial?: Transaction | null
  submitting: boolean
  onSubmit: (values: TransactionFormValues) => Promise<void>
  submitLabel?: string
}

/**
 * 记账表单（Ionic 版）
 * - 收/支：IonSegment 原生分段控件
 * - 金额：IonInput 大字号突出主操作
 * - 日期：type="date"，直接唤起 iOS/Android 系统原生日期选择器
 * - 付款方式：IonSelect action-sheet，底部原生弹出
 */
export default function TransactionForm({
  familyId,
  initial,
  submitting,
  onSubmit,
  submitLabel = '保存',
}: TransactionFormProps) {
  const { data: categories } = useCategories(familyId)

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount / 100) : '')
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '')
  const [occurredAt, setOccurredAt] = useState<Date>(
    initial ? new Date(`${initial.occurred_at}T00:00:00`) : new Date(),
  )
  const [payMethod, setPayMethod] = useState<string | null>(initial?.pay_method ?? null)
  const [note, setNote] = useState(initial?.note ?? '')

  const filteredCategories = useMemo(
    () => categories?.filter((c) => c.type === type) ?? [],
    [categories, type],
  )

  // 切换类型时重置分类选择
  function handleTypeChange(next: TransactionType) {
    setType(next)
    setCategoryId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const yuan = parseFloat(amount)
    if (!amount || Number.isNaN(yuan) || yuan <= 0) return
    if (!categoryId) return

    await onSubmit({
      category_id: categoryId,
      type,
      amount: yuanToFen(yuan),
      note: note.trim() || undefined,
      pay_method: payMethod,
      occurred_at: format(occurredAt, 'yyyy-MM-dd'),
    })
  }

  const amountInvalid =
    amount !== '' && (Number.isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 类型切换 */}
      <IonSegment
        value={type}
        onIonChange={(e) => handleTypeChange(e.detail.value as TransactionType)}
      >
        <IonSegmentButton value="expense">
          <IonLabel>支出</IonLabel>
        </IonSegmentButton>
        <IonSegmentButton value="income">
          <IonLabel>收入</IonLabel>
        </IonSegmentButton>
      </IonSegment>

      {/* 金额 */}
      <div className="space-y-1.5">
        <IonInput
          inputmode="decimal"
          label="金额（元）"
          labelPlacement="stacked"
          placeholder="0.00"
          value={amount}
          onIonInput={(e) => setAmount(e.detail.value ?? '')}
          className={cn('form-field tx-amount', amountInvalid && 'ion-invalid ion-touched')}
          autoFocus
        />
        {amountInvalid && <p className="px-1 text-sm text-destructive">请输入大于 0 的金额</p>}
      </div>

      {/* 分类 */}
      <div className="space-y-2">
        <p className="px-1 text-sm font-medium text-muted-foreground">分类</p>
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-2 transition-all',
                  'active:scale-95',
                  categoryId === cat.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border active:bg-muted',
                )}
              >
                <span
                  className="flex size-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${cat.color}1f` }}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} className="size-4" />
                </span>
                <span className="text-xs">{cat.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">该类型暂无分类，请先在「我的」中添加</p>
        )}
      </div>

      {/* 日期 + 付款方式 */}
      <div className="grid grid-cols-2 gap-3">
        <IonInput
          type="date"
          className="form-field"
          label="日期"
          labelPlacement="stacked"
          value={format(occurredAt, 'yyyy-MM-dd')}
          onIonInput={(e) => {
            const v = e.detail.value
            if (v) setOccurredAt(new Date(`${v.slice(0, 10)}T00:00:00`))
          }}
        />

        <IonSelect
          interface="action-sheet"
          className="form-field"
          label="付款方式"
          labelPlacement="stacked"
          placeholder="不选"
          value={payMethod ?? undefined}
          onIonChange={(e) => setPayMethod((e.detail.value as string | undefined) ?? null)}
          cancelText="取消"
        >
          {PAY_METHODS.map((m) => (
            <IonSelectOption key={m} value={m}>
              {m}
            </IonSelectOption>
          ))}
        </IonSelect>
      </div>

      {/* 备注 */}
      <IonTextarea
        className="form-field"
        label="备注"
        labelPlacement="stacked"
        placeholder="例如：和老婆的晚餐"
        value={note}
        onIonInput={(e) => setNote(e.detail.value ?? '')}
        maxlength={100}
        autoGrow
      />

      <IonButton
        type="submit"
        expand="block"
        size="large"
        disabled={submitting || amountInvalid || !amount || !categoryId}
      >
        {submitting ? '保存中…' : submitLabel}
      </IonButton>
    </form>
  )
}
