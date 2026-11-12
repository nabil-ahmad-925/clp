import { BOX_WORDS, trackDay, type TrackBox, type TrackStep } from '@/content/track';
import s from './track.module.css';

/** The order's five steps, each done or not, with when. */
export function TrackSteps({ steps }: { steps: TrackStep[] }) {
  return (
    <ol className={s.steps} aria-label="Order steps">
      {steps.map((x) => (
        <li key={x.key} className={s.step} data-done={x.done}>
          <b>{x.label}</b>
          <span>{x.done && x.at ? trackDay(x.at) : x.done ? 'Done' : 'Not yet'}</span>
        </li>
      ))}
    </ol>
  );
}

/** Each box: carrier and number, its step and when, and the carrier's tracking link. */
export function TrackBoxes({ boxes }: { boxes: TrackBox[] }) {
  return (
    <div className={s.boxes}>
      {boxes.map((x) => (
        <div key={x.n} className={s.box}>
          <span>
            <b>{`Box ${x.n} of ${boxes.length}`}</b>
            <small>{`${x.carrier} · ${x.number}`}</small>
          </span>
          <span className={s.chip} data-tone={x.status === 'delivered' ? '' : 'transit'}>
            {x.status === 'delivered' && x.deliveredAt ? `Delivered ${trackDay(x.deliveredAt)}` : BOX_WORDS[x.status]}
          </span>
          {x.url ? (
            <a href={x.url} target="_blank" rel="noopener noreferrer">
              Track ↗
            </a>
          ) : (
            <span />
          )}
        </div>
      ))}
    </div>
  );
}
