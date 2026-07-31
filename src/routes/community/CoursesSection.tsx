import { Link } from 'react-router-dom'
import { useCourses } from '@/lib/courses'

/**
 * Community → Courses. The shared course directory: where a round gets a real
 * course instead of free text, and where par is kept up to date.
 */
export function CoursesSection() {
  const { data: courses } = useCourses()
  const total = courses?.length ?? 0
  const withPar = (courses ?? []).filter((c) => c.total_par != null).length

  return (
    <section className="rounded-card border border-border bg-surface p-4">
      <h2 className="font-display text-base font-semibold text-text">
        Courses
      </h2>
      <p className="mt-2 font-label text-sm text-muted">
        {total
          ? `${total} courses, ${withPar} with a sourced par. Par is editable for the whole course or hole by hole.`
          : 'Browse the course directory and set par for the courses you play.'}
      </p>
      <Link
        to="/courses"
        className="mt-3 inline-flex min-h-[44px] items-center font-label text-sm font-semibold text-accent"
      >
        Browse courses →
      </Link>
    </section>
  )
}
