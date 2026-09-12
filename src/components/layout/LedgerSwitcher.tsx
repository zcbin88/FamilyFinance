import { useState } from 'react'
import { IonActionSheet, IonButton, IonIcon, IonSkeletonText } from '@ionic/react'
import { add, checkmark, chevronDown } from 'ionicons/icons'
import LedgerDialog from '@/components/ledger/LedgerDialog'
import { useLedgerContext } from '@/context/LedgerProvider'
import { useCurrentFamily } from '@/hooks/useFamily'
import { LedgerIcon } from '@/lib/ledger-presets'

/** 顶部栏账本切换：Ionic 原生 ActionSheet，移动端单手持握即可操作 */
export default function LedgerSwitcher() {
  const { ledgers, currentLedger, isLoading, setCurrentLedger } = useLedgerContext()
  const { data: family } = useCurrentFamily()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const buttons = [
    ...(ledgers ?? []).map((ledger) => ({
      text: ledger.name,
      icon: ledger.id === currentLedger?.id ? checkmark : undefined,
      handler: () => setCurrentLedger(ledger.id),
    })),
    { text: '新建账本', icon: add, handler: () => setDialogOpen(true) },
    { text: '取消', role: 'cancel' as const },
  ]

  return (
    <>
      <IonButton
        fill="clear"
        size="small"
        color="primary"
        disabled={isLoading || !currentLedger}
        onClick={() => setSheetOpen(true)}
      >
        <span slot="start" className="flex items-center">
          {currentLedger && (
            <LedgerIcon
              icon={currentLedger.icon}
              color={currentLedger.color}
              className="size-4 shrink-0"
            />
          )}
        </span>
        {isLoading ? (
          <IonSkeletonText animated style={{ width: 56, height: 14, borderRadius: 4 }} />
        ) : (
          <span className="block max-w-28 truncate text-sm font-medium">
            {currentLedger?.name ?? '选择账本'}
          </span>
        )}
        <IonIcon slot="end" icon={chevronDown} className="text-xs opacity-60" />
      </IonButton>

      <IonActionSheet
        className="ledger-sheet"
        isOpen={sheetOpen}
        header="我的账本"
        buttons={buttons}
        onDidDismiss={() => setSheetOpen(false)}
      />

      <LedgerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        familyId={family?.id}
        onCreated={(id) => setCurrentLedger(id)}
      />
    </>
  )
}
