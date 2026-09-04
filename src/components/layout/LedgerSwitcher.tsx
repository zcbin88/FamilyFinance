import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import LedgerDialog from '@/components/ledger/LedgerDialog'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { LedgerIcon } from '@/lib/ledger-presets'
import { cn } from '@/lib/utils'

export default function LedgerSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const { ledgers, currentLedger, isLoading, setCurrentLedger } = useLedgerContext()
  const { data: family } = useCurrentFamily()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className={cn(
              'justify-between gap-2',
              compact ? '' : 'w-full',
              className,
            )}
            disabled={isLoading || !currentLedger}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className="flex min-w-0 items-center gap-2">
                {currentLedger && (
                  <LedgerIcon
                    icon={currentLedger.icon}
                    color={currentLedger.color}
                    className="size-4 shrink-0"
                  />
                )}
                <span className="truncate">{currentLedger?.name ?? '选择账本'}</span>
              </span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>我的账本</DropdownMenuLabel>
          {ledgers?.map((ledger) => (
            <DropdownMenuItem
              key={ledger.id}
              onClick={() => setCurrentLedger(ledger.id)}
              className="justify-between gap-2"
            >
              <span className="flex min-w-0 items-center gap-2">
                <LedgerIcon icon={ledger.icon} color={ledger.color} className="size-4 shrink-0" />
                <span className="truncate">{ledger.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                {ledger.is_default && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    默认
                  </Badge>
                )}
                {ledger.id === currentLedger?.id && <Check className="size-4 text-primary" />}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            新建账本
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LedgerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={family?.id}
        onCreated={(id) => setCurrentLedger(id)}
      />
    </>
  )
}
