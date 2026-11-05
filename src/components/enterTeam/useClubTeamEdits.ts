'use client';

import { useState } from 'react';
import { addClubPlayer, createClubTeam, type ClubTeam } from '@/content/teamEntry';
import { coachList, playerProblem, typedPlayer, type PlayerDraft } from './entryRules';

/**
 * A signed-in partner changing their own Teams from here (the admin's Teams, same API): a new team, or a player added
 * to one. Each change is saved at once, so it's on their team for next time too.
 */
export function useClubTeamEdits(keepTeam: (team: ClubTeam) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (work: () => Promise<ClubTeam>) => {
    setBusy(true);
    setError('');
    try {
      const team = await work();
      keepTeam(team);
      return team;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that. Please try again.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const refuse = (message: string) => {
    setError(message);
    return Promise.resolve(null);
  };

  const createTeam = (name: string, coaches: string) => {
    if (!name.trim()) return refuse('Enter the team’s name.');
    return run(() => createClubTeam(name.trim(), coachList(coaches)));
  };

  const addPlayer = (teamId: string, player: PlayerDraft) => {
    const problem = playerProblem(player);
    if (problem) return refuse(problem);
    return run(() => addClubPlayer(teamId, typedPlayer(player)));
  };

  return { busy, error, clearError: () => setError(''), createTeam, addPlayer };
}
