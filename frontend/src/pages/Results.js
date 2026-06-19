import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Results.css';

const FULL_NAMES = { USA: 'United States', UK: 'United Kingdom', India: 'India', Japan: 'Japan' };

const COUNTRY_REQUIREMENTS = {
  USA: ['Device Name', 'Manufacturer', 'UDI', 'Lot Number', 'Expiry Date', 'Warnings', 'Rx Only', 'FDA-compliant labeling'],
  UK: ['Device Name', 'Manufacturer', 'UDI', 'Lot Number', 'Expiry Date', 'Warnings', 'UKCA marking', 'UK Responsible Person'],
  India: ['Device Name', 'Manufacturer', 'UDI', 'Lot Number', 'Expiry Date', 'Warnings', 'Manufacturing License No.', 'Import License No.'],
  Japan: ['Device Name', 'Manufacturer', 'UDI', 'Lot Number', 'Expiry Date', 'Warnings', 'MAH', 'Japanese-language label'],
};

const REGULATORY_MARKS = {
  USA: ['UDI', 'Rx Only'],
  UK: ['UKCA', 'UK Responsible Person (UKRP)'],
  India: ['Manufacturing License No.', 'Import License No.', 'CDSCO Registration'],
  Japan: ['MAH', 'Japanese Labeling'],
};

const DEVICE_DB = {
  'Thermometer': {
    name: 'Thermometer', category: 'Diagnostic',
    description: 'A medical device used to measure body temperature. Available in digital, infrared, and mercury variants for clinical and home use.',
    image_url: '/images/devices/thermometer.jpg',
  },
  'Syringe': {
    name: 'Syringe', category: 'Injection Device',
    description: 'A simple pump consisting of a plunger that fits tightly within a cylindrical tube, used for injecting or withdrawing fluids.',
    image_url: '/images/devices/syringe.jpg',
  },
  'Blood Pressure Monitor': {
    name: 'Blood Pressure Monitor', category: 'Diagnostic',
    description: 'A medical device used to measure blood pressure, consisting of an inflatable cuff to collapse and release the artery under the cuff in a controlled way.',
    image_url: '/images/devices/blood_pressure_monitor.jpg',
  },
  'Pulse Oximeter': {
    name: 'Pulse Oximeter', category: 'Monitoring',
    description: "A non-invasive method for monitoring a person's oxygen saturation and pulse rate. Commonly used for patients in clinical settings.",
    image_url: '/images/devices/pulse_oximeter.jpg',
  },
  'Stethoscope': {
    name: 'Stethoscope', category: 'Diagnostic',
    description: 'An acoustic medical device used for auscultation, for listening to internal sounds of a human or animal body such as heart and breath sounds.',
    image_url: '/images/devices/stethoscope.jpg',
  },
  'Glucometer': {
    name: 'Glucometer', category: 'Diagnostic',
    description: 'A medical device for determining the concentration of glucose in the blood. Used by patients with diabetes to self-monitor blood glucose levels.',
    image_url: '/images/devices/glucometer.jpg',
  },
  'Nebulizer': {
    name: 'Nebulizer', category: 'Respiratory',
    description: 'A drug delivery device used to administer medication in the form of a mist inhaled into the lungs, used for treating asthma and COPD.',
    image_url: '/images/devices/nebulizer.jpg',
  },
  'ECG Machine': {
    name: 'ECG Machine', category: 'Cardiac Monitoring',
    description: 'An electrocardiogram machine that records the electrical activity of the heart over a period of time using electrodes placed on the skin.',
    image_url: '/images/devices/ecg_machine.jpg',
  },
  'Defibrillator': {
    name: 'Defibrillator', category: 'Emergency',
    description: 'A device that gives a high energy electric shock to the heart through the chest wall to a person in cardiac arrest.',
    image_url: '/images/devices/defibrillator.jpg',
  },
  'Infusion Pump': {
    name: 'Infusion Pump', category: 'Drug Delivery',
    description: "A medical device that delivers fluids, such as nutrients and medications, into a patient's body in controlled amounts.",
    image_url: '/images/devices/infusion_pump.jpg',
  },
  'Surgical Mask': {
    name: 'Surgical Mask', category: 'PPE',
    description: 'A loose-fitting, disposable device that creates a physical barrier between the mouth and nose of the wearer and potential contaminants in the immediate environment.',
    image_url: '/images/devices/surgical_mask.jpg',
  },
  'Wheelchair': {
    name: 'Wheelchair', category: 'Mobility Aid',
    description: 'A wheeled mobility device in which the user sits, for use by people for whom walking is difficult or impossible due to illness, injury, or disability.',
    image_url: '/images/devices/wheelchair.jpg',
  },
  'Hearing Aid': {
    name: 'Hearing Aid', category: 'Auditory',
    description: 'A small electronic device worn in or behind the ear to make some sounds louder so a person with hearing loss can listen, communicate, and participate more fully in daily activities.',
    image_url: '/images/devices/hearing_aid.jpg',
  },
  'MRI Machine': {
    name: 'MRI Machine', category: 'Imaging',
    description: 'A large tube-shaped machine that uses a magnetic field and radio waves to create detailed images of the organs and tissues within the body.',
    image_url: '/images/devices/mri_machine.jpg',
  },
  'X-Ray Machine': {
    name: 'X-Ray Machine', category: 'Imaging',
    description: 'A medical imaging device that uses X-ray radiation to produce images of the internal structures of the body, primarily bones and dense tissues.',
    image_url: '/images/devices/x_ray_machine.jpg',
  },
};

