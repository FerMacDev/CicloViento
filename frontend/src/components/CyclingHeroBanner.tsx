import cyclingMountainSpeedHero from '../assets/cycling-mountain-speed-hero.webp';

interface CyclingHeroBannerProps {
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function CyclingHeroBanner({ className = '', loading = 'eager' }: CyclingHeroBannerProps) {
  return (
    <figure className={`cycling-hero-banner ${className}`.trim()}>
      <img
        src={cyclingMountainSpeedHero}
        alt="Ciclista de carretera circulando a gran velocidad por una carretera de montaña"
        loading={loading}
      />
    </figure>
  );
}
