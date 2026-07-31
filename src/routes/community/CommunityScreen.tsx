import { MeSection } from './MeSection'
import { PeopleSection } from './PeopleSection'
import { GroupsSection } from './GroupsSection'
import { CoursesSection } from './CoursesSection'

/**
 * Community tab (spec §3, §11). Me (identity + profile + account management),
 * People, Groups, and the shared course directory. The five tabs are fixed, so
 * the directory lives here as a section rather than as a sixth tab.
 */
export function CommunityScreen() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <MeSection />
      <PeopleSection />
      <GroupsSection />
      <CoursesSection />
    </div>
  )
}
