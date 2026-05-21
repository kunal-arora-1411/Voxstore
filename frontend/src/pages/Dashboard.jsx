import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/index';
import { useAuth } from '../context/AuthContext';
import { Logo, Btn, Card } from '../components/ui';

/* Count-up hook */
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (target === null || target === undefined) return;
    const start = performance.now();
    const raf = { id: null };
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) raf.id = requestAnimationFrame(tick);
    };
    raf.id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.id);
  }, [target]);
  return count;
}

const LiveBadge = () => (
  <span className="live-badge mono">
    <span className="live-dot" />
    <span style={{ fontSize: 11, letterSpacing: '0.16em' }}>LIVE</span>
  </span>
);

const StatusBadge = ({ status }) => {
  const map = {
    live:      { label: 'LIVE',      bg: 'var(--green-soft)',  fg: 'var(--green)',  border: '#bcd9c2' },
    deploying: { label: 'DEPLOYING', bg: 'var(--amber-soft)',  fg: 'var(--amber)',  border: '#ecd58e' },
    error:     { label: 'ERROR',     bg: '#fef2f2',            fg: '#b91c1c',       border: '#fecaca' },
    pending:   { label: 'PENDING',   bg: 'var(--bg-2)',        fg: 'var(--muted)',  border: 'var(--border)' },
  };
  const s = map[status] || map.pending;
  return (
    <span className="mono" style={{
      fontSize: 10.5, letterSpacing: '0.14em', padding: '3px 9px', borderRadius: 999,
      background: s.bg, color: s.fg, border: '1px solid ' + s.border,
    }}>{s.label}</span>
  );
};

const StatCard = ({ label, value, sub, accent }) => {
  const animated = useCountUp(typeof value === 'number' ? value : null);
  const display = typeof value === 'number'
    ? (animated !== null ? animated.toLocaleString() : '—')
    : value;

  return (
    <div className="dash-stat-card">
      <Card pad={20}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          {label}
        </div>
        <div className="serif dash-stat-value" style={{ color: accent || 'var(--ink)' }}>
          {display}
        </div>
        {sub && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>{sub}</div>}
      </Card>
    </div>
  );
};

