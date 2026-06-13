import { useState, useRef } from 'react';
import { Card, Btn, FieldLabel, Pill, ToneOption, Input } from './ui';
import { compressAndEncode } from '../utils/imageUtils';

/* ── constants ────────────────────────────────── */
const SWATCHES = ['#c8440a', '#0e0d0b', '#1f7a3a', '#2f5fa9', '#7a3eb1', '#b88410'];
const TONES = [
  { id: 'friendly',     icon: '☕', label: 'Friendly',     sub: 'warm, neighbourly' },
  { id: 'professional', icon: '💼', label: 'Professional', sub: 'crisp, considered' },
  { id: 'minimal',      icon: '✦',  label: 'Minimal',      sub: 'quiet, spacious' },
  { id: 'bold',         icon: '⚡', label: 'Bold',         sub: 'punchy, confident' },
];
const SPECIAL_FEATURES = [
  { id: 'vegan',      icon: '🌱', label: 'Vegan options' },
  { id: 'dog',        icon: '🐕', label: 'Dog-friendly' },
  { id: 'accessible', icon: '♿', label: 'Wheelchair accessible' },
  { id: 'wifi',       icon: '🛜', label: 'Free WiFi' },
  { id: 'outdoor',    icon: '🪑', label: 'Outdoor seating' },
  { id: 'parking',    icon: '🚗', label: 'Free parking' },
  { id: 'delivery',   icon: '🛵', label: 'Delivery available' },
  { id: 'ordering',   icon: '📦', label: 'Online ordering' },
  { id: 'giftcard',   icon: '🎁', label: 'Gift cards' },
  { id: 'loyalty',    icon: '⭐', label: 'Loyalty program' },
];
const PRICING_TIERS = [
  { id: 'budget',    label: '$',    sub: 'Budget-friendly' },
  { id: 'midrange',  label: '$$',   sub: 'Mid-range' },
  { id: 'premium',   label: '$$$',  sub: 'Premium' },
];
const SHOP_PHOTO_LABELS = ['Exterior', 'Interior', 'Team / Other'];
const DEFAULT = {
  shopName: '', tagline: '', products: [], hours: 'Mon–Fri 9am–6pm',
  address: '', tone: 'friendly', brandColor: '#c8440a', description: '',
  phone: '', email: '', instagram: '', facebook: '', website: '',
  promotions: '', pricingTier: 'midrange', specialFeatures: [],
  logoImage: null, heroImage: null, shopPhotos: [], productPhotos: {},
};

/* ── ImageUpload ─────────────────────────────────
   Single image upload zone with preview + remove.
   value: null | { data, ext, preview, sizeKb }
   onChange: (image | null) => void
────────────────────────────────────────────────── */
function ImageUpload({ value, onChange, label, hint, aspect = 'landscape', compact = false }) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setLoading(true);
    try {
      const maxW = aspect === 'square' ? 600 : 1400;
      const maxH = aspect === 'square' ? 600 : 900;
      const result = await compressAndEncode(file, { maxWidth: maxW, maxHeight: maxH });
      onChange(result);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  const h = compact ? 80 : aspect === 'landscape' ? 160 : 120;

  if (value) {
    return (
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', height: h, background: 'var(--bg-2)' }}>
        <img src={value.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(14,13,11,0)',
          display: 'flex', alignItems: 'flex-end', padding: 8, gap: 6,
          transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,13,11,0.45)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,13,11,0)'}
        >
          <span className="mono" style={{
            fontSize: 10.5, color: '#fff', background: 'rgba(0,0,0,0.55)',
            padding: '2px 6px', borderRadius: 4, opacity: 0,
            transition: 'opacity .15s',
          }} ref={el => { if (el) el.closest('div').addEventListener('mouseenter', () => el.style.opacity = 1); if (el) el.closest('div').addEventListener('mouseleave', () => el.style.opacity = 0); }}>
            {value.sizeKb}kb
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              marginLeft: 'auto', background: 'rgba(0,0,0,0.65)', color: '#fff',
              border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer',
              fontSize: 11, fontFamily: 'inherit',
            }}
          >Remove</button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: compact ? 4 : 8, cursor: 'pointer', height: h, borderRadius: 8,
        border: '1.5px dashed ' + (drag ? 'var(--accent)' : 'var(--border-strong)'),
        background: drag ? 'var(--accent-tint)' : 'var(--bg-2)',
        transition: 'all .15s ease',
      }}
    >
      <input
        ref={inputRef}
        type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0])}
      />
      {loading
        ? <span style={{ width: 20, height: 20, borderRadius: 999, border: '2px solid var(--accent-soft)', borderTopColor: 'var(--accent)', animation: 'spin .8s linear infinite' }} />
        : <span style={{
            width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: 999,
            background: '#fff', border: '1px solid var(--border)', color: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: compact ? 14 : 18,
          }}>↑</span>
      }
      {!compact && (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{label || 'Drop image or click to browse'}</div>
          {hint && <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>{hint}</div>}
        </>
      )}
    </label>
  );
}

