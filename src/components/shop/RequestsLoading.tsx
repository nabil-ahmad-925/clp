import w from './wholesale.module.css';

/** Quote Requests while they load: two cards' outline shimmering (never "No quote requests yet" before we know). */
export default function RequestsLoading() {
  return (
    <div className={w.reqLoading} role="status" aria-label="Loading your quote requests">
      {[0, 1].map((i) => (
        <div key={i} className={w.reqLoadingCard} aria-hidden>
          <span className={`${w.shimmer} ${w.reqLoadingPic}`} />
          <span className={w.reqLoadingLines}>
            <span className={w.shimmer} style={{ width: '55%', height: 18 }} />
            <span className={w.shimmer} style={{ width: '35%', height: 12 }} />
            <span className={w.shimmer} style={{ width: '100%', height: 6, marginTop: 8 }} />
            <span className={w.shimmer} style={{ width: '100%', height: 54, marginTop: 6 }} />
          </span>
        </div>
      ))}
    </div>
  );
}