export default function Dashboard() {
  const [sites, setSites]           = useState([]);
  const [selected, setSelected]     = useState(null);
  const [visitCount, setVisitCount] = useState(null);
  const [copied, setCopied]         = useState(false);
  const { user, logout }            = useAuth();
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();

  useEffect(() => { loadSites(); }, []);

  async function loadSites() {
    try {
      const { data } = await api.get('/sites');
      setSites(data);
      const newSiteId = searchParams.get('newSite');
      const target = newSiteId ? data.find(s => s._id === newSiteId) : data[0];
      if (target) selectSite(target);
    } catch { /* handled silently */ }
  }

  async function selectSite(site) {
    setSelected(site);
    setVisitCount(null);
    try {
      const { data } = await api.get(`/analytics/${site._id}`);
      setVisitCount(data.visitCount);
    } catch { /* non-critical */ }
  }

  async function doCopy() {
    if (!selected?.siteUrl) return;
    try { await navigator.clipboard.writeText(selected.siteUrl); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const deployedAt = selected
    ? new Date(selected.updatedAt || selected.createdAt).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  return (
    <div className="dash-page">
      <div className="dash-inner">

        {/* Top bar */}
        <div className="dash-topbar">
          <div className="dash-topbar-left">
            <Logo size={18} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.12em' }}>/ DASHBOARD</span>
          </div>
          <div className="dash-topbar-right">
            <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email}</span>
            <span className="dash-avatar">{(user?.email || 'U')[0].toUpperCase()}</span>
            <Btn size="sm" onClick={() => navigate('/build')}>＋ New site</Btn>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
            >Sign out</button>
          </div>
        </div>

        {sites.length === 0 ? (
          <div className="dash-empty">
            <div className="serif" style={{ fontSize: 36, marginBottom: 12 }}>No sites yet.</div>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Build your first site in under a minute.</p>
            <Btn size="lg" onClick={() => navigate('/build')}>Build my site ✦</Btn>
          </div>
        ) : (
          <div className="dash-grid">

            {/* Sidebar */}
            <aside className="dash-sidebar">
              <div className="dash-sidebar-label mono">Your sites</div>
              <ul className="dash-site-list">
                {sites.map(site => (
                  <li key={site._id}>
                    <button
                      onClick={() => selectSite(site)}
                      className="dash-site-btn"
                      style={{
                        background:   selected?._id === site._id ? 'var(--accent-tint)' : 'transparent',
                        border:       '1px solid ' + (selected?._id === site._id ? 'var(--accent-soft)' : 'transparent'),
                      }}
                    >
                      <div className="dash-site-name">{site.shopName}</div>
                      <StatusBadge status={site.status} />
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Main */}
            <main className="dash-main">
              {selected && (
                <div className="dash-content-grid">

                  {/* Hero card */}
                  <div className="dash-hero-outer">
                    <div className="dash-hero-gradient" />

                    <div className="dash-hero-top">
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          {selected.status === 'live' && <LiveBadge />}
                          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)' }}>
                            · DEPLOYED VIA VERCEL
                          </span>
                        </div>
                        <h2 className="serif" style={{ fontSize: 52, margin: '0 0 6px', fontStyle: 'normal', color: '#fff', lineHeight: 1.02 }}>
                          {selected.shopName}
                        </h2>
                        {selected.siteUrl && (
                          <a
                            href={selected.siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mono"
                            style={{
                              color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13,
                              borderBottom: '1px dashed rgba(255,255,255,0.25)', paddingBottom: 2,
                              transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={e => e.target.style.color = '#fff'}
                            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.65)'}
                          >
                            {selected.siteUrl.replace('https://', '')} ↗
                          </a>
                        )}
                      </div>

                      {/* Deploy metadata */}
                      <div className="dash-deploy-meta">
                        {[
                          ['DEPLOY_ID', selected.deployId ? selected.deployId.slice(-14) : '—'],
                          ['COMMITTED', deployedAt],
                          ['STATUS',    selected.status.toUpperCase()],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span className="mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em' }}>{k}</span>
                            <span className="mono" style={{ fontSize: 11, color: '#fff' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="dash-hero-actions">
                      {selected.siteUrl && (
                        <Btn variant="ghostDark" icon="⧉" onClick={() => window.open(selected.siteUrl, '_blank')}>Preview</Btn>
                      )}
                      <Btn variant="ghostDark" icon="⎘" onClick={doCopy}>{copied ? 'Copied!' : 'Copy link'}</Btn>
                      {selected.siteUrl && (
                        <Btn variant="ghostDark" icon="↗"
                          onClick={() => navigator.share?.({ url: selected.siteUrl, title: selected.shopName })}>
                          Share
                        </Btn>
                      )}
                      <Btn icon="✦" onClick={() => navigate('/build', { state: { formData: selected.formData, siteId: selected._id } })}>
                        Edit &amp; Regenerate
                      </Btn>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="dash-stats-grid">
                    <StatCard
                      label="Total visits"
                      value={visitCount !== null ? visitCount : null}
                      sub="Tracked via pixel"
                    />
                    <StatCard
                      label="Generations this month"
                      value={sites.length}
                      sub="2 left on free tier"
                    />
                    <StatCard
                      label="AI spend this month"
                      value={`$${(sites.length * 0.04).toFixed(2)}`}
                      sub="Set a cap in your OpenAI dashboard"
                      accent="var(--accent)"
                    />
                  </div>

                  {/* Tip bar */}
                  <div className="dash-tip-bar">
                    <span className="dash-tip-icon">💡</span>
                    <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
                      <strong style={{ fontWeight: 600 }}>Tip ·</strong> set an OpenAI usage cap from your account settings so an enthusiastic regeneration session can't turn into a surprise bill.
                    </div>
                  </div>

                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
