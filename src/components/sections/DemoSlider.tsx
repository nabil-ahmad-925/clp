import styles from './DemoSlider.module.css';

/**
 * Salient "Nectar Slider" as configured on the original: a black slide with a large heading and a caption
 * (the theme's sample slide, which the live page still shows).
 */
export default function DemoSlider({ height, slides }: { height: number; slides: { title: string; caption: string }[] }) {
  const slide = slides[0];
  if (!slide) return null;
  return (
    <div className={styles.slider} style={{ height }}>
      <div className={styles.content}>
        <h2>{slide.title}</h2>
        <p>{slide.caption}</p>
      </div>
    </div>
  );
}