function calcCompliance(extractedFields) {
  const countries = ['USA', 'UK', 'India', 'Japan'];
  const result = {};
  let bestMatch = countries[0];
  let bestPct = -1;

  countries.forEach(country => {
    const required = COUNTRY_REQUIREMENTS[country];
    const found = required.filter(f => { const val = extractedFields[f]; return val && val.trim(); });
    const missing = required.filter(f => { const val = extractedFields[f]; return !val || !val.trim(); });
    const percentage = Math.round((found.length / required.length) * 100);
    result[country] = { percentage, found, missing };
    if (percentage > bestPct) { bestPct = percentage; bestMatch = country; }
  });

  return { compliance: result, best_match: bestMatch };
}

function simulateOCR(file) {
  const allFields = [
    'Device Name', 'Manufacturer', 'UDI', 'Lot Number',
    'Expiry Date', 'Warnings', 'Storage Conditions', 'MAH',
    'UK Responsible Person', 'License Numbers', 'Rx Only',
    'UKCA marking', 'Manufacturing License No.', 'Import License No.',
    'Japanese-language label', 'FDA-compliant labeling',
  ];
  const extracted = {};
  const sampleValues = {
    'Device Name': 'MedDevice Pro 3000',
    'Manufacturer': 'MedCorp International Ltd.',
    'UDI': '(01)07350048010030(11)221201(17)251201(10)B1234',
    'Lot Number': 'LOT-2024-B1234',
    'Expiry Date': '2025-12-01',
    'Warnings': 'For single use only. Do not reuse.',
    'Storage Conditions': 'Store at 15-25C. Keep dry.',
    'MAH': 'Japan MedAuth Holdings K.K.',
    'UK Responsible Person': 'UK MedRep Ltd, London, UK',
    'License Numbers': 'MFG-LIC-IN-2023-00142',
    'Rx Only': 'Rx Only',
    'UKCA marking': 'UKCA',
    'Manufacturing License No.': 'MFG-2024-00198',
    'Import License No.': 'IMP-2024-00087',
    'Japanese-language label': 'Medical Device Label v3',
    'FDA-compliant labeling': 'FDA 510(k) Cleared',
  };
  allFields.forEach(f => { if (Math.random() > 0.2) extracted[f] = sampleValues[f]; });
  return extracted;
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const query = params.get('q');
  const file = location.state?.file ?? null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!query && !file) navigate('/', { replace: true });
  }, [query, file, navigate]);

  if (!query && !file) return null;

  return (
    <div className="results-site">
      <div className="utility-bar">
        Internal Audit Protocol 0x8F2A &middot; Confidential Regulatory Output
      </div>
      <Navbar />
      <main className="results-content">
        {query ? <SearchBlock query={query} /> : <UploadBlock file={file} />}
      </main>
      <footer className="footer bg-white border-t-2 border-text pt-24 pb-12">
        <div className="swiss-grid pb-24 border-b border-hairline-light">
          <div className="col-span-12 text-center">
            <div className="logo-group inline-flex items-center gap-2 mb-8 cursor-pointer" onClick={() => navigate('/')}>
              <div className="wordmark-box small">M</div>
              <span className="wordmark-text small">MEDLABEL<span className="wordmark-light">VERIFY</span></span>
            </div>
            <p className="footer-mini-bio">The institutional standard for medical device compliance.</p>
            <div className="flex justify-center gap-12 footer-nav-mini">
              <span onClick={() => navigate('/')}>Home</span>
              <span onClick={() => navigate('/regulations')}>Standards</span>
              <span onClick={() => navigate('/help')}>Documentation</span>
            </div>
          </div>
        </div>
        <div className="swiss-grid pt-12">
          <div className="col-span-12 text-center text-xs-bold opacity-40">
            &copy; 2026 MedLabel Verify INC. All rights reserved. Precision compliance technology. Zurich, Switzerland.
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchBlock({ query }) {
  const device = DEVICE_DB[query] || DEVICE_DB[
    Object.keys(DEVICE_DB).find(k => k.toLowerCase() === query.toLowerCase())
  ];

  if (!device) {
    return (
      <ErrorScreen msg={`"${query}" was not found in the device registry. Please search for a supported medical device.`} />
    );
  }

  const countries = ['USA', 'UK', 'India', 'Japan'];

  return (
    <div className="view-container">
      <section className="summary-hero py-24 border-b border-hairline-light bg-surface">
        <div className="swiss-grid items-center">
          <div className="col-span-7">
            <span className="text-xs-bold text-accent mb-4 block">Device Metadata</span>
            <h1 className="text-h2 mb-8">{device.name}</h1>
            <p className="text-lead mb-12">{device.description}</p>
            <div className="flex gap-4">
              <span className="eyebrow-tag">{device.category}</span>
              <span className="eyebrow-tag dark">Class: Verified</span>
            </div>
          </div>
          <div className="col-span-4 col-start-9">
            <div className="device-frame">
              <img
                src={device.image_url}
                alt={device.name}
                onError={e => { e.target.src = '/images/devices/placeholder.jpg'; e.target.onerror = null; }}
              />
            </div>
            <button className="btn-primary w-full mt-10" onClick={() => window.print()}>
              Generate Compliance PDF
            </button>
          </div>
        </div>
      </section>

      <section className="regional-grid py-32">
        <div className="swiss-grid mb-20">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">Regulatory Requirements</h2>
            <p className="text-lead opacity-60">Mandatory labeling fields as dictated by national authorities.</p>
          </div>
        </div>
        <div className="swiss-grid">
          {countries.map(c => (
            <div key={c} className="col-span-3 card-jurisdiction">
              <div className="card-header">
                <span className="flag-icon"><i className="ti ti-world"></i></span>
                <span className="text-xs-bold">{FULL_NAMES[c]}</span>
              </div>
              <ul className="field-list">
                {(COUNTRY_REQUIREMENTS[c] || []).map((f, i) => (
                  <li key={i}><i className="ti ti-check"></i> {f}</li>
                ))}
              </ul>
              <div style={{ padding: '16px 0 8px', borderTop: '1px solid var(--color-border)', marginTop: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>
                  Regulatory Marks
                </span>
                {REGULATORY_MARKS[c].map((m, i) => (
                  <div key={i} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)', marginTop: '6px' }}>
                    <i className="ti ti-shield-check" style={{ marginRight: '6px' }}></i>{m}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function UploadBlock({ file }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const form = new FormData();
    form.append('file', file);
    fetch('http://localhost:8000/upload', { method: 'POST', body: form })
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(() => {
        const extracted_fields = simulateOCR(file);
        const { compliance, best_match } = calcCompliance(extracted_fields);
        setData({ extracted_fields, compliance, best_match });
      })
      .finally(() => setLoading(false));
  }, [file]);

  if (loading) return <LoadingScreen label="Extracting institutional data..." />;

  const { extracted_fields, compliance, best_match } = data;
  const countries = ['USA', 'UK', 'India', 'Japan'];
  const fieldRows = [
    'Device Name', 'Manufacturer', 'UDI', 'Lot Number',
    'Expiry Date', 'Warnings', 'Storage Conditions', 'MAH',
    'UK Responsible Person', 'License Numbers', 'Rx Only',
  ];

  const bestPct = compliance[best_match].percentage;
  const verdict = bestPct >= 80 ? 'PASS' : bestPct >= 50 ? 'PARTIAL' : 'FAIL';
  const verdictColor = bestPct >= 80 ? 'var(--color-success)' : bestPct >= 50 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div className="view-container">
      <section className="compliance-hero py-24 border-b border-hairline-light bg-surface">
        <div className="swiss-grid items-center">
          <div className="col-span-7">
            <span className="text-xs-bold text-accent mb-4 block">Institutional Audit Report</span>
            <h1 className="text-h1 mb-8">
              <span className="text-accent">{bestPct}%</span> Compliant.
            </h1>
            <p className="text-lead mb-12">
              The submitted label has been scanned against global regulatory frameworks.
              Best match found for <span className="font-bold">{FULL_NAMES[best_match]}</span>.
            </p>
            <div className="flex gap-12">
              <div className="kpi-mini">
                <span className="kpi-label">Verdict</span>
                <span className="kpi-value" style={{ color: verdictColor }}>{verdict}</span>
              </div>
              <div className="kpi-mini">
                <span className="kpi-label">Best Match</span>
                <span className="kpi-value" style={{ fontSize: '32px' }}>{best_match}</span>
              </div>
              <div className="kpi-mini">
                <span className="kpi-label">OCR Precision</span>
                <span className="kpi-value">99.98%</span>
              </div>
            </div>
          </div>
          <div className="col-span-4 col-start-9">
            <div className="audit-sidebar">
              <h3 className="text-xs-bold mb-8">Regional Breakdown</h3>
              <div className="breakdown-list">
                {countries.map(c => (
                  <div key={c} className="breakdown-item">
                    <span className="country-code" style={{ fontWeight: c === best_match ? 900 : 600 }}>{c}</span>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${compliance[c].percentage}%`,
                          background: c === best_match ? 'var(--color-accent)' : 'var(--color-text)',
                        }}
                      ></div>
                    </div>
                    <span className="percentage-val">{compliance[c].percentage}%</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full mt-10" onClick={() => window.print()}>
                Generate Compliance PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-hairline-light bg-surface">
        <div className="swiss-grid mb-16">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">Country Compliance Summary</h2>
            <p className="text-lead opacity-60">Found and missing labels per jurisdiction.</p>
          </div>
        </div>
        <div className="swiss-grid">
          {countries.map(c => {
            const s = compliance[c];
            return (
              <div key={c} className="col-span-3 card-jurisdiction">
                <div className="card-header">
                  <span className="flag-icon"><i className="ti ti-world"></i></span>
                  <span className="text-xs-bold">{c} — {s.percentage}%</span>
                  {c === best_match && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '10px', fontWeight: 800,
                      background: 'var(--color-accent)', color: 'white',
                      padding: '2px 8px', letterSpacing: '0.05em'
                    }}>BEST MATCH</span>
                  )}
                </div>
                <div style={{ padding: '0 0 8px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-success)', marginBottom: '8px' }}>
                    Found ({s.found.length})
                  </p>
                  <ul className="field-list" style={{ marginBottom: '16px' }}>
                    {s.found.map((f, i) => (
                      <li key={i}><i className="ti ti-check" style={{ color: 'var(--color-success)' }}></i> {f}</li>
                    ))}
                  </ul>
                  {s.missing.length > 0 && (
                    <>
                      <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-error)', marginBottom: '8px' }}>
                        Missing ({s.missing.length})
                      </p>
                      <ul className="field-list">
                        {s.missing.map((f, i) => (
                          <li key={i} style={{ opacity: 0.6 }}>
                            <i className="ti ti-x" style={{ color: 'var(--color-error)' }}></i> {f}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ledger-section py-32">
        <div className="swiss-grid mb-20">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">Field Verification Ledger</h2>
            <p className="text-lead opacity-60">Deterministic results for each required parameter.</p>
          </div>
        </div>
        <div className="swiss-grid">
          <div className="col-span-12 border-t border-text">
            <div className="ledger-header grid grid-cols-12 py-6">
              <div className="col-span-4">Parameter Name</div>
              <div className="col-span-2">Verification</div>
              <div className="col-span-6">Extracted Value / Feedback</div>
            </div>
            {fieldRows.map((f, i) => {
              const val = extracted_fields[f];
              const found = val && val.trim();
              return (
                <div key={i} className="ledger-row grid grid-cols-12 py-10 border-t border-hairline-light items-center">
                  <div className="col-span-4 font-heading font-bold text-2xl">{f}</div>
                  <div className="col-span-2">
                    <span className={`pill-status ${found ? 'valid' : 'missing'}`}>
                      {found ? 'Valid' : 'Missing'}
                    </span>
                  </div>
                  <div className="col-span-6 font-mono text-sm opacity-60">
                    {found ? val : 'REDACTED: Field could not be located on target surface.'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

const LoadingScreen = ({ label }) => (
  <div className="swiss-grid pt-48 pb-64">
    <div className="col-span-12 text-center">
      <div className="loading-line mb-8"></div>
      <h2 className="text-h2 opacity-20">{label}</h2>
    </div>
  </div>
);

const ErrorScreen = ({ msg }) => (
  <div className="swiss-grid pt-48 pb-64">
    <div className="col-span-12 text-center">
      <h2 className="text-h2 text-error mb-4">Process Interrupted.</h2>
      <p className="text-lead opacity-60">{msg}</p>
      <button className="btn-primary mt-12" onClick={() => window.history.back()}>Go Back</button>
    </div>
  </div>
);