import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import './Results.css';

const API = 'http://localhost:8000';
const FLAGS = { USA: '🇺🇸', UK: '🇬🇧', India: '🇮🇳', Japan: '🇯🇵' };
const FULL_NAMES = { USA: 'United States', UK: 'United Kingdom', India: 'India', Japan: 'Japan' };


// ── CircleGauge ─────────────────────────────────────────────────────────────
const CircleGauge = ({ pct, country, isBest }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = pct === 100 ? '#22c55e' : pct >= 60 ? '#f0a500' : '#e03c3c';
  return (
    <div className={`gauge-wrap ${isBest ? 'gauge-best' : ''}`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} className="gauge-bg" />
        <circle cx="50" cy="50" r={r} className="gauge-arc"
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="50" y="55" textAnchor="middle" className="gauge-text">{pct}%</text>
      </svg>
      <div className="gauge-label">
        {FLAGS[country]} {FULL_NAMES[country]}
        {isBest && <span className="best-badge">⭐ Best</span>}
      </div>
    </div>
  );
};


// ── SearchResults ────────────────────────────────────────────────────────────
function SearchResults({ query }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`${API}/search?device=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(json => {
        if (json.error || !json.device) setError('Device not found. Try a different name.');
        else setData(json);
      })
      .catch(() => setError('Could not reach the backend. Make sure the server is running on port 8000.'))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) return <Spinner label={`Searching for "${query}"…`} />;
  if (error) return <ErrorCard msg={error} />;

  const { device, requirements } = data;
  const countryOrder = ['USA', 'UK', 'India', 'Japan'];

  return (
    <div className="res-body">
      <div className="res-device-card">
        <img src={device.image_url} alt={device.name} className="res-device-img"
          onError={e => { e.target.src = 'https://placehold.co/200x160?text=Device'; }} />
        <div className="res-device-info">
          <span className="res-device-category">{device.category}</span>
          <h2 className="res-device-name">{device.name}</h2>
          <p className="res-device-desc">{device.description}</p>
        </div>
      </div>

      {device.warning && (
        <div className="res-warning-box">
          <div className="res-warning-title">⚠️ Warnings</div>
          {device.warning.split('. ').filter(w => w.trim()).map((w, i) => (
            <p className="res-warning-text" key={i}>• {w.trim()}{w.endsWith('.') ? '' : '.'}</p>
          ))}
        </div>
      )}

      <div className="res-section-title">🌍 Country Label Requirements</div>
      <div className="res-country-grid">
        {countryOrder.map(country => (
          <div key={country} className="res-country-card">
            <div className="res-country-header">
              <span className="res-country-flag">{FLAGS[country]}</span>
              <span className="res-country-name">{FULL_NAMES[country]}</span>
            </div>
            <ul className="res-req-list">
              {(requirements[country] || []).map(field => (
                <li key={field} className="res-req-item">
                  <span className="res-check">✅</span> {field}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── UploadResults ────────────────────────────────────────────────────────────
function UploadResults({ file }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    fetch(`${API}/upload`, { method: 'POST', body: form })
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError('Could not reach the backend. Make sure the server is running on port 8000.'))
      .finally(() => setLoading(false));
  }, [file]);

  if (loading) return <Spinner label="Extracting label fields via OCR…" />;
  if (error) return <ErrorCard msg={error} />;

  const { extracted_fields, compliance, best_match } = data;
  const countryOrder = ['USA', 'UK', 'India', 'Japan'];
  const fieldRows = [
    'Device Name', 'Manufacturer', 'UDI', 'Lot Number',
    'Expiry Date', 'Warnings', 'Storage Conditions', 'MAH',
    'UK Responsible Person', 'License Numbers', 'Rx Only',
  ];

  return (
    <div className="res-body">
      <div className="res-section-title">🔍 Extracted Label Fields</div>
      <div className="res-fields-card">
        {fieldRows.map(field => {
          const val = extracted_fields[field];
          const found = val && val.trim();
          return (
            <div key={field} className={`res-field-row ${found ? 'res-field-found' : 'res-field-missing'}`}>
              <span className="res-field-name">{field}</span>
              <span className="res-field-status">{found ? '✅ Found' : '❌ Not Found'}</span>
              {found && <span className="res-field-value">{val}</span>}
            </div>
          );
        })}
      </div>

      <div className="res-section-title">📊 Country Compliance Scores</div>
      <div className="res-gauges-grid">
        {countryOrder.map(country => {
          const score = compliance[country];
          return (
            <div key={country} className={`res-gauge-card ${country === best_match ? 'res-gauge-best' : ''}`}>
              <CircleGauge pct={score.percentage} country={country} isBest={country === best_match} />
              <div className="res-progress-wrap">
                <div className="res-progress-fill" style={{
                  width: `${score.percentage}%`,
                  background: score.percentage === 100 ? '#22c55e' : score.percentage >= 60 ? '#f0a500' : '#e03c3c',
                }} />
              </div>
              {score.missing.length > 0 && (
                <div className="res-missing-list">
                  <span className="res-missing-label">Missing:</span>
                  {score.missing.map(f => (
                    <span key={f} className="res-missing-chip">{f}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="res-best-banner">
        <span className="res-best-flag">{FLAGS[best_match]}</span>
        <div>
          <div className="res-best-label">Best Compliance Match</div>
          <div className="res-best-country">{FULL_NAMES[best_match]}</div>
          <div className="res-best-pct">{compliance[best_match].percentage}% fields satisfied</div>
        </div>
      </div>
    </div>
  );
}

// ── Spinner / Error ──────────────────────────────────────────────────────────
const Spinner = ({ label }) => (
  <div className="res-spinner-wrap">
    <div className="res-spinner" />
    <p className="res-spinner-label">{label}</p>
  </div>
);

const ErrorCard = ({ msg }) => (
  <div className="res-error-card">
    <span>⚠️</span>
    <p>{msg}</p>
  </div>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const query = params.get('q');
  const file = location.state?.file ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!query && !file) navigate('/', { replace: true });
  }, [query, file, navigate]);

  if (!query && !file) return null;

  return (
    <div className="res-wrapper">
      <div className="res-alert-bar">
        🏥 Regulatory compliance checker for medical device labels — India · USA · UK · Japan
      </div>

      <header className="res-header">
        <div className="res-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="res-logo-cross">✚</div>
          <div className="res-logo-text-block">
            <span className="res-logo-title">MedLabel Verify</span>
            <span className="res-logo-subtitle">Device Label Compliance</span>
          </div>
        </div>
        <nav className="res-nav">
          <span className="res-nav-item" onClick={() => navigate('/')}>Home</span>
          <span className="res-nav-item" onClick={() => navigate('/regulations')}>Regulations</span>
          <span className="res-nav-item" onClick={() => navigate('/help')}>Help</span>
        </nav>
      </header>

      <section className="res-hero">
        <div className="res-hero-left">
          <div className="res-hero-tag">
            <span className="res-hero-tag-dot" />
            {query ? 'Device Search Results' : 'Label Scan Results'}
          </div>
          <h1 className="res-hero-title">
            {query
              ? <><span className="res-hero-highlight">"{query}"</span><br />Requirements</>
              : <>Label<br /><span className="res-hero-highlight">Compliance Report</span></>
            }
          </h1>
          <p className="res-hero-desc">
            {query
              ? 'Country-wise labeling requirements for this medical device across FDA, MHRA, CDSCO, and PMDA.'
              : 'OCR-extracted fields scored against 4 regulatory frameworks. Review missing fields below.'
            }
          </p>
          <button className="res-back-btn" onClick={() => navigate('/')}>← Back to Home</button>
        </div>
        <div className="res-hero-right">
          <div className="res-hero-card">
            <div className="res-hero-card-header">
              {query ? '🔍 Search Info' : '📋 Scan Info'}
            </div>
            <div className="res-hero-card-row">
              <span>{query ? 'Device' : 'File'}</span>
              <span style={{ color: '#0066cc', fontWeight: 700, fontSize: '0.82rem' }}>
                {query || file?.name}
              </span>
            </div>
            <div className="res-hero-card-row">
              <span>Countries</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>4 ✅</span>
            </div>
            <div className="res-hero-card-row-stack">
              <span>Frameworks</span>
              <span className="res-frameworks-value">FDA · MHRA · CDSCO · PMDA</span>
            </div>
            <div className="res-hero-card-footer">Scroll down to view results</div>
          </div>
        </div>
      </section>

      {query ? <SearchResults query={query} /> : <UploadResults file={file} />}

      <footer className="res-footer">
        <div className="res-footer-left">
          <span className="res-footer-logo">✚ MedLabel Verify</span>
          <span className="res-footer-copy">© 2026 Medical Device Label Compliance Checker</span>
        </div>
        <div className="res-footer-right">
          <span>CDSCO</span><span>FDA</span><span>MHRA</span><span>PMDA</span>
        </div>
      </footer>
    </div>
  );
}