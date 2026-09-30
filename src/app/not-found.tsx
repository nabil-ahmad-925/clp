import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <>
      <PageHero title={['Page Not Found']} height={350} backgroundColor="#0a0a0a" />
      <Section style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ marginBottom: 30 }}>
          The page you are looking for doesn&apos;t exist. Head back to the <Link href="/">home page</Link>.
        </p>
        <Button href="/" color="dark">
          Home
        </Button>
      </Section>
    </>
  );
}
