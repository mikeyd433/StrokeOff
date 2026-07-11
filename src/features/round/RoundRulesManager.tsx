import { useMemo, useState } from 'react'
import { Button } from '@/components/Button'
import { TextInput } from '@/components/TextInput'
import { FormMessage } from '@/components/FormMessage'
import { RuleEditor } from '@/features/rules/RuleEditor'
import { useCreateRule, useRules } from '@/lib/rules'
import {
  useAddRoundRule,
  useRemoveRoundRule,
  useRoundRules,
} from '@/lib/rounds'
import { errorMessage } from '@/lib/validation'
import type { Round, RoundRule } from '@/types'

/**
 * Mid-round rule management (host only). The round's active-rule set can be
 * adjusted while the round is in the lobby or live: toggle library rules on/off,
 * or author a brand-new rule on the fly. Non-host participants see the current
 * active rules read-only. Every change is snapshotted server-side and pushed to
 * all participants via Realtime (see 0004 migration + useRoundRealtime).
 */
export function RoundRulesManager({
  round,
  isHost,
}: {
  round: Pick<Round, 'id' | 'group_id'>
  isHost: boolean
}) {
  const { data: roundRules } = useRoundRules(round.id)

  if (!isHost) {
    return <ReadOnlyRules roundRules={roundRules} />
  }
  return <HostRulesEditor round={round} roundRules={roundRules} />
}

/* ------------------------------------------------------------- participant view */

function ReadOnlyRules({
  roundRules,
}: {
  roundRules: RoundRule[] | undefined
}) {
  return (
    <Section>
      {(roundRules?.length ?? 0) === 0 ? (
        <p className="font-label text-sm text-muted">
          No rules are active in this round.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {(roundRules ?? []).map((r) => (
            <li
              key={r.rule_id}
              className="flex items-center justify-between font-label text-sm text-text"
            >
              <span>{r.name_snapshot}</span>
              <span className="font-numeral text-xs text-muted">
                +{r.points_snapshot}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 font-label text-xs text-muted">
        Only the host can change rules during the round.
      </p>
    </Section>
  )
}

/* -------------------------------------------------------------------- host view */

function HostRulesEditor({
  round,
  roundRules,
}: {
  round: Pick<Round, 'id' | 'group_id'>
  roundRules: RoundRule[] | undefined
}) {
  const { data: groupRules } = useRules(round.group_id)
  const addRule = useAddRoundRule(round.id)
  const removeRule = useRemoveRoundRule(round.id)
  const createRule = useCreateRule(round.group_id)

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeIds = useMemo(
    () => new Set((roundRules ?? []).map((r) => r.rule_id)),
    [roundRules],
  )

  // Library rules, plus any active rule that was deleted from the library
  // mid-round (kept so the host can still turn it off).
  const rows = useMemo(() => {
    const library = groupRules ?? []
    const known = new Set(library.map((r) => r.id))
    const orphans: LibraryRow[] = (roundRules ?? [])
      .filter((r) => !known.has(r.rule_id))
      .map((r) => ({
        id: r.rule_id,
        name: r.name_snapshot,
        points: r.points_snapshot,
      }))
    const known_rows: LibraryRow[] = library.map((r) => ({
      id: r.id,
      name: r.name,
      points: r.points,
    }))
    return [...known_rows, ...orphans]
  }, [groupRules, roundRules])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.name.toLowerCase().includes(q))
  }, [rows, search])

  function toggle(ruleId: string, currentlyActive: boolean) {
    setError(null)
    const mutation = currentlyActive ? removeRule : addRule
    mutation.mutate(ruleId, { onError: (e) => setError(errorMessage(e)) })
  }

  async function handleCreate(
    draft: Parameters<typeof createRule.mutateAsync>[0],
  ) {
    setError(null)
    const rule = await createRule.mutateAsync(draft)
    await addRule.mutateAsync(rule.id)
    setCreating(false)
  }

  const pending = addRule.isPending || removeRule.isPending

  return (
    <Section>
      <div className="flex items-center justify-between">
        <span className="font-label text-xs text-muted">
          {activeIds.size} active
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setCreating((c) => !c)}
        >
          {creating ? 'Close' : 'New rule'}
        </Button>
      </div>

      {creating ? (
        <div className="mt-2">
          <RuleEditor
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      ) : null}

      <div className="mt-2">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rules"
          aria-label="Search rules"
        />
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {filtered.map((rule) => {
          const active = activeIds.has(rule.id)
          return (
            <li key={rule.id}>
              <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-card border border-border bg-surface px-3">
                <span className="min-w-0">
                  <span className="font-label text-sm text-text">
                    {rule.name}
                  </span>
                  <span className="ml-2 font-numeral text-xs text-muted">
                    +{rule.points}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={active}
                  disabled={pending}
                  onChange={() => toggle(rule.id, active)}
                  className="h-5 w-5 accent-[var(--color-accent)]"
                />
              </label>
            </li>
          )
        })}
        {filtered.length === 0 ? (
          <li className="font-label text-sm text-muted">
            No rules match your search.
          </li>
        ) : null}
      </ul>

      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
    </Section>
  )
}

interface LibraryRow {
  id: string
  name: string
  points: number
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-label text-sm font-semibold text-text">Rules</h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
