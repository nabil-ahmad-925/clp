import ContactForm from '@/components/sections/ContactForm';
import EnquiryForm from '@/components/sections/EnquiryForm';
import DemoSlider from '@/components/sections/DemoSlider';
import Faq from '@/components/sections/Faq';
import GradientTiles from '@/components/sections/GradientTiles';
import ZoomProjects from '@/components/sections/ZoomProjects';
import ImageGrid from '@/components/sections/ImageGrid';
import TeamCardGrid from '@/components/sections/TeamCardGrid';
import MapDirectory from '@/components/sections/MapDirectory';
import PhotoAlbum from '@/components/sections/PhotoAlbum';
import PhotoGallery from '@/components/sections/PhotoGallery';
import PostFilter from '@/components/sections/PostFilter';
import ServiceNav from '@/components/sections/ServiceNav';
import TeamDirectory from '@/components/sections/TeamDirectory';
import RichText from '@/components/ui/RichText';
import type { Block } from '@/content/types';
import BookingForm from './BookingForm';
import styles from './BuilderBlock.module.css';

/** Renders one page-builder block. */
export default function BuilderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'divider':
      return <div className={styles.divider} style={{ height: block.height }} aria-hidden />;
    case 'text':
      return (
        <div className={styles.textColumn} style={block.style}>
          <RichText html={block.html} className={[styles.text, block.className && styles[block.className]].filter(Boolean).join(' ')} />
        </div>
      );
    case 'team':
      return (
        <div className={styles.teamColumn}>
          <TeamDirectory layout={block.layout} filters={block.filters} items={block.items} paging={block.paging} widgetId={block.widgetId} />
        </div>
      );
    case 'serviceNav':
      return <ServiceNav previous={block.previous} next={block.next} />;
    case 'booking':
      return (
        <div>
          <BookingForm />
          {block.trailingBlank && <p className={styles.blank}>&nbsp;</p>}
        </div>
      );
    case 'album':
      return <PhotoAlbum items={block.items} />;
    case 'enquiryForm':
      return <EnquiryForm formId={block.formId} submit={block.submit} items={block.items} />;
    case 'contactForm':
      return <ContactForm formId={block.formId} submit={block.submit} paragraphs={block.paragraphs} />;
    case 'mapDirectory':
      return (
        <div>
          <MapDirectory {...block} />
        </div>
      );
    case 'teamCards':
      return <TeamCardGrid items={block.items} gap={block.gap} />;
    case 'imageGrid':
      return (
        <div>
          <ImageGrid images={block.images} columns={block.columns} gutter={block.gutter} />
        </div>
      );
    case 'faq':
      return (
        <div>
          {block.title && <h2 className={styles.faqTitle}>{block.title}</h2>}
          <Faq bare compact={block.compact} items={block.items} />
          {block.viewAll && (
            <div className={styles.faqViewAll}>
              <a href={block.viewAll.href} target={block.viewAll.newTab ? '_blank' : undefined} rel={block.viewAll.newTab ? 'noopener' : undefined}>
                {block.viewAll.label}
              </a>
            </div>
          )}
        </div>
      );
    case 'gradientTiles':
      return <GradientTiles tiles={block.tiles} />;
    case 'zoomProjects':
      return <ZoomProjects slides={block.slides} />;
    case 'demoSlider':
      return <DemoSlider height={block.height} slides={block.slides} />;
    case 'postFilter':
      return (
        <div>
          <PostFilter categories={block.categories} posts={block.posts} source={block.source} />
        </div>
      );
    case 'gallery':
      return <PhotoGallery id={block.id} name={block.name} breadcrumbs={block.breadcrumbs} images={block.images} />;
  }
}
