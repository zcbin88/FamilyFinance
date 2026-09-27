import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addMonths, format, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { ProfileLite, Transaction } from '@/types/database'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (ledgerId: string, month: string) =>
    [...transactionKeys.all, 'list', ledgerId, month] as const,
  monthly: (ledgerId: string, month: string, filters: string) =>
    [...transactionKeys.all, 'monthly', ledgerId, month, filters] as const,
  monthSummary: (ledgerId: string, month: string, filters: string) =>
    [...transactionKeys.all, 'monthSummary', ledgerId, month, filters] as const,
  search: (
    familyId: string,
    ledgerIds: string[],
    keyword: string,
    type: TransactionSearchType,
    categoryIds: string[],
    memberIds: string[],
  ) =>
    [
      ...transactionKeys.all,
      'search',
      familyId,
      ledgerIds.join(','),
      keyword,
      type,
      categoryIds.join(','),
      memberIds.join(','),
    ] as const,
}

export interface TransactionQueryResult {
  transactions: Transaction[]
  profileMap: Map<string, ProfileLite>
}

/** 查询记账人资料（列表展示用） */
async function fetchProfileMap(userIds: string[]): Promise<Map<string, ProfileLite>> {
  if (userIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds)
  if (error) throw error
  return new Map(data.map((p) => [p.id, p]))
}

/** 某账本某月的交易（occurred_at 在 [月初, 下月初)），附带记账人资料 */
export function useTransactions(ledgerId?: string | null, month?: string) {
  return useQuery({
    queryKey: transactionKeys.list(ledgerId ?? 'none', month ?? 'none'),
    enabled: !!ledgerId && !!month,
    queryFn: async (): Promise<TransactionQueryResult> => {
      const start = startOfMonth(new Date(`${month}-01T00:00:00`))
      const end = addMonths(start, 1)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('ledger_id', ledgerId!)
        .gte('occurred_at', format(start, 'yyyy-MM-dd'))
        .lt('occurred_at', format(end, 'yyyy-MM-dd'))
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error

      const transactions = data as Transaction[]

      const profileMap = await fetchProfileMap([...new Set(transactions.map((t) => t.user_id))])

      return { transactions, profileMap }
    },
  })
}

/** 月度明细的筛选条件（与明细页 URL 参数一一对应） */
export interface MonthFilters {
  type?: TransactionSearchType
  categoryIds?: string[]
  memberIds?: string[]
}

/** 把筛选条件序列化成稳定字符串，作为 queryKey 的一部分 */
function monthFiltersKey(f: MonthFilters) {
  const type = f.type ?? 'all'
  const categoryIds = [...(f.categoryIds ?? [])].sort().join(',')
  const memberIds = [...(f.memberIds ?? [])].sort().join(',')
  return `${type}|${categoryIds}|${memberIds}`
}

/** 某月明细的收支合计（只取 type/amount 两列，轻量；支持与明细一致的筛选） */
export interface MonthSummary {
  expense: number // 分
  income: number // 分
  count: number
}

export function useMonthSummary(
  ledgerId?: string | null,
  month?: string | null,
  filters?: MonthFilters,
) {
  const type = filters?.type ?? 'all'
  const categoryIds = filters?.categoryIds ?? []
  const memberIds = filters?.memberIds ?? []

  return useQuery({
    queryKey: transactionKeys.monthSummary(
      ledgerId ?? 'none',
      month ?? 'none',
      monthFiltersKey({ type, categoryIds, memberIds }),
    ),
    enabled: !!ledgerId && !!month,
    queryFn: async (): Promise<MonthSummary> => {
      const start = startOfMonth(new Date(`${month}-01T00:00:00`))
      const end = addMonths(start, 1)

      let query = supabase
        .from('transactions')
        .select('type, amount')
        .eq('ledger_id', ledgerId!)
        .gte('occurred_at', format(start, 'yyyy-MM-dd'))
        .lt('occurred_at', format(end, 'yyyy-MM-dd'))

      if (type !== 'all') query = query.eq('type', type)
      if (categoryIds.length > 0) query = query.in('category_id', categoryIds)
      if (memberIds.length > 0) query = query.in('user_id', memberIds)

      const { data, error } = await query
      if (error) throw error

      let expense = 0
      let income = 0
      for (const tx of data ?? []) {
        if (tx.type === 'expense') expense += tx.amount
        else income += tx.amount
      }
      return { expense, income, count: (data ?? []).length }
    },
  })
}

const MONTHLY_PAGE_SIZE = 50

export interface MonthTransactionsPage {
  transactions: Transaction[]
  profileMap: Map<string, ProfileLite>
  /** 命中的总条数（不分页） */
  total: number
}

/**
 * 某账本某月的明细列表（服务端分页 + 筛选），供明细页做无限滚动。
 * 与 useTransactions（全量）区分开：后者仍用于仪表盘/统计等需要整月聚合的场景。
 */
