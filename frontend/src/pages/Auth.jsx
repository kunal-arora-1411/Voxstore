import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, Btn, Card, Divider, Input } from '../components/ui';

/* Generate particle data once per mount */
function useParticles(count = 22) {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left:     Math.random() * 100,
    size:     Math.random() * 3.5 + 1.5,
    delay:    -(Math.random() * 20),
    duration: Math.random() * 10 + 14,
    variant:  (i % 4) + 1,
    opacity:  Math.random() * 0.3 + 0.1,
  })), []);
}

export default function Auth() {
  const [mode, setMode]       = useState('signup');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup }     = useAuth();
  const navigate              = useNavigate();
  const particles             = useParticles();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">

      {/* ── Left rail ───────────────────────────────── */}
      <aside className="auth-rail">
        {/* Animated blobs */}
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
        <div className="auth-blob auth-blob-3" />

        {/* Grid mesh */}
        <div className="auth-mesh" />

        {/* Floating particles */}
        <div className="auth-particles">
          {particles.map(p => (
            <div
              key={p.id}
              className="auth-particle"
              data-v={p.variant}
              style={{
                left:            `${p.left}%`,
                width:           `${p.size}px`,
                height:          `${p.size}px`,
                opacity:         p.opacity,
                animationDelay:  `${p.delay}s`,
                animationDuration:`${p.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <Logo size={20} />
        </div>

        {/* Headline */}
        <div className="auth-rail-body anim-fade-up d-2">
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
            ── A ONE-PROMPT WEBSITE BUILDER
          </div>
          <h1 className="auth-headline">
            Your shop's<br />website, in<br />
            <span style={{ color: 'var(--accent)' }}>60 seconds.</span>
          </h1>
          <p className="auth-tagline">
            Tell SiteSpark about your shop. We write the copy, lay out the page,
            and deploy a live URL you can hand to a customer before your coffee gets cold.
          </p>
        </div>

        {/* Stats */}
        <div className="auth-stats-row">
          {[['2.4k', 'sites generated'], ['38s', 'median build'], ['$0.04', 'avg AI spend']].map(([n, l], i) => (
            <div key={l} className="auth-stat" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
              <div className="auth-stat-num">{n}</div>
              <div className="auth-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right form panel ────────────────────────── */}
      <main className="auth-form-panel">
        <div className="auth-form-wrap">

          <div className="auth-eyebrow mono">STEP 0 — GET STARTED</div>

          <h2 className="auth-form-heading serif">
            {mode === 'signup' ? 'Make your first site.' : 'Welcome back.'}
          </h2>

          <p className="auth-form-sub">
            {mode === 'signup'
              ? 'Free while in beta. No credit card.'
              : 'Sign in to your dashboard and history.'}
          </p>

          <div className="auth-card-wrap">
            <Card pad={22}>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <Input
                    label="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@yourshop.co"
                    mono
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    mono
                    hint={mode === 'signup' ? '8+ characters. We never email it back to you.' : null}
                  />
                  {error && (
                    <p style={{ fontSize: 13.5, color: '#c0392b', margin: 0 }}>{error}</p>
                  )}
                  <Btn full size="lg" type="submit" disabled={loading}>
                    {loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
                  </Btn>
                  <Divider label="OR" />
                  <Btn full variant="ghost" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>
                    {mode === 'signup' ? 'Sign in to existing account' : 'Create a new account'}
                  </Btn>
                </div>
              </form>
            </Card>
          </div>

          {/* How it works */}
          <div className="auth-how-it-works">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--accent)' }}>
              HOW IT WORKS
            </div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
              {[
                ['01', 'Tell us about your shop — name, products, vibe.'],
                ['02', 'GPT-4o writes the copy and lays out a real site.'],
                ['03', 'We deploy to Vercel and hand you a live URL.'],
              ].map(([n, t]) => (
                <li key={n} style={{ display: 'flex', gap: 10 }}>
                  <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{n}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="auth-bottom-note">
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500, padding: 0 }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>New here?{' '}
                <button
                  onClick={() => setMode('signup')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500, padding: 0 }}
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
