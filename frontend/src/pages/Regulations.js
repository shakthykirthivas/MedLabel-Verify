import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Regulations.css';

const REGULATIONS = [
  {
    country: 'USA',
    authority: 'FDA',
    fullName: 'Food and Drug Administration',
    framework: '21 CFR Part 801 / UDI Rule',
    summary: "The FDA requires medical device labels to carry a Unique Device Identifier (UDI), manufacturer details, and clear warnings. Class II and III devices face stricter labeling under 510(k) and PMA pathways.",
    requiredFields: [
      { name: 'Device Name', note: 'Must match 510(k)/PMA submission exactly.' },
      { name: 'UDI', note: 'Device Identifier (DI) + Production Identifier (PI).' },
      { name: 'Manufacturer', note: 'Name and place of business of manufacturer or distributor.' },
      { name: 'Warnings', note: 'Specific federal law restriction statements.' },
      { name: 'Expiry Date', note: 'Required where shelf-life is a critical factor.' },
      { name: 'Lot Number', note: 'Batch or serial number for traceability.' },
      { name: 'Rx Only', note: 'Prescription only statement as per 21 CFR 801.109.' },
      { name: 'FDA-compliant labeling', note: 'Compliance with 21 CFR 801 labeling requirements.' },
    ],
    optionalFields: [
      { name: 'Storage Conditions', note: 'Temperature and humidity storage guidelines.' },
      { name: 'Sterility Indicator', note: 'Required for sterile devices; optional for non-sterile.' },
      { name: 'Country of Origin', note: 'Optional but recommended for import/export.' },
    ],
    regulatoryMarks: ['UDI', 'Rx Only'],
    warnings: [
      'Federal law restricts this device to sale by or on the order of a physician.',
      'Single use only — do not reuse, reprocess, or re-sterilize.',
      'Read all instructions and warnings before use.',
    ],
    countrySpecific: [
      'GUDID (Global Unique Device Identification Database) submission required.',
      '510(k) clearance or PMA approval must be referenced on label.',
      'English labeling required; foreign-language additions are permitted.',
    ],
  },
  {
    country: 'UK',
    authority: 'MHRA',
    fullName: 'Medicines and Healthcare products Regulatory Agency',
    framework: 'UK MDR 2002 / UKCA Marking',
    summary: "Post-Brexit, the UK follows its own MDR 2002 framework. Devices must carry a UKCA mark and list a UK Responsible Person for manufacturers based outside Great Britain.",
    requiredFields: [
      { name: 'Device Name', note: 'Common or trade name.' },
      { name: 'Manufacturer', note: 'Full name and registered business address.' },
      { name: 'UKCA marking', note: 'Required for devices marketed in Great Britain.' },
      { name: 'UK Responsible Person', note: 'UK Responsible Person details for non-UK manufacturers.' },
      { name: 'Expiry Date', note: 'Mandatory for all limited-life devices.' },
      { name: 'UDI', note: 'UDI required per UK MDR Schedule 1.' },
      { name: 'Lot Number', note: 'Batch number for traceability.' },
      { name: 'Warnings', note: 'Hazard and precautionary statements in English.' },
    ],
    optionalFields: [
      { name: 'CE Marking', note: 'CE marking accepted for Northern Ireland only (NI Protocol).' },
      { name: 'Storage Conditions', note: 'Recommended for temperature-sensitive devices.' },
      { name: 'Sterility Type', note: 'EO, radiation, or steam sterilisation method.' },
    ],
    regulatoryMarks: ['UKCA', 'UK Responsible Person (UKRP)'],
    warnings: [
      'For use under the supervision of a qualified healthcare professional.',
      'Keep out of reach of children.',
      'Consult Instructions for Use (IFU) before operating.',
    ],
    countrySpecific: [
      'UKCA mark mandatory for Great Britain market (England, Scotland, Wales).',
      'UK Responsible Person must be based in the United Kingdom.',
      'MHRA registration required via the online portal before placing on market.',
    ],
  },
  {
    country: 'India',
    authority: 'CDSCO',
    fullName: 'Central Drugs Standard Control Organisation',
    framework: 'MDR 2017 / Medical Devices Rules',
    summary: "India's Medical Devices Rules 2017 mandate registration with CDSCO. Labels must include storage conditions, manufacturing license numbers, and local importer details.",
    requiredFields: [
      { name: 'Device Name', note: 'As per CDSCO registration certificate.' },
      { name: 'Manufacturer', note: 'Name, address, and country of origin.' },
      { name: 'Manufacturing License No.', note: 'Manufacturing License issued by CDSCO.' },
      { name: 'Import License No.', note: 'Import License number for imported devices.' },
      { name: 'Lot Number', note: 'Batch or Serial number for traceability.' },
      { name: 'Storage Conditions', note: 'Specific temperature and humidity conditions.' },
      { name: 'Expiry Date', note: 'Mandatory — format DD/MM/YYYY.' },
      { name: 'Warnings', note: 'Hazard warnings in English and Hindi (for retail devices).' },
    ],
    optionalFields: [
      { name: 'UDI', note: 'Encouraged under India UDI roadmap; mandatory from 2026.' },
      { name: 'Net Quantity', note: 'Number of units or volume per package.' },
      { name: 'Importer Details', note: 'Indian importer name and address (for imported devices).' },
    ],
    regulatoryMarks: ['Manufacturing License No.', 'Import License No.', 'CDSCO Registration'],
    warnings: [
      'To be sold by retail on the prescription of a Registered Medical Practitioner only.',
      'Store in a cool and dry place.',
      'Keep away from direct sunlight.',
    ],
    countrySpecific: [
      'CDSCO registration mandatory under Medical Devices Rules 2017.',
      'Labeling must comply with Schedule II of MDR 2017.',
      'Hindi labeling required for devices sold at retail level.',
    ],
  },
  {
    country: 'Japan',
    authority: 'PMDA',
    fullName: 'Pharmaceuticals and Medical Devices Agency',
    framework: 'PMDEA / Notification 169',
    summary: "Japan requires a Marketing Authorization Holder (MAH) to be a Japan-registered entity. All clinical safety labels must be provided in Japanese for local healthcare use.",
    requiredFields: [
      { name: 'Device Name', note: 'Must include Japanese trade name.' },
      { name: 'MAH', note: 'Japan-registered Marketing Authorization Holder.' },
      { name: 'UDI', note: 'GS1-standard barcode as per PMDA traceability rule.' },
      { name: 'Japanese-language label', note: 'Instructions and warnings in Japanese language.' },
      { name: 'Lot Number', note: 'Traceability number (ロット番号).' },
      { name: 'Expiry Date', note: 'Format: YYYY年MM月DD日.' },
      { name: 'Manufacturer', note: 'Name of foreign manufacturer and Japanese MAH.' },
      { name: 'Warnings', note: 'Safety warnings in Japanese (警告事項).' },
    ],
    optionalFields: [
      { name: 'Storage Conditions', note: 'Storage temperature in Celsius; humidity conditions.' },
      { name: 'Country of Origin', note: 'Recommended for imported devices.' },
      { name: 'Sterility Statement', note: 'Required for sterile devices; optional otherwise.' },
    ],
    regulatoryMarks: ['MAH', 'Japanese Labeling'],
    warnings: [
      '本製品は医療専門家の監督下でのみ使用してください。 (Use only under medical professional supervision.)',
      '再使用禁止。 (Single use only — do not reuse.)',
      '添付の使用説明書を必ずお読みください。 (Read the attached Instructions for Use.)',
    ],
    countrySpecific: [
      'MAH must hold PMDA license and be registered in Japan.',
      'All labeling, IFU, and packaging must be in Japanese language.',
      'Shonin (承認) or Ninsho (認証) approval number must be displayed.',
    ],
  },
];

