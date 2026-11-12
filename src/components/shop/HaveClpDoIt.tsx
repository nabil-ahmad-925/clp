import type { BulkRequest, FileKey, ProductionFile, RequestAction, RequestActionInput } from '@/content/bulk';
import st from './requestStage.module.css';

type Act = (action: RequestAction, input: RequestActionInput) => void;
/** CLP's fee to make a file (clp-api shared/bulk-files.mjs CLP_MAKES_FEE). */
export const CLP_MAKES_FEE = 35;

/**
 * "Have CLP Do It · fee" (the design's Quote Requests file block): no file for one CLP can make? CLP makes it for its
 * fee, added to their order. Not while an offer of ours waits on this file (they answer that one).
 */
export default function HaveClpDoIt({ r, k, f, busy, act }: { r: BulkRequest; k: FileKey; f: ProductionFile; busy: string; act: Act }) {
  const offered = (r.services ?? []).some((s) => s.fileKey === k && s.status === 'offered');
  if (!f.clpMakes || offered || !(f.status === 'missing' || f.status === 'changes')) return null;
  return (
    <span className={st.acts} style={{ alignItems: 'center' }}>
      <button type="button" className={st.light} disabled={Boolean(busy)} onClick={() => act('ask-clp-make', { fileKey: k })}>
        {busy === 'ask-clp-make' ? 'Asking…' : `Have CLP Do It · $${CLP_MAKES_FEE}`}
      </button>
      <span style={{ color: '#666', fontSize: 13 }}>No file? We make it, added to your order.</span>
    </span>
  );
}
