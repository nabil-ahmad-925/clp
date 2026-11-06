'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { enterTeamHref } from '@/content/teamEntry';
import { fetchTournamentPage, messageOf, type PageDivision, type TournamentPage } from '@/content/tournament';
import PageHero from '@/components/sections/PageHero';
import s from './tournament.module.css';

const day = (d?: string) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');

function DivisionBlock({ division: d }: { division: PageDivision }) {
  const schedule = d.schedule;
  return (
    <section className={s.block}>
      <h2>{d.name}</h2>
      <h3>Teams</h3>
      {d.teams.length === 0 ? <p className={s.muted}>No teams accepted yet.</p> : (
        <ul className={s.teams}>
          {d.teams.map((t) => (
            <li key={`${t.club}${t.name}`}>
              <strong>{t.name}</strong>
              {t.club && <span>{t.club}</span>}
            </li>
          ))}
        </ul>
      )}
      <h3>Schedule</h3>
      {!schedule ? <p className={s.muted}>The schedule isn&rsquo;t published yet.</p> : (
        <ul className={s.games}>
          {schedule.games.map((g, i) => (
            <li key={i}>
              <span className={s.when}>{[day(g.date), g.time, g.field].filter(Boolean).join(' · ') || `Round ${g.round}`}</span>
              <span>
                {g.home ?? 'To be decided'} {g.score ? `${g.score.home} – ${g.score.away}` : 'vs'} {g.away ?? 'To be decided'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {schedule?.standings.map((table) => (
        <div key={table.pool ?? 'all'} className={s.tableWrap}>
          <h3>{table.pool ? `Standings · Pool ${table.pool}` : 'Standings'}</h3>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td>{r.played}</td>
                  <td>{r.won}</td>
                  <td>{r.drawn}</td>
                  <td>{r.lost}</td>
                  <td>{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

/** A tournament's public page: divisions, accepted teams, published schedules and standings. Never player names. */
export default function TournamentPublicPage() {
  const params = useSearchParams();
  const widget = params.get('widget') ?? '';
  const listing = params.get('listing') ?? '';
  const invite = params.get('invite') ?? undefined;
  const [page, setPage] = useState<TournamentPage | null | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetchTournamentPage(widget, listing, invite).then(
      (p) => active && setPage(p),
      (err) => active && setError(messageOf(err, 'Could not load this tournament.')),
    );
    return () => {
      active = false;
    };
  }, [widget, listing, invite]);
  const hero = (title: string) => <PageHero title={[title]} height={300} backgroundColor="#0a0a0a" />;
  if (error) return <>{hero('Tournament')}<main className={s.page}><p role="alert">{error}</p></main></>;
  if (page === undefined) return <>{hero('Tournament')}<main className={s.page}><p role="status">Loading…</p></main></>;
  if (page === null) return <>{hero('Not Available')}<main className={s.page}><p>This tournament isn&rsquo;t public. Use the link from your invite.</p></main></>;
  return (
    <>
    {hero(page.name)}
    <main className={s.page}>
      <p className={s.muted}>
        {[`${day(page.startDate)} to ${day(page.endDate)}`, page.venue, page.organizerName].filter(Boolean).join(' · ')}
      </p>
      <Link className={s.cta} href={enterTeamHref(widget, listing)}>
        Enter A Team
      </Link>
      {page.divisions.map((d) => (
        <DivisionBlock key={d.id} division={d} />
      ))}
    </main>
    </>
  );
}