// ── Comparison matrix data ───────────────────────────────────────────────────
const MATRIX_ROWS = [
  ['Unique Device ID (UDI)', true, true, false, true],
  ['Manufacturer Details', true, true, true, true],
  ['Batch / Lot Coding', true, true, true, true],
  ['Shelf Life / Expiry', true, true, true, true],
  ['Storage Constraints', false, false, true, false],
  ['Regional Language', false, false, true, true],
  ['Country-specific Mark', true, true, true, true],
  ['Prescription Statement', true, false, true, false],
];

export default function Regulations() {
  const navigate = useNavigate();
  const [active, setActive] = useState('USA');
  const reg = REGULATIONS.find(r => r.country === active);
  const routerLocation = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const { country, scrollTo } = routerLocation.state || {};
    if (country) setActive(country);
    if (scrollTo) {
      // Wait for the page to fully paint before scrolling
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }, [routerLocation.state]);

  return (
    <div className="reg-site">
      <div className="utility-bar">
        Regulatory Standards Index v8.4 &middot; Institutional Reference
      </div>

      <Navbar />

      <header className="reg-hero py-24 border-b border-hairline-light bg-surface">
        <div className="swiss-grid">
          <div className="col-span-8">
            <span className="text-xs-bold text-accent mb-4 block">Regulatory Reference Library</span>
            <h1 className="text-h1 mb-8">Medical Device Label Standards.</h1>
            <p className="text-lead opacity-70 max-w-2xl">
              Deterministic labeling requirements across 4 global jurisdictions.
              Our rulesets are synchronized with FDA, MHRA, CDSCO, and PMDA databases.
            </p>
          </div>
        </div>
      </header>

      {/* Country Tabs */}
      <section id="country-tabs" className="reg-selection py-20 border-b border-hairline-light">
        <div className="swiss-grid">
          <div className="col-span-12">
            <div className="country-tabs">
              {REGULATIONS.map(r => (
                <button
                  key={r.country}
                  className={`tab-item ${active === r.country ? 'active' : ''}`}
                  onClick={() => setActive(r.country)}
                >
                  <span className="text-xs-bold block mb-2">{r.country}</span>
                  <span className="tab-auth">{r.authority}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section id="reg-details" className="reg-details section-padding">
        <div className="swiss-grid mb-24">
          <div className="col-span-4">
            <span className="text-xs-bold text-accent mb-2 block">Authority Metadata</span>
            <h2 className="text-h2 mb-6">{reg.authority}</h2>
            <p className="font-mono text-xs opacity-50 mb-10 uppercase tracking-widest">{reg.fullName}</p>
            <div className="framework-box p-6 border-2 border-text mb-8">
              <span className="text-xs-bold">Active Framework</span>
              <p className="text-lg font-bold mt-2">{reg.framework}</p>
            </div>

            {/* Regulatory Marks */}
            <div className="framework-box p-6 border border-text mb-8">
              <span className="text-xs-bold mb-4 block">Regulatory Marks</span>
              {reg.regulatoryMarks.map((m, i) => (
                <div key={i} style={{
                  display: 'inline-block', margin: '4px 4px 4px 0',
                  padding: '4px 12px', border: '1px solid var(--color-accent)',
                  fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)',
                }}>
                  {m}
                </div>
              ))}
            </div>

            {/* Warnings */}
            <div className="framework-box p-6 border border-text">
              <span className="text-xs-bold mb-4 block">Standard Warnings</span>
              {reg.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: '12px', opacity: 0.65, lineHeight: 1.6, marginBottom: '8px' }}>
                  ⚠ {w}
                </p>
              ))}
            </div>
          </div>

          <div className="col-span-7 col-start-6">
            <h3 className="text-h3 mb-6">Legislative Summary</h3>
            <p className="text-lead mb-12 leading-relaxed">{reg.summary}</p>

            {/* Country-specific requirements */}
            <div style={{ marginBottom: '40px', padding: '24px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <span className="text-xs-bold mb-4 block text-accent">Country-Specific Requirements</span>
              {reg.countrySpecific.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '14px', lineHeight: 1.6 }}>
                  <i className="ti ti-arrow-right" style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }}></i>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            {/* Required fields */}
            <h4 className="text-xs-bold mb-6 block">Required Label Fields</h4>
            <div className="ledger-wrap border-t border-text">
              {reg.requiredFields.map((f, i) => (
                <div key={i} className="ledger-entry grid grid-cols-12 py-8 border-b border-hairline-light">
                  <div className="col-span-4">
                    <span className="text-xs-bold text-accent mb-1 block">Required</span>
                    <span className="text-xl font-bold">{f.name}</span>
                  </div>
                  <div className="col-span-8">
                    <span className="text-xs-bold opacity-30 mb-1 block">Verification Logic</span>
                    <p className="text-sm font-medium opacity-60 leading-relaxed">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional fields */}
            <h4 className="text-xs-bold mb-6 block" style={{ marginTop: '40px' }}>Optional Label Fields</h4>
            <div className="ledger-wrap border-t border-text">
              {reg.optionalFields.map((f, i) => (
                <div key={i} className="ledger-entry grid grid-cols-12 py-8 border-b border-hairline-light">
                  <div className="col-span-4">
                    <span className="text-xs-bold opacity-40 mb-1 block">Optional</span>
                    <span className="text-xl font-bold">{f.name}</span>
                  </div>
                  <div className="col-span-8">
                    <span className="text-xs-bold opacity-30 mb-1 block">Notes</span>
                    <p className="text-sm font-medium opacity-60 leading-relaxed">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Jurisdiction Matrix */}
      <section className="reg-matrix py-32" style={{ backgroundColor: '#F0F2F4', color: 'var(--color-text)' }}>
        <div className="swiss-grid mb-20">
          <div className="col-span-6">
            <h2 className="text-h2 mb-6">Cross-Jurisdiction Matrix</h2>
            <p className="text-lead opacity-60">Global alignment of mandatory labeling fields across 4 national frameworks.</p>
          </div>
        </div>
        <div className="swiss-grid mb-20">
          <div className="col-span-12 overflow-x-auto">
            <table className="matrix-ledger w-full border-collapse">
              <thead>
                <tr className="border-b border-text/20">
                  <th className="py-6 text-left text-xs-bold opacity-30">Parameter Name</th>
                  <th className="py-6 text-center text-xs-bold">USA</th>
                  <th className="py-6 text-center text-xs-bold">UK</th>
                  <th className="py-6 text-center text-xs-bold">INDIA</th>
                  <th className="py-6 text-center text-xs-bold">JAPAN</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map(([f, ...vals], i) => (
                  <tr key={i} className="border-b border-hairline-light hover:bg-white transition-all">
                    <td className="py-6 font-bold">{f}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="py-6 text-center text-2xl">
                        {v ? <i className="ti ti-check text-accent"></i> : <i className="ti ti-minus opacity-20"></i>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Comparison Summary Table */}
        <div className="swiss-grid">
          <div className="col-span-12">
            <h3 className="text-xs-bold mb-10" style={{ color: 'rgba(42,52,57,0.4)' }}>Authority Comparison Summary</h3>
            <table className="matrix-ledger w-full border-collapse">
              <thead>
                <tr className="border-b border-hairline-light">
                  <th className="py-6 text-left text-xs-bold opacity-30">Country</th>
                  <th className="py-6 text-left text-xs-bold opacity-30">Regulatory Mark</th>
                  <th className="py-6 text-left text-xs-bold opacity-30">Unique Requirement</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['USA', 'UDI, Rx Only', 'FDA 510(k)/PMA clearance reference required'],
                  ['UK', 'UKCA, UKRP', 'UK Responsible Person mandatory for non-UK manufacturers'],
                  ['India', 'License Numbers, CDSCO', 'Hindi labeling required for retail; CDSCO registration mandatory'],
                  ['Japan', 'MAH', 'Full Japanese-language labeling and PMDA MAH license required'],
                ].map(([country, mark, req], i) => (
                  <tr key={i} className="border-b border-hairline-light hover:bg-white transition-all">
                    <td className="py-6 font-bold">{country}</td>
                    <td className="py-6" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{mark}</td>
                    <td className="py-6 opacity-60 text-sm">{req}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
            &copy; 2026 MedLabel Verify INC. Precision compliance technology.
          </div>
        </div>
      </footer>
    </div>
  );
}