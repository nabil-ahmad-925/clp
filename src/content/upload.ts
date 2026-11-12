import { PartnerApiError, call, read } from './partnerPages';

/**
 * An order's upload link (/upload/?id=…&k=…; clp-api shared/upload-link.mjs): the client's designer opens it from "Send
 * to My Designer", or the client from a reminder. No account: the item and its files still needed, never a price, a
 * name or an address.
 */
export type UploadFile = { key: string; label: string; hint: string; type: 'file' | 'text'; accept: string[]; status: 'missing' | 'review' | 'approved' | 'changes' | 'clp' | 'optional' | 'client' | 'declined'; note: string; sent: number; open: boolean };
export type UploadRequest = { ref: string; itemName: string; qty: number; note?: string; files: UploadFile[] };
export type UploadState = { status: 'ready'; request: UploadRequest } | { status: 'invalid' } | { status: 'done' };

const path = (id: string, key: string) => `/bulk-upload/${encodeURIComponent(id)}?k=${encodeURIComponent(key)}`;

/** The order's files from the link (or why it doesn't open). */
export async function fetchUpload(id: string, key: string): Promise<UploadState> {
  if (!/^[0-9a-f-]{36}$/.test(id) || !key) return { status: 'invalid' };
  try {
    return { status: 'ready', request: (await read<{ request: UploadRequest }>(path(id, key))).request };
  } catch (err) {
    if (err instanceof PartnerApiError && err.status === 404) return { status: 'invalid' };
    if (err instanceof PartnerApiError && err.status === 410) return { status: 'done' };
    throw err;
  }
}

/** Sends one file (a file up to 350 KB as base64, a link, or the text), answering the files as they are now. */
export const sendUpload = (id: string, key: string, input: { fileKey: string; name?: string; data?: string; link?: string; text?: string }) =>
  call<{ request: UploadRequest }>(path(id, key), { method: 'POST', body: JSON.stringify(input) }).then((r) => r.request);
