import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useMonthlyTrend } from '@/hooks/useStats'

const chartConfig = {
  expense: { label: '支出', color: '#ef4444' },
  income: { label: '收入', color: '#10b981' },
} satisfies ChartConfig

/** 近 N 个月收支趋势柱状图 */
export default function TrendChart({
  ledgerId,
  months = 6,
}: {
  ledgerId?: string | null
  months?: number
}) {
  const { data, isLoading } = useMonthlyTrend(ledgerId, months)

  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>
  }

  const chartData =
    data?.map((m) => ({
      month: m.month.slice(5), // MM
      expense: m.expense / 100,
      income: m.income / 100,
    })) ?? []

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => `${v}`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name) =>
                `${name === '支出' ? '支出' : '收入'}：¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
              }
            />
          }
        />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
        <ChartLegend content={<ChartLegendContent />} className="mt-2" />
      </BarChart>
    </ChartContainer>
  )
}
