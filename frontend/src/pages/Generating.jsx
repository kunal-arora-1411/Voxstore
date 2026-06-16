import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/index';

const STAGES = [
  'brand brief built',
  'Stitch designing',
  'engineering Stitch HTML',
  'sanitizing website',
  'deploying to Vercel',
  'saving URL',
];

const PipelineNode = ({ status, label }) => {
  const palette = {
    done:    { bg: 'var(--green-soft)',  fg: 'var(--green)',  border: '#bcd9c2', dot: 'var(--green)' },
    active:  { bg: 'var(--amber-soft)',  fg: 'var(--amber)',  border: '#ecd58e', dot: 'var(--amber)' },
    pending: { bg: 'var(--bg-2)',        fg: 'var(--muted)',  border: 'var(--border)', dot: 'var(--muted-2)' },
  }[status];

  return (
    <div className="mono" style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 10px',
      background: palette.bg, color: palette.fg, border: '1px solid ' + palette.border,
      borderRadius: 999, fontSize: 12, whiteSpace: 'nowrap',
      transition: 'background 0.4s ease, color 0.4s ease, border-color 0.4s ease',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: 50, background: palette.dot,
        transition: 'background 0.4s ease',
        animation: status === 'active' ? 'pulseSoft 1.2s ease-in-out infinite' : 'none',
      }} />
      {label}
    </div>
  );
};

export default function Generating() {
  const navigate  = useNavigate();
  const { state } = useLocation();
  const formData  = state?.formData;

  const [stageIdx, setStageIdx] = useState(0);
  const [pct, setPct]           = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [tokens, setTokens]     = useState(184);
  const [error, setError]       = useState('');

  const apiDone   = useRef(false);
  const apiResult = useRef(null);
  const animDone  = useRef(false);

  useEffect(() => {
    if (!formData) navigate('/build', { replace: true });
  }, [formData]);

  // Guard: React 18 StrictMode intentionally mounts→unmounts→remounts every
  // component in dev mode, which causes useEffect([]) to fire twice. Without
  // this guard, two POST /sites/generate requests would fire concurrently and
  // create two sites. The ref persists across the StrictMode remount cycle.
  const hasFired    = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!formData) return;
    if (hasFired.current) return;   // already in-flight — skip the second mount
    hasFired.current = true;

    const controller = new AbortController();
    controllerRef.current = controller;

    api.post('/sites/generate', formData, { signal: controller.signal })
      .then(({ data }) => {
        apiResult.current = data;
        apiDone.current = true;
        maybeFinish();
      })
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return; // aborted — ignore
        setError(err.response?.data?.error || 'Generation failed. Please try again.');
      });

    // Only abort on true unmount (navigating away), not StrictMode's synthetic remount.
    // StrictMode remount: hasFired is already true so the new mount returns early —
    // the cleanup from the first mount must NOT abort the in-flight request.
    return () => {
      if (!hasFired.current) controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!formData) return;
    const t0 = Date.now();
    // Slow crawl to 88% over 150s to cover the pipeline duration.
    // Once the API responds, we rush to 100% and navigate — no waiting.
    const CRAWL_TARGET = 0.88;
    const CRAWL_MS     = 150000;
    let raf;
    const tick = () => {
      const dt = Date.now() - t0;
      let p;
      if (apiDone.current) {
        // API finished — jump to 100% immediately (animation handled by maybeFinish)
        p = 1;
      } else {
        p = Math.min((dt / CRAWL_MS) * CRAWL_TARGET, CRAWL_TARGET);
      }
      setPct(p);
      setStageIdx(Math.min(STAGES.length - 1, Math.floor(p * STAGES.length)));
      setTokens(184 + Math.floor(p * 2860));
      setElapsed(dt / 1000);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function maybeFinish() {
    if (!apiDone.current || !apiResult.current) return;
    // Flash 100% for 800ms so the user sees completion, then navigate
    setPct(1);
    setStageIdx(STAGES.length - 1);
    setTimeout(() => {
      navigate(`/dashboard?newSite=${apiResult.current.siteId}`, { replace: true });
    }, 800);
  }

  const outSize = Math.floor(2.2 + pct * 13.6);

  if (error) {
    return (
      <div className="gen-error-layout">
        <div className="gen-error-inner">
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 className="serif" style={{ fontSize: 32, margin: '0 0 12px' }}>Generation failed</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{error}</p>
          <button className="gen-retry-btn" onClick={() => navigate('/build', { state: { formData } })}>
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gen-layout">
      <div className="gen-inner">

        {/* Orbital spinner + headline */}
        <div className="gen-headline-block">
          <div className="gen-spinner-host">
            <div className="gen-spinner">
              <div className="gen-ring-outer" />
              <div className="gen-ring-inner" />
              <div className="gen-ring-dot" />
            </div>
          </div>

          <div>
            <h1 className="gen-h1 serif">Building your site…</h1>
            <p className="gen-subtext">
              This takes about 30–45 seconds. You can close the tab — we'll email you when it's live.
            </p>
          </div>
        </div>

        {/* Build pipeline */}
        <div className="gen-pipeline-wrap">
          <div className="gen-pipeline-eyebrow mono">── BUILD PIPELINE</div>
          <div className="gen-pipeline-nodes">
            {STAGES.map((s, i) => {
              const status = i < stageIdx ? 'done' : i === stageIdx ? 'active' : 'pending';
              return (
                <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <PipelineNode status={status} label={s} />
                  {i < STAGES.length - 1 && (
                    <span style={{
                      color: i < stageIdx ? 'var(--green)' : 'var(--muted-2)',
                      fontSize: 14, padding: '0 2px',
                      transition: 'color 0.4s ease',
                    }}>→</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="gen-progress-wrap">
          <div className="gen-progress-track">
            <div
              className="gen-progress-fill"
              style={{ width: (pct * 100).toFixed(1) + '%' }}
            />
          </div>
          <div className="gen-progress-labels">
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {Math.round(pct * 100)}% &nbsp;·&nbsp; {elapsed.toFixed(1)}s elapsed
            </span>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {STAGES[stageIdx]}
            </span>
          </div>
        </div>

        {/* Run metadata */}
        <div className="gen-meta-box">
          <div className="gen-meta-eyebrow mono">Run metadata</div>
          <div className="gen-meta-grid">
            {[
              ['design',        'Google Stitch'],
              ['engineering',   'gpt-4o'],
              ['prompt tokens', tokens.toLocaleString()],
              ['output',        outSize + ' kb'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="gen-meta-key mono">{k}</div>
                <div className="gen-meta-val mono">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gen-skip-link">
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline' }}
          >
            Skip to dashboard →
          </button>
        </div>

      </div>
    </div>
  );
}
