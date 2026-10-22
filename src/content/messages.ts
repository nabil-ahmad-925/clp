import { call, read } from './partnerPages';

/**
 * CLP Messages on the site (clp-api messages): a question or an intro from a partner's page, "Apply with CLP" on a
 * partner's job, "Message the host" from a booking, and the guest's own conversation at /messages/?thread=…&t=… (its private link; no account needed). The
 * conversations started on this device are kept here so the guest finds them again (/messages/).
 */
export type GuestMessage = { id: string; text: string; sys: boolean; at: string; by: string; role: string; mine: boolean };
export type GuestThread = {
  id: string;
  kind: 'booking' | 'question' | 'intro' | 'staff' | 'partner' | 'clp' | 'job';
  status: 'open' | 'pending' | 'declined';
  subject: string;
  context: { label?: string; bookingId?: string };
  youth: boolean;
  openUntil: string;
  people: { name: string; role: string; you: boolean; guardian: boolean }[];
  canSend: boolean;
  closedWhy: string;
  lastAt: string;
};
export type GuestPartner = { name: string; slug: string; logo: string; mono: string; color: string };
export type GuestConversation = { thread: GuestThread; messages: GuestMessage[]; partner: GuestPartner };

const link = (r: { link: string }) => r.link;
/** The part of a private link the site's page opens (/messages/?thread=…&t=…), from the API's full one. */
export const sitePath = (full: string) => {
  try {
    const u = new URL(full);
    return `/messages/${u.search}`;
  } catch {
    return '/messages/';
  }
};

export const askQuestion = (input: { slug: string; name: string; email: string; text: string; website?: string }) =>
  call<{ link: string; threadId: string }>('/messages/question', { method: 'POST', body: JSON.stringify(input) }).then(link);
export const sendIntro = (input: { slug: string; name: string; organization: string; email: string; partnerKind: string; text: string; website?: string }) =>
  call<{ link: string; threadId: string }>('/messages/intro', { method: 'POST', body: JSON.stringify(input) }).then(link);
/** An application's resume as the API keeps it (POST /messages/job/resume signs it for the role). */
export type ResumeUpload = { key: string; name: string; size: number; type: string; token: string };
/** The resume files an application takes (the API's): PDF or Word, 10 MB at most. */
export const RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

/** Uploads a resume for an application to `jobId` (to CLP's storage, straight from the browser); what to apply with. */
export async function uploadResume(jobId: string, file: File): Promise<ResumeUpload> {
  const r = await call<{ uploadUrl: string; headers: Record<string, string>; resume: ResumeUpload }>('/messages/job/resume', {
    method: 'POST',
    body: JSON.stringify({ jobId, name: file.name, type: file.type, size: file.size }),
  });
  let res: Response;
  try {
    res = await fetch(r.uploadUrl, { method: 'PUT', headers: r.headers, body: file, signal: AbortSignal.timeout(120_000) });
  } catch {
    throw new Error('Your resume didn’t upload. Check your connection and try again.');
  }
  if (!res.ok) throw new Error('Your resume didn’t upload. Try again.');
  return r.resume;
}

/** "Apply with CLP": the application's conversation (`already`: they had applied, it's that one). */
export const applyToJob = (input: { jobId: string; name: string; email: string; phone: string; link: string; resume?: ResumeUpload; note: string; start: string; website?: string }) =>
  call<{ link: string; threadId: string; already?: boolean }>('/messages/job', { method: 'POST', body: JSON.stringify(input) });
export const messageHost = (bookingId: string, token: string) =>
  call<{ link: string; threadId: string }>('/messages/booking', { method: 'POST', body: JSON.stringify({ bookingId, token }) }).then(link);
export const getConversation = (id: string, t: string) => read<GuestConversation>(`/messages/thread/${encodeURIComponent(id)}?t=${encodeURIComponent(t)}`);
export const sendGuestMessage = (id: string, t: string, text: string) =>
  call<{ message: GuestMessage; thread: GuestThread }>(`/messages/thread/${encodeURIComponent(id)}/send`, { method: 'POST', body: JSON.stringify({ t, text }) });
export const reportConversation = (id: string, t: string, text: string) =>
  call<{ reported: true }>(`/messages/thread/${encodeURIComponent(id)}/report`, { method: 'POST', body: JSON.stringify({ t, text }) });

// --- The conversations started on this device --------------------------------------------------------------------------

const KEY = 'clp-conversations';
export type SavedConversation = { path: string; name: string; subject: string; at: string };
export const savedConversations = (): SavedConversation[] => {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list.filter((c): c is SavedConversation => typeof c?.path === 'string' && c.path.startsWith('/messages/?thread=')) : [];
  } catch {
    return [];
  }
};
/** Keeps a conversation on this device (newest first, each once). */
export const saveConversation = (c: SavedConversation) => {
  try {
    const id = new URLSearchParams(c.path.split('?')[1] ?? '').get('thread');
    const rest = savedConversations().filter((x) => new URLSearchParams(x.path.split('?')[1] ?? '').get('thread') !== id);
    localStorage.setItem(KEY, JSON.stringify([c, ...rest].slice(0, 30)));
  } catch {
    // Storage blocked: the conversation's link (and its e-mail) still open it.
  }
};

// --- Live (clp-api messages-ws) ---------------------------------------------------------------------------------------

/** The live Messages connection (wss://…); none: the conversation page polls instead. */
export const MESSAGES_WS_URL = process.env.NEXT_PUBLIC_MESSAGES_WS_URL ?? '';

/**
 * Listens for new messages on one conversation (its private link opens only it): `onMessage` on each, reconnecting on
 * its own after a drop, pinging so an idle connection stays open. The returned function stops it.
 */
export function listenToConversation(id: string, t: string, onMessage: () => void): () => void {
  if (!MESSAGES_WS_URL || typeof WebSocket === 'undefined') return () => {};
  let socket: WebSocket | null = null;
  let stopped = false;
  let wait = 1000;
  let retry = 0;
  let ping = 0;
  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(`${MESSAGES_WS_URL}?thread=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`);
    socket.onopen = () => {
      wait = 1000;
      ping = window.setInterval(() => socket?.readyState === WebSocket.OPEN && socket.send(JSON.stringify({ action: 'ping' })), 4 * 60_000);
    };
    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(String(e.data)) as { type?: string; threadId?: string };
        if (data.type === 'message' && data.threadId === id) onMessage();
      } catch {
        // Not ours: ignored.
      }
    };
    socket.onclose = () => {
      window.clearInterval(ping);
      if (stopped) return;
      retry = window.setTimeout(connect, wait);
      wait = Math.min(wait * 2, 30_000);
    };
  };
  connect();
  return () => {
    stopped = true;
    window.clearTimeout(retry);
    window.clearInterval(ping);
    socket?.close();
  };
}

