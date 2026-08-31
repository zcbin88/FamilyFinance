import { useMemo } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { formatMoney } from '@/lib/money'

export interface CategorySlice {
  categoryId: string
  name: string
  color: string
  amount: number // 分
}

/** 支出分类占比（某账本某月，前端聚合；最多展示 6 类 + 其他） */
export default function CategoryPie({
  familyId,
  ledgerId,
  month,
  title = '支出分类占比',
}: {
  familyId?: string | null
  ledgerId?: string | null
  month: string
  title?: string
}) {
  const { data: categories } = useCategories(familyId)
  const { data: result } = useTransactions(ledgerId, month)

  const { slices, otherAmount } = useMemo<{
    slices: CategorySlice[]
    otherAmount: number
  }>(() => {
    if (!result || !categories) return { slices: [], otherAmount: 0 }
    const catMap = new Map(categories.map((c) => [c.id, c]))

    const byCat = new Map<string, number>()
    for (const tx of result.transactions) {
      if (tx.type !== 'expense') continue
      byCat.set(tx.category_id, (byCat.get(tx.category_id) ?? 0) + tx.amount)
    }

    const list = [...byCat.entries()]
      .map(([categoryId, amount]) => {
        const cat = catMap.get(categoryId)
        return cat ? { categoryId, name: cat.name, color: cat.color, amount } : null
      })
      .filter((s): s is CategorySlice => !!s)
      .sort((a, b) => b.amount - a.amount)

    const top = list.slice(0, 6)
    const topIds = new Set(top.map((s) => s.categoryId))
    const other = list.filter((s) => !topIds.has(s.categoryId)).reduce((s, x) => s + x.amount, 0)
    return { slices: top, otherAmount: other }
  }, [result, categories])

  const chartData = slices.map((s) => ({ name: s.name, value: s.amount, fill: s.color }))
  if (otherAmount > 0) chartData.push({ name: '其他', value: otherAmount, fill: '#94a3b8' })

  const chartConfig: ChartConfig = {}
  for (const s of slices) chartConfig[s.categoryId] = { label: s.name, color: s.color }
  if (otherAmount > 0) chartConfig.other = { label: '其他', color: '#94a3b8' }

  const total = slices.reduce((s, x) => s + x.amount, 0) + otherAmount
  const isEmpty = chartData.length === 0

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">本月暂无支出</p>
      ) : (
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-60 w-full">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const pct = total > 0 ? (((value as number) / total) * 100).toFixed(1) : '0'
                    return `${name}：¥${formatMoney(value as number)}（${pct}%）`
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={75}
              strokeWidth={2}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="flex-wrap gap-2 [&>*]:justify-start"
            />
          </PieChart>
        </ChartContainer>
      )}
    </div>
  )
}
