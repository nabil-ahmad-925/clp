import styles from './RichText.module.css';

/**
 * Renders rich text (paragraphs, lists, bold, links) that was extracted from the original site.
 * The HTML is sanitized at extraction time to a small set of semantic tags with no classes or scripts.
 */
export default function RichText({ html, className }: { html: string; className?: string }) {
  return <div className={[styles.richText, className].filter(Boolean).join(' ')} dangerouslySetInnerHTML={{ __html: html }} />;
}
