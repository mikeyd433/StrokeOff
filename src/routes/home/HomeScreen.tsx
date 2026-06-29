import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

/**
 * Home tab placeholder (spec §3). First-run empty state: the primary "Start a
 * round" invitation front and center. Actions are wired in later phases.
 */
export function HomeScreen() {
  return (
    <EmptyState
      title="Start your first round"
      message="Stroke Off rides alongside your regular round — log points when conditions are met, and they convert to stroke deductions at the end."
      action={
        <div className="flex flex-col items-center gap-3">
          <Button type="button" disabled>
            Start a round
          </Button>
          <Button type="button" variant="secondary" disabled>
            Join a round
          </Button>
        </div>
      }
    />
  )
}
