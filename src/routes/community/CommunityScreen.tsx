import type { ReactNode } from 'react'
import { Button } from '@/components/Button'

/**
 * Community tab placeholder (spec §3, §11). Three sections — Me, People, Groups.
 * Phase 0 shows their invitation-style empty states; the real sections land in
 * Phases 1, 2, and 11.
 */
export function CommunityScreen() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Section title="Me">
        <p className="font-label text-sm text-muted">
          Pick a display name to start playing. Sign in later to save your
          profile, avatar, and rounds across devices.
        </p>
        <div className="mt-4">
          <Button type="button" variant="secondary" disabled>
            Sign in
          </Button>
        </div>
      </Section>

      <Section title="People">
        <p className="font-label text-sm text-muted">
          People you've played with appear here after a shared round — no global
          directory, just your crew.
        </p>
      </Section>

      <Section title="Groups">
        <p className="font-label text-sm text-muted">
          Groups hold a shared rule library, default conversion, and house
          theme. Create one or join with an invite code.
        </p>
        <div className="mt-4 flex gap-3">
          <Button type="button" disabled>
            Create a group
          </Button>
          <Button type="button" variant="secondary" disabled>
            Join a group
          </Button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold text-text">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </section>
  )
}