/* ── ShopForm ─────────────────────────────────── */
export default function ShopForm({ onSubmit, onAutoGenerate, loading, autoLoading, initialValues }) {
  const [f, setF] = useState({ ...DEFAULT, ...initialValues });
  const [productInput, setProductInput] = useState('');

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const addProduct = () => {
    const v = productInput.trim();
    if (!v || f.products.includes(v) || f.products.length >= 20) return;
    set('products', [...f.products, v]);
    setProductInput('');
  };

  const removeProduct = (name) => {
    const updated = { ...f.productPhotos };
    delete updated[name];
    setF(prev => ({ ...prev, products: prev.products.filter(x => x !== name), productPhotos: updated }));
  };

  const setProductPhoto = (name, img) => {
    set('productPhotos', img ? { ...f.productPhotos, [name]: img } : (() => {
      const c = { ...f.productPhotos }; delete c[name]; return c;
    })());
  };

  const toggleFeature = (id) => {
    const has = f.specialFeatures.includes(id);
    set('specialFeatures', has ? f.specialFeatures.filter(x => x !== id) : [...f.specialFeatures, id]);
  };

  const addShopPhoto = (img) => {
    if (f.shopPhotos.length < 3 && img) set('shopPhotos', [...f.shopPhotos, { ...img, label: SHOP_PHOTO_LABELS[f.shopPhotos.length] }]);
  };
  const removeShopPhoto = (i) => set('shopPhotos', f.shopPhotos.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...f, products: f.products.filter(Boolean) });
  };

  const canSubmit = f.shopName.trim().length > 1;

  /* ── section header helper ── */
  const SectionHeader = ({ children, hint }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{children}</div>
      {hint && <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{hint}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Row 1: two-column text info ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="form-grid">

        {/* LEFT — The basics + Contact */}
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <Card label="The basics" pad={22}
            action={<span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>core info</span>}>
            <div style={{ display: 'grid', gap: 16 }}>
              <Input label="Shop name" value={f.shopName} onChange={e => set('shopName', e.target.value)} placeholder="The Corner Bakery" />
              <button
                type="button"
                disabled={!canSubmit || autoLoading}
                onClick={() => onAutoGenerate?.({ shopName: f.shopName.trim(), tone: f.tone, brandColor: f.brandColor, pricingTier: f.pricingTier })}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 7, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  border: '1px solid var(--accent)', background: 'var(--accent-tint)', color: 'var(--accent)',
                  fontWeight: 600, textAlign: 'left', opacity: canSubmit ? 1 : 0.55,
                }}
              >
                <span style={{ display: 'block' }}>{autoLoading ? 'Creating your brand…' : 'Just enter the shop name — AI builds everything ✦'}</span>
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 400, marginTop: 3, color: 'var(--muted)' }}>
                  Writes the story, products, tagline and visual direction, then generates the website.
                </span>
              </button>
              <Input label="Tagline" optional value={f.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Sourdough, slowly." />

              <div>
                <FieldLabel>Products & services</FieldLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={productInput}
                    onChange={e => setProductInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addProduct(); } }}
                    placeholder="Espresso, sourdough, dog treats…"
                    style={{ flex: 1, padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14.5, background: '#fff' }}
                  />
                  <Btn variant="ghost" onClick={addProduct}>＋ Add</Btn>
                </div>
                {f.products.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {f.products.map(p => <Pill key={p} onRemove={() => removeProduct(p)}>{p}</Pill>)}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
                  Press Enter to add · Add photos below · First 6 featured on site
                </div>
              </div>

              <Input label="Opening hours" value={f.hours} onChange={e => set('hours', e.target.value)} placeholder="Tue–Sun · 7am–4pm" mono />
              <Input label="Address" optional value={f.address} onChange={e => set('address', e.target.value)} placeholder="142 Linden Ave, Oakland CA" />
            </div>
          </Card>

          <Card label="Contact & social" pad={22}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Phone" optional value={f.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 510 555 0100" mono />
                <Input label="Email" optional value={f.email} onChange={e => set('email', e.target.value)} placeholder="hello@shop.com" mono />
              </div>
              <Input label="Website" optional value={f.website} onChange={e => set('website', e.target.value)} placeholder="https://yourshop.com" mono />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <FieldLabel optional>Instagram</FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                    <span className="mono" style={{ padding: '11px 10px 11px 13px', color: 'var(--muted)', fontSize: 14, borderRight: '1px solid var(--border)', background: 'var(--bg-2)' }}>@</span>
                    <input value={f.instagram} onChange={e => set('instagram', e.target.value)} placeholder="yourshop" className="mono"
                      style={{ flex: 1, border: 'none', padding: '11px 12px', fontSize: 14, background: 'transparent' }} />
                  </div>
                </div>
                <Input label="Facebook" optional value={f.facebook} onChange={e => set('facebook', e.target.value)} placeholder="facebook.com/yourshop" mono />
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT — Look & feel + Logo + Description */}
        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <Card label="Look & feel" pad={22}>
            <FieldLabel>Tone</FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {TONES.map(({ id, icon, label, sub }) => (
                <ToneOption key={id} icon={icon} label={label} sub={sub}
                  selected={f.tone === id} onClick={() => set('tone', id)} />
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <FieldLabel>Pricing tier</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRICING_TIERS.map(({ id, label, sub }) => (
                  <button key={id} type="button" onClick={() => set('pricingTier', id)} style={{
                    flex: 1, padding: '10px 8px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    background: f.pricingTier === id ? 'var(--accent-tint)' : '#fff',
                    border: '1px solid ' + (f.pricingTier === id ? 'var(--accent)' : 'var(--border)'),
                    transition: 'all .15s',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: f.pricingTier === id ? 'var(--accent)' : 'var(--ink)' }}>{label}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <FieldLabel>Brand colour</FieldLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                {SWATCHES.map(c => {
                  const sel = f.brandColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button key={c} type="button" onClick={() => set('brandColor', c)} aria-label={c} style={{
                      width: 28, height: 28, borderRadius: 999, cursor: 'pointer', background: c, padding: 0,
                      border: '2px solid ' + (sel ? 'var(--ink)' : 'transparent'),
                      boxShadow: sel ? '0 0 0 2px #fff inset' : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                    }} />
                  );
                })}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 6px', borderRadius: 999, border: '1px solid var(--border)', background: '#fff' }}>
                  <input type="color" value={f.brandColor} onChange={e => set('brandColor', e.target.value)}
                    style={{ width: 22, height: 22, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }} />
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{f.brandColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card label="Logo & description" pad={22}>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, alignItems: 'start' }}>
              <div>
                <FieldLabel optional>Logo</FieldLabel>
                <ImageUpload
                  value={f.logoImage}
                  onChange={img => set('logoImage', img)}
                  label="Logo"
                  hint="PNG · SVG"
                  aspect="square"
                  compact
                />
                {!f.logoImage && <div className="mono" style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 5, textAlign: 'center' }}>We will create one</div>}
                {f.logoImage && <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>{f.logoImage.sizeKb}kb</div>}
              </div>
              <div>
                <FieldLabel optional>Promotions / specials</FieldLabel>
                <input
                  value={f.promotions} onChange={e => set('promotions', e.target.value)}
                  placeholder="e.g. 10% off first order, happy hour 3–5pm…"
                  style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, background: '#fff' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <FieldLabel>About your shop</FieldLabel>
              <textarea
                value={f.description} onChange={e => set('description', e.target.value)}
                placeholder="A small bakery in West Oakland. Sourdough, croissants, and seasonal galettes. Family-run since 2019. Counter service, dog-friendly bench out front."
                rows={4}
                style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14.5, lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical', background: '#fff' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
                <span>2–4 sentences works best.</span>
                <span className="mono">{f.description.length}/600</span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <FieldLabel optional>Special features</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {SPECIAL_FEATURES.map(({ id, icon, label }) => {
                  const on = f.specialFeatures.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleFeature(id)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5,
                      background: on ? 'var(--accent-tint)' : '#fff',
                      border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                      color: on ? 'var(--accent)' : 'var(--ink-2)',
                      transition: 'all .12s',
                    }}>
                      <span>{icon}</span><span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Row 2: Shop photos ───────────────────────────── */}
      <div style={{ marginTop: 18 }}>
        <Card pad={22}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Shop photos</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Upload your own, or leave any slot blank and we will create matching branded artwork.</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>up to 4 · optional</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }} className="photo-grid">
            {/* Hero photo slot */}
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hero / Banner</div>
              <ImageUpload
                value={f.heroImage}
                onChange={img => set('heroImage', img)}
                label="Hero photo"
                hint="Wide banner · 1400px+"
                aspect="landscape"
              />
            </div>

            {/* Gallery slots */}
            {SHOP_PHOTO_LABELS.map((lbl, i) => (
              <div key={lbl}>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--muted)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{lbl}</div>
                {f.shopPhotos[i]
                  ? <ImageUpload value={f.shopPhotos[i]} onChange={() => removeShopPhoto(i)} aspect="landscape" />
                  : <ImageUpload value={null} onChange={img => { if (img) { const sp = [...f.shopPhotos]; sp[i] = { ...img, label: lbl }; set('shopPhotos', sp); } }} label={lbl} hint="Any orientation" aspect="landscape" />
                }
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Product photos ────────────────────────── */}
      {f.products.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Card pad={22}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Product photos</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>Add a photo for each product — AI will use them in the products section.</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{Object.keys(f.productPhotos).length}/{f.products.length} uploaded</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
              {f.products.map(name => (
                <div key={name}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 500, color: 'var(--ink-2)',
                    marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }} title={name}>{name}</div>
                  <ImageUpload
                    value={f.productPhotos[name] || null}
                    onChange={img => setProductPhoto(name, img)}
                    label="Add photo"
                    aspect="square"
                    compact
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Footer bar ───────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <Btn variant="ghost" type="button" onClick={() => window.history.back()}>← Back</Btn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)', letterSpacing: '0.08em' }}>
            EST. COST · $0.04–$0.08 · ~40s
          </span>
          <Btn size="lg" type="submit" disabled={!canSubmit || loading}>
            {loading ? 'Starting…' : 'Generate my site ✦'}
          </Btn>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .form-grid { grid-template-columns: 1fr !important; }
          .photo-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .photo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
