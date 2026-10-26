'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { LuFileText, LuUpload } from 'react-icons/lu';
import { RESUME_ACCEPT, fileSize } from './useJobApplication';
import f from './ResumeField.module.css';

/**
 * "Resume" on an application (the Jobs board's and a partner page's): a box to choose (or drop) a PDF or Word file;
 * once chosen, its name and size with Replace and Remove. The file goes up when the application is sent.
 */
export default function ResumeField({ file, onChoose, onRemove, disabled }: { file: File | null; onChoose: (e: ChangeEvent<HTMLInputElement>) => void; onRemove: () => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || disabled) return;
    // As if chosen in the picker (the same checks).
    onChoose({ target: { files: [dropped], value: '' } } as unknown as ChangeEvent<HTMLInputElement>);
  };
  return (
    <div className={f.field}>
      <span className={f.label}>
        Resume <span className={f.optional}>(optional)</span>
      </span>
      <input ref={input} type="file" accept={RESUME_ACCEPT} className={f.input} onChange={onChoose} disabled={disabled} aria-label="Upload your resume" tabIndex={-1} />
      {file ? (
        <div className={f.file}>
          <span className={f.icon} aria-hidden>
            <LuFileText />
          </span>
          <span className={f.fileText}>
            <strong>{file.name}</strong>
            <span>{fileSize(file.size)}</span>
          </span>
          <button type="button" className={f.link} onClick={() => input.current?.click()} disabled={disabled}>
            Replace
          </button>
          <button type="button" className={f.link} onClick={onRemove} disabled={disabled}>
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${f.drop} ${over ? f.dropOver : ''}`}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
          disabled={disabled}
        >
          <LuUpload aria-hidden />
          <span>
            <strong>Upload Your Resume</strong>
            <span>PDF or Word, up to 10 MB</span>
          </span>
        </button>
      )}
    </div>
  );
}
