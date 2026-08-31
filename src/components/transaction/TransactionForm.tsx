import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CategoryIcon, PAY_METHODS } from '@/lib/category-presets'
import { useCategories } from '@/hooks/useCategories'
import { yuanToFen } from '@/lib/money'
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

export default function TransactionForm({
  familyId,
  initial,
  submitting,
  onSubmit,
  submitLabel = '保存',
}: TransactionFormProps) {
  const { data: categories } = useCategories(familyId)

  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(
    initial ? String(initial.amount / 100) : '',
  )
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

  const amountInvalid = amount !== '' && (Number.isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 类型切换 */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={cn(
              'rounded-lg py-2 text-sm font-medium transition-colors',
              type === t
                ? t === 'expense'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-emerald-600 text-white'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      {/* 金额 */}
      <div className="space-y-2">
        <Label htmlFor="amount">金额（元）</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
            ¥
          </span>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={cn('h-14 pl-9 text-2xl font-semibold', amountInvalid && 'border-destructive')}
            autoFocus
          />
        </div>
        {amountInvalid && (
          <p className="text-sm text-destructive">请输入大于 0 的金额</p>
        )}
      </div>

      {/* 分类 */}
      <div className="space-y-2">
        <Label>分类</Label>
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors',
                  categoryId === cat.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted',
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
          <p className="text-sm text-muted-foreground">该类型暂无分类，请先在设置中添加</p>
        )}
      </div>

      {/* 日期 + 付款方式 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 font-normal"
              >
                <CalendarIcon className="size-4" />
                {format(occurredAt, 'yyyy-MM-dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={occurredAt}
                onSelect={(d) => {
                  if (d) setOccurredAt(d)
                }}
                locale={zhCN}
                autoFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>付款方式</Label>
          <Select value={payMethod ?? undefined} onValueChange={setPayMethod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="不选" />
            </SelectTrigger>
            <SelectContent>
              {PAY_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 备注 */}
      <div className="space-y-2">
        <Label htmlFor="note">备注</Label>
        <Input
          id="note"
          placeholder="例如：和老婆的晚餐"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || amountInvalid || !amount || !categoryId}
      >
        {submitting ? '保存中…' : submitLabel}
      </Button>
    </form>
  )
}
