import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TextInput } from '@/components/TextInput'
import { Select } from '@/components/Select'
import { formatPar } from '@/features/courses/parMath'
import { useCourseLayouts, useCourses } from '@/lib/courses'

export interface CourseSelection {
  courseId: string | null
  layoutId: string | null
  /** Free-text course name, used when the course isn't in the directory. */
  freeText: string
}

const NOT_LISTED = ''

interface CoursePickerProps {
  value: CourseSelection
  onChange: (value: CourseSelection) => void
}

/**
 * Pick the round's course from the directory, so the round carries a real par
 * instead of a typed-in name. Anything not in the directory still goes in as
 * free text — the picker never blocks starting a round.
 */
export function CoursePicker({ value, onChange }: CoursePickerProps) {
  const { data: courses } = useCourses()
  const { data: layouts } = useCourseLayouts(value.courseId ?? undefined)

  const course = useMemo(
    () => courses?.find((c) => c.id === value.courseId) ?? null,
    [courses, value.courseId],
  )
  const layout = useMemo(
    () => layouts?.find((l) => l.id === value.layoutId) ?? null,
    [layouts, value.layoutId],
  )

  // A layout from a previously picked course must not follow the new one.
  useEffect(() => {
    if (
      value.layoutId &&
      layouts &&
      !layouts.some((l) => l.id === value.layoutId)
    ) {
      onChange({ ...value, layoutId: null })
    }
  }, [layouts, value, onChange])

  const par = layout?.total_par ?? course?.total_par ?? null

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="round-course" className="font-label text-sm text-text">
        Course
      </label>
      <Select
        id="round-course"
        className="w-full"
        value={value.courseId ?? NOT_LISTED}
        onChange={(e) =>
          onChange({
            courseId: e.target.value || null,
            layoutId: null,
            freeText: e.target.value ? '' : value.freeText,
          })
        }
      >
        <option value={NOT_LISTED}>Not listed — type a name</option>
        {(courses ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.city ? ` — ${c.city}` : ''}
          </option>
        ))}
      </Select>

      {value.courseId == null ? (
        <TextInput
          value={value.freeText}
          onChange={(e) => onChange({ ...value, freeText: e.target.value })}
          placeholder="Where are you playing?"
          aria-label="Course name"
        />
      ) : null}

      {course && layouts && layouts.length > 1 ? (
        <label className="flex flex-col gap-1">
          <span className="font-label text-sm text-text">Layout</span>
          <Select
            className="w-full"
            value={value.layoutId ?? NOT_LISTED}
            onChange={(e) =>
              onChange({ ...value, layoutId: e.target.value || null })
            }
          >
            <option value={NOT_LISTED}>
              Course default — {formatPar(course.total_par).toLowerCase()}
            </option>
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.total_par ? ` — par ${l.total_par}` : ''}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      {course ? (
        <p className="font-label text-xs text-muted">
          {par == null ? (
            <>
              No par recorded yet.{' '}
              <Link to={`/courses/${course.id}`} className="text-accent">
                Set it in the directory
              </Link>
              .
            </>
          ) : (
            <>
              Par {par} will be saved with this round.{' '}
              <Link to={`/courses/${course.id}`} className="text-accent">
                Edit course
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <p className="font-label text-xs text-muted">
          Courses you play often are worth{' '}
          <Link to="/courses" className="text-accent">
            adding to the directory
          </Link>
          .
        </p>
      )}
    </div>
  )
}
