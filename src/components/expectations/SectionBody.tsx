import { eventRules, promises, safetySteps, type SectionId } from '@/content/expectations';
import { roleCopy, type Audience } from '@/content/expectationsRoles';
import FaqSection from './FaqSection';
import OpenRows from './OpenRows';
import PointRows from './PointRows';
import RulesLadder from './RulesLadder';
import SafetyActions from './SafetyActions';
import rows from './rows.module.css';

type Props = {
  tab: SectionId;
  role: Audience;
  open: number;
  onToggle: (i: number) => void;
  query: string;
  onQuery: (q: string) => void;
};

/** The open section's content, for the chosen role. */
export default function SectionBody({ tab, role, open, onToggle, query, onQuery }: Props) {
  const copy = roleCopy[role];
  switch (tab) {
    case 'short':
      return <PointRows points={copy.short} mark="number" />;
    case 'promise':
      return <OpenRows items={promises} open={open} onToggle={onToggle} idPrefix="exp-promise" />;
    case 'side':
      return (
        <>
          <div className={rows.group}>
            <span className={`${rows.groupLabel} ${rows.groupAlways}`}>ALWAYS</span>
            <PointRows points={copy.dos} mark="always" />
          </div>
          <div className={`${rows.group} ${rows.groupNever}`}>
            <span className={`${rows.groupLabel} ${rows.groupNeverLabel}`}>NEVER</span>
            <PointRows points={copy.donts} mark="never" />
          </div>
        </>
      );
    case 'event':
      return <OpenRows items={eventRules} open={open} onToggle={onToggle} idPrefix="exp-event" />;
    case 'safety':
      return (
        <>
          <PointRows points={safetySteps} mark="number" />
          <SafetyActions />
        </>
      );
    case 'rules':
      return <RulesLadder />;
    case 'faq':
      return <FaqSection role={role} query={query} onQuery={onQuery} open={open} onToggle={onToggle} />;
  }
}
