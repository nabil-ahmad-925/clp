'use client';

import { useEffect, useState } from 'react';
import { FaAngleUp } from 'react-icons/fa';
import styles from './BackToTop.module.css';

const SHOW_AFTER = 350;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href="#top"
      className={`${styles.toTop} ${visible ? styles.visible : ''}`}
      aria-label="Back to top"
      tabIndex={visible ? undefined : -1}
      onClick={(e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <span className={styles.arrows} aria-hidden>
        <FaAngleUp />
        <FaAngleUp />
      </span>
    </a>
  );
}
