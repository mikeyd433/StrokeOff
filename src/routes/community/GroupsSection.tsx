import { Button } from '@/components/Button'
import { useAuth } from '@/lib/auth'
import { useMyGroups } from '@/lib/profile'

/**
 * Community → Groups (spec §11). Phase 1 surfaces the auto-created personal group
 * so there's always a context to play in. Create/join and member management land
 * in Phase 2 — those controls are present but disabled here.
 */
export function GroupsSection() {
  const { user, isAnonymous } = useAuth()
  const { data: groups, isLoading } = useMyGroups()

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold text-text">Groups</h2>

      {!user || isAnonymous ? (
        <p className="mt-2 font-label text-sm text-muted">
          Groups hold a shared rule library, default conversion, and house theme.
          Sign in to create or join one — group membership is login-only.
        </p>
      ) : (
        <>
          {isLoading ? (
            <p className="mt-2 font-label text-sm text-muted">Loading groups…</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {(groups ?? []).map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-card border border-border bg-surface-alt px-3 py-2"
                >
                  <span className="font-label text-sm text-text">
                    {group.name}
                  </span>
                  {group.is_personal ? (
                    <span className="font-label text-xs text-muted">
                      Personal
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex gap-3">
            <Button type="button" disabled>
              Create a group
            </Button>
            <Button type="button" variant="secondary" disabled>
              Join a group
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
