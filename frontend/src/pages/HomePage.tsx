import { Link } from 'react-router-dom';

import { CyclingHeroBanner } from '../components/CyclingHeroBanner';

export function HomePage() {
  return (
    <>
      <CyclingHeroBanner className="home-hero-banner" />
      <section className="hero-section">
        <p className="eyebrow">RUTA · VIENTO · CARRETERA</p>
        <h1>Planifica tus rutas de ciclismo con el viento a tu favor.</h1>
        <h2>Los kilómetros se entrenan, el desnivel se sufre... el viento se vence.</h2>
        <p className="hero-copy">CicloViento, tu aliado en cada ruta. CicloViento te ayudará a elegir recorridos de carretera teniendo en cuenta distancia, desnivel y condiciones de viento.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/register">Crear cuenta</Link>
          <Link className="button button-secondary" to="/login">Iniciar sesión</Link>
        </div>
        <div className="feature-grid" aria-label="Capacidades futuras">
          <article><strong>Distancia</strong><span>Define el recorrido que te apetece hacer.</span></article>
          <article><strong>Desnivel</strong><span>Encuentra rutas acordes a tu esfuerzo.</span></article>
          <article><strong>Viento</strong><span>Consulta su impacto antes de salir.</span></article>
        </div>
      </section>
    </>
  );
}
