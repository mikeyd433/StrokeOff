import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'

/**
 * Rules tab placeholder (spec §3, §7). The shared, fully-editable group rule
 * library. Empty state nudges you to add a rule. CRUD lands in Phase 2.
 */
export function RulesScreen() {
  return (
    <EmptyState
      title="Build your rule library"
      message="Every rule is yours to write and edit — the conditions that earn points in your group's side-game. Add one to get started."
      action={
        <Button type="button" disabled>
          Add a rule
        </Button>
      }
    />
  )
}
