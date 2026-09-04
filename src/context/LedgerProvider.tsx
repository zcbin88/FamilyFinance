import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useCurrentFamily } from '@/hooks/useFamily'
import { useLedgers } from '@/hooks/useLedgers'
import type { Ledger } from '@/types/database'

interface LedgerContextValue {
  ledgers: Ledger[] | undefined
  currentLedger: Ledger | null
  isLoading: boolean
  setCurrentLedger: (id: string) => void
}

const LedgerContext = createContext<LedgerContextValue>({
  ledgers: undefined,
  currentLedger: null,
  isLoading: true,
  setCurrentLedger: () => {},
})

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { data: family } = useCurrentFamily()
  const { data: ledgers, isLoading } = useLedgers(family?.id)

  const storageKey = family ? `ledger:current:${family.id}` : null

  // 家庭变化时读取该家庭的记忆账本（React 官方"render 期间调整状态"模式）
  const [ledgerId, setLedgerId] = useState<string | null>(null)
  const [lastKey, setLastKey] = useState<string | null>(storageKey)
  if (storageKey !== lastKey) {
    setLastKey(storageKey)
    setLedgerId(storageKey ? localStorage.getItem(storageKey) : null)
  }

  // 解析当前账本：记忆优先 → 默认账本 → 第一个
  const currentLedger = useMemo<Ledger | null>(() => {
    if (!ledgers || ledgers.length === 0) return null
    const saved = ledgerId ? ledgers.find((l) => l.id === ledgerId) : undefined
    return saved ?? ledgers.find((l) => l.is_default) ?? ledgers[0]
  }, [ledgers, ledgerId])

  // 持久化实际生效的账本（记忆失效时自动回写 fallback）
  useEffect(() => {
    if (storageKey && currentLedger) {
      localStorage.setItem(storageKey, currentLedger.id)
    }
  }, [storageKey, currentLedger])

  // 文档标题跟随家庭名称（浏览器标签页），无家庭时回退产品默认名
  const familyName = family?.name
  useEffect(() => {
    document.title = familyName || '家庭账本'
  }, [familyName])

  return (
    <LedgerContext.Provider
      value={{
        ledgers,
        currentLedger,
        isLoading,
        setCurrentLedger: (id) => setLedgerId(id),
      }}
    >
      {children}
    </LedgerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLedgerContext() {
  return useContext(LedgerContext)
}
