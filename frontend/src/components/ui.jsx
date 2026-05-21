/* Shared atomic UI primitives — SiteSpark design system */

export const Logo = ({ size = 18 }) => (
  <div
    className="ui-logo mono"
    style={{ fontSize: size }}
  >
    <span
      className="ui-logo-mark"
      style={{
        width:    size * 0.95,
        height:   size * 0.95,
        fontSize: size * 0.62,
      }}
    >✦</span>
    <span>Site<span style={{ color: 'var(--accent)', fontWeight: 600 }}>Spark</span></span>
  </div>
);

export const Btn = ({
  variant = 'primary', children, onClick,
  full, size = 'md', icon, disabled, type = 'button',
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={[
      'ui-btn',
      `ui-btn-${variant}`,
      `ui-btn-${size}`,
      full ? 'ui-btn-full' : '',
    ].filter(Boolean).join(' ')}
  >
    {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
    <span>{children}</span>
  </button>
);

export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    <div className="mono" style={{ fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.16em' }}>{label}</div>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

export const Card = ({ children, style, dark, pad = 24, label, action }) => (
  <section
    className="ui-card-base"
    style={{
      background:   dark ? 'var(--ink)' : 'var(--card)',
      border:       dark ? '1px solid #1c1a16' : '1px solid var(--border)',
      color:        dark ? '#fff' : 'var(--ink)',
      padding:      pad,
      ...style,
    }}
  >
    {(label || action) && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        {label && (
          <div className="mono" style={{
            fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: dark ? 'rgba(255,255,255,0.55)' : 'var(--muted)',
          }}>{label}</div>
        )}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const FieldLabel = ({ children, optional }) => (
  <div className="mono" style={{
    fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--muted)', marginBottom: 6,
    display: 'flex', justifyContent: 'space-between',
  }}>
    <span>{children}</span>
    {optional && <span style={{ color: 'var(--muted-2)', textTransform: 'none', letterSpacing: 0 }}>optional</span>}
  </div>
);

export const Input = ({ label, hint, value, onChange, placeholder, type = 'text', optional, mono }) => (
  <label style={{ display: 'block' }}>
    {label && <FieldLabel optional={optional}>{label}</FieldLabel>}
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className={['ui-input-field', mono ? 'mono' : ''].filter(Boolean).join(' ')}
    />
    {hint && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>{hint}</div>}
  </label>
);

export const Pill = ({ children, onRemove }) => (
  <span className="mono" style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 999, padding: '4px 10px 4px 12px', fontSize: 12, color: 'var(--ink-2)',
  }}>
    {children}
    <button onClick={onRemove} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--muted)', padding: 0, marginLeft: 2, fontSize: 13, lineHeight: 1,
    }}>×</button>
  </span>
);

export const ToneOption = ({ icon, label, sub, selected, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className={['ui-tone-opt', selected ? 'ui-tone-selected' : ''].filter(Boolean).join(' ')}
    style={{
      background:  selected ? 'var(--accent-tint)' : '#fff',
      border:      '1px solid ' + (selected ? 'var(--accent)' : 'var(--border)'),
    }}
  >
    <span style={{
      width: 34, height: 34, borderRadius: 6, flex: '0 0 auto',
      background: selected ? 'rgba(200,68,10,0.12)' : 'var(--bg-2)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      transition: 'background 0.2s ease',
    }}>{icon}</span>
    <span style={{ display: 'block' }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: selected ? 'var(--accent)' : 'var(--ink)', transition: 'color 0.2s ease' }}>{label}</div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
    </span>
  </button>
);

export const StepDots = ({ step, total = 3, labels = ['Account', 'Shop details', 'Generate'] }) => (
  <div className="ui-step-dots">
    {Array.from({ length: total }).map((_, i) => {
      const done = i < step, active = i === step;
      return (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className={['ui-step-circle', active ? 'ui-step-circle-active' : ''].filter(Boolean).join(' ')}
            style={{
              background:   done ? 'var(--ink)' : active ? 'var(--accent)' : '#fff',
              border:       '1px solid ' + (done ? 'var(--ink)' : active ? 'var(--accent)' : 'var(--border-strong)'),
              color:        (done || active) ? '#fff' : 'var(--muted-2)',
            }}
          >{done ? '✓' : i + 1}</span>
          <span className="mono" style={{
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: active ? 'var(--ink)' : 'var(--muted-2)',
            fontWeight: active ? 600 : 400,
          }}>{labels[i]}</span>
          {i < total - 1 && <span className="ui-step-connector" />}
        </span>
      );
    })}
  </div>
);
