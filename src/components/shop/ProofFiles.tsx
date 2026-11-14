import type { ProofFile } from '@/content/bulk';
import SampleFileTile from './SampleFileTile';
import st from './requestStage.module.css';

/** A proof's files as previews: each picture itself, a PDF or a link as a card the same size; each opens in a new tab. */
export default function ProofFiles({ files = [] }: { files?: ProofFile[] }) {
  if (!files.length) return null;
  return (
    <span className={st.shots}>
      {files.map((f, i) => (
        <SampleFileTile key={`${f.url}-${i}`} f={f} />
      ))}
    </span>
  );
}
