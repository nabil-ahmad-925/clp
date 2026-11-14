import w from './wholesale.module.css';

export const TRACK = ['Submitted', 'Quote', 'Files & proof', 'In production', 'Shipped'] as const;

/**
 * A request's 5-step tracker on Quote Requests, read like the "Quote requested" screen's: the steps done are full, the
 * step it's at now (`now`: its index) is half lit, the rest are to come. `now` past the last (5): all done (delivered).
 */
export default function RequestTrack({ now }: { now: number }) {
  return (
    <div className={w.reqTrack}>
      {TRACK.map((label, i) => (
        <span key={label} data-on={i < now} data-now={i === now}>
          <i />
          {label}
        </span>
      ))}
    </div>
  );
}
