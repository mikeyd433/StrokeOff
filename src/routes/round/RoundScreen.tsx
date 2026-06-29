import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

/**
 * Round tab placeholder (spec §3). With no active round it invites you to start or
 * join — including "Scan QR". Live scoring lands in Phase 4.
 */
export function RoundScreen() {
  return (
    <EmptyState
      title="No round in play"
      message="Start a new round or join one to begin scoring. You can scan a QR code or enter a round code to jump into a friend's round."
      action={
        <div className="flex flex-col items-center gap-3">
          <Button type="button" disabled>
            Start a round
          </Button>
          <Button type="button" variant="secondary" disabled>
            Scan QR
          </Button>
        </div>
      }
    />
  )
}
