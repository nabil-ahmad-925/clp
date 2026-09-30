import PageHero from '@/components/sections/PageHero';
import PostGrid from '@/components/sections/PostGrid';
import PostNav from '@/components/sections/PostNav';
import RichText from '@/components/ui/RichText';
import { Container } from '@/components/ui/Section';
import type { BlogPost } from '@/content/types';
import styles from './PostView.module.css';

/** Single blog post: photo header with meta line, article, next/previous band and related posts. */
export default function PostView({ post }: { post: BlogPost }) {
  const { hero } = post;
  return (
    <>
      <PageHero
        title={[hero.title]}
        height={550}
        backgroundColor="#2d2d2d"
        backgroundImage={hero.image}
        titleMaxWidth={1000}
        overlay="rgba(25, 25, 25, 0.35)"
        meta={[
          { prefix: 'By', label: hero.author.name, href: hero.author.href },
          { label: hero.date },
          { label: hero.comments.label, href: hero.comments.href },
          { label: hero.readingTime },
        ].filter((m) => m.label)}
      />
      <div className={styles.body} data-header-tone="dark">
        <article className={styles.article}>
          <RichText html={post.html} className={styles.content} />
        </article>
        <PostNav previous={post.previous} next={post.next} />
        {post.related.posts.length > 0 && (
          <Container className={styles.related}>
            <h3 className={styles.relatedTitle}>{post.related.title}</h3>
            <PostGrid posts={post.related.posts} />
          </Container>
        )}
        <div id="respond" className={styles.comments} />
      </div>
    </>
  );
}
