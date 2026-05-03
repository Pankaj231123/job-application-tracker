import { Link, Outlet, useLocation } from 'react-router-dom';

const copy = {
  '/login': {
    badge: 'Welcome back',
    title: 'Sign in to your tracker',
    description:
      'Pick up where you left off and keep every application, interview, and offer in one place.',
    altLink: '/register',
    altLabel: 'Create an account',
  },
  '/register': {
    badge: 'Get started',
    title: 'Create your account',
    description:
      'Build your job search workspace in minutes and stay organized from first application to final offer.',
    altLink: '/login',
    altLabel: 'Sign in instead',
  },
};

export default function AuthLayout() {
  const location = useLocation();
  const page = copy[location.pathname] || copy['/login'];

  return (
    <main className="auth-shell">
      <section className="auth-hero" aria-hidden="true">
        <div className="auth-hero__glow auth-hero__glow--one" />
        <div className="auth-hero__glow auth-hero__glow--two" />
        <div className="auth-hero__content">
          <span className="auth-kicker">Job Application Tracker</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="auth-hero__stats">
            <article>
              <strong>01</strong>
              <span>Track every role</span>
            </article>
            <article>
              <strong>02</strong>
              <span>Move faster</span>
            </article>
            <article>
              <strong>03</strong>
              <span>Stay focused</span>
            </article>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__card">
          <div className="auth-panel__topline">
            <span>{page.badge}</span>
            <Link to={page.altLink}>{page.altLabel}</Link>
          </div>
          <Outlet />
        </div>
      </section>
    </main>
  );
}