export function useMonthlyTransactions(
  ledgerId?: string | null,
  month?: string | null,
  filters?: MonthFilters,
) {
  const type = filters?.type ?? 'all'
  const categoryIds = filters?.categoryIds ?? []
  const memberIds = filters?.memberIds ?? []

  return useInfiniteQuery({
    queryKey: transactionKeys.monthly(
      ledgerId ?? 'none',
      month ?? 'none',
      monthFiltersKey({ type, categoryIds, memberIds }),
    ),
    enabled: !!ledgerId && !!month,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<MonthTransactionsPage> => {
      const start = startOfMonth(new Date(`${month}-01T00:00:00`))
      const end = addMonths(start, 1)

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('ledger_id', ledgerId!)
        .gte('occurred_at', format(start, 'yyyy-MM-dd'))
        .lt('occurred_at', format(end, 'yyyy-MM-dd'))

      if (type !== 'all') query = query.eq('type', type)
      if (categoryIds.length > 0) query = query.in('category_id', categoryIds)
      if (memberIds.length > 0) query = query.in('user_id', memberIds)

      const { data, error, count } = await query
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + MONTHLY_PAGE_SIZE - 1)
      if (error) throw error

      const transactions = data as Transaction[]
      const profileMap = await fetchProfileMap([...new Set(transactions.map((t) => t.user_id))])
      return { transactions, profileMap, total: count ?? transactions.length }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.transactions.length === MONTHLY_PAGE_SIZE
        ? allPages.length * MONTHLY_PAGE_SIZE
        : undefined,
  })
}

export type TransactionSearchType = 'all' | 'expense' | 'income'

export interface TransactionSearchParams {
  /** 当前家庭 id（用于限定搜索范围） */
  familyId?: string | null
  /** 账本多选；空数组 = 全部账本 */
  ledgerIds?: string[]
  /** 已防抖的关键词，同时匹配备注与分类名 */
  keyword?: string
  type?: TransactionSearchType
  /** 分类多选筛选 */
  categoryIds?: string[]
  /** 分类名命中关键词的分类 id（把命中分类的交易也一并捞出） */
  keywordCategoryIds?: string[]
  /** 成员多选筛选（记账人 user_id） */
  memberIds?: string[]
}

const SEARCH_PAGE_SIZE = 30

export interface TransactionSearchPage {
  transactions: Transaction[]
  profileMap: Map<string, ProfileLite>
  /** 命中的总条数（不分页） */
  total: number
}

/**
 * PostgREST 逻辑表达式（or=）里的值：含 `,` `.` `:` `()` `"` 等保留字符时
 * 必须用双引号包起来，否则会破坏过滤器语法。
 */
function quoteOrValue(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

/**
 * 搜索交易（P1）：当前家庭全历史，服务端分页。
 * - 支持多选账本 / 多选成员 / 类型 / 多选分类筛选
 * - 进入页面即默认按「全部账本」发起查询，无需先输入关键词
 * - 关键词匹配「备注」或「分类名」；分类名由调用方在客户端解析成 id 传入
 */
export function useSearchTransactions({
  familyId,
  ledgerIds = [],
  keyword = '',
  type = 'all',
  categoryIds = [],
  memberIds = [],
  keywordCategoryIds = [],
}: TransactionSearchParams) {
  const trimmed = keyword.trim()
  const sortedLedgerIds = [...ledgerIds].sort()
  const sortedCategoryIds = [...categoryIds].sort()
  const sortedMemberIds = [...memberIds].sort()

  return useInfiniteQuery({
    queryKey: transactionKeys.search(
      familyId ?? 'none',
      sortedLedgerIds,
      trimmed,
      type,
      sortedCategoryIds,
      sortedMemberIds,
    ),
    enabled: !!familyId,
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<TransactionSearchPage> => {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('family_id', familyId!)

      if (ledgerIds.length > 0) query = query.in('ledger_id', ledgerIds)
      if (memberIds.length > 0) query = query.in('user_id', memberIds)
      if (type !== 'all') query = query.eq('type', type)
      if (categoryIds.length > 0) query = query.in('category_id', categoryIds)

      if (trimmed) {
        const pattern = `%${trimmed}%`
        if (keywordCategoryIds.length > 0) {
          // 关键词命中备注，或命中的分类
          query = query.or(
            `note.ilike.${quoteOrValue(pattern)},category_id.in.(${keywordCategoryIds.join(',')})`,
          )
        } else {
          query = query.ilike('note', pattern)
        }
      }

      const { data, error, count } = await query
        .order('occurred_at', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + SEARCH_PAGE_SIZE - 1)
      if (error) throw error

      const transactions = data as Transaction[]
      const profileMap = await fetchProfileMap([...new Set(transactions.map((t) => t.user_id))])
      return { transactions, profileMap, total: count ?? transactions.length }
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.transactions.length === SEARCH_PAGE_SIZE
        ? allPages.length * SEARCH_PAGE_SIZE
        : undefined,
  })
}

export type TransactionInput = {
  category_id: string
  type: 'expense' | 'income'
  amount: number // 分
  note?: string
  pay_method?: string | null
  occurred_at: string
}

/** 新增交易（family_id/ledger_id 由 hook 补全，user_id 由服务端触发器写入） */
export function useCreateTransaction(familyId?: string | null, ledgerId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { error } = await supabase
        .from('transactions')
        .insert({ family_id: familyId!, ledger_id: ledgerId!, ...input })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

/** 更新交易（家庭成员均可改，RLS 保证） */
export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Omit<TransactionInput, 'ledger_id'>>) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .select('id')
      if (error) throw error
      // RLS 拒绝或账单不存在时 0 行受影响，需显式报错，避免「假成功」
      if (!data || data.length === 0) throw new Error('账单不存在或已被删除')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}

/** 删除交易（家庭成员可删） */
export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) throw new Error('账单不存在或已被删除')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionKeys.all }),
  })
}
