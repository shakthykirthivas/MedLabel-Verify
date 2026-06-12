import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import './Regulations.css';

const REGULATIONS = [
    {
        country: 'USA',
        flag: 'USA',
        authority: 'FDA',
        fullName: 'Food and Drug Administration',
        color: '#0066cc',
        badge: 'FDA — USA',
        framework: '21 CFR Part 801 / UDI Rule',
        summary: 'The FDA requires medical device labels to carry a Unique Device Identifier (UDI), manufacturer details, and clear warnings. Class II and III devices face stricter labeling under 510(k) and PMA pathways.',
        countryNote: 'FDA labeling requirements may vary depending on device classification, intended use, and regulatory pathway (510(k), De Novo, or PMA).',
        fields: [
            { name: 'Device Name', required: true, note: 'Must match 510(k)/PMA submission' },
            { name: 'UDI', required: true, note: 'Device Identifier (DI) + Production Identifier (PI), where PI may include lot number, serial number, expiry date, or manufacturing date.' },
            { name: 'Manufacturer', required: true, note: 'Name and place of business of manufacturer, packer, or distributor.' },
            { name: 'Warnings', required: true, note: 'Federal law restriction statement' },
            { name: 'Expiry Date', required: true, note: 'If applicable' },
            { name: 'Lot Number', required: false, note: 'Include when used as part of device traceability and UDI production identifier.' },
            { name: 'Rx Only', required: false, note: 'Required for prescription devices' },
            { name: 'Sterile Symbol', required: false, note: 'ISO 15223-1 symbol if sterile' },
        ],
        links: [
            { label: 'FDA UDI Rule', url: 'https://www.fda.gov/medical-devices/unique-device-identification-system-udi-system' },
            { label: '21 CFR Part 801', url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801' },
        ],
    },
    {
        country: 'UK',
        flag: 'UK',
        authority: 'MHRA',
        fullName: 'Medicines and Healthcare products Regulatory Agency',
        color: '#c0392b',
        badge: 'MHRA — UK',
        framework: 'UK MDR 2002 / UKCA Marking',
        summary: 'Post-Brexit, the UK follows its own MDR 2002 framework. Devices must carry a UKCA mark and list a UK Responsible Person. Great Britain and Northern Ireland have different requirements.',
        countryNote: 'Great Britain and Northern Ireland may have different medical device labeling requirements.',
        fields: [
            { name: 'Device Name', required: true, note: 'Common or trade name' },
            { name: 'Manufacturer', required: true, note: 'Full name and address' },
            { name: 'UKCA Marking', required: true, note: 'Required for GB market' },
            { name: 'Expiry Date', required: true, note: 'If applicable' },
            { name: 'UDI', required: false, note: 'UK UDI requirements are being implemented through phased regulatory reforms.' },
            { name: 'UK Responsible Person', required: false, note: 'Required for manufacturers located outside the UK.' },
            { name: 'Warnings', required: false, note: 'Device-class dependent' },
            { name: 'EC REP', required: false, note: 'May be required for certain CE-marked devices marketed in Northern Ireland.' },
        ],
        links: [
            { label: 'MHRA Guidance', url: 'https://www.gov.uk/guidance/medical-devices-uk-approved-bodies-and-the-ukca-mark' },
            { label: 'UK MDR 2002', url: 'https://www.legislation.gov.uk/uksi/2002/618/contents' },
        ],
    },
    {
        country: 'India',
        flag: 'IND',
        authority: 'CDSCO',
        fullName: 'Central Drugs Standard Control Organisation',
        color: '#e67e22',
        badge: 'CDSCO — India',
        framework: 'MDR 2017 / Medical Devices Rules',
        summary: "India's Medical Devices Rules 2017 mandate registration with CDSCO. Import and manufacturing licenses are required, and labels must include storage conditions and local importer details.",
        countryNote: 'Requirements may vary based on device classification and whether the device is domestically manufactured or imported.',
        fields: [
            { name: 'Device Name', required: true, note: 'As per CDSCO registration' },
            { name: 'Manufacturer', required: true, note: 'Include manufacturer name and country of origin.' },
            { name: 'Lot Number', required: true, note: 'Batch number mandatory' },
            { name: 'Expiry Date', required: true, note: 'Month and year format' },
            { name: 'Storage Conditions', required: true, note: 'Temperature and humidity range' },
            { name: 'License Numbers', required: true, note: 'Manufacturing License or Import License number as applicable.' },
            { name: 'Importer Details', required: false, note: 'Required only for imported medical devices.' },
            { name: 'UDI', required: false, note: 'Implementation is being introduced in phases for medical devices.' },
        ],
        links: [
            { label: 'CDSCO Portal', url: 'https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/' },
            { label: 'MDR 2017', url: 'https://cdsco.gov.in/opencms/opencms/en/Medical-Device-Diagnostics/Medical-Device-Rules-2017/' },
        ],
    },
    {
        country: 'Japan',
        flag: 'JPN',
        authority: 'PMDA',
        fullName: 'Pharmaceuticals and Medical Devices Agency',
        color: '#8e44ad',
        badge: 'PMDA — Japan',
        framework: 'PMDEA / Notification 169',
        summary: 'Japan requires a Marketing Authorization Holder (MAH) to be a Japan-registered entity. Labels must be in Japanese. The PMDA oversees approval and post-market surveillance under the PMDEA law.',
        countryNote: 'Labeling requirements may differ depending on device risk classification and approval category.',
        fields: [
            { name: 'Device Name', required: true, note: 'Japanese and English name' },
            { name: 'MAH (Marketing Authorization Holder)', required: true, note: 'Must be a Japan-registered Marketing Authorization Holder.' },
            { name: 'UDI', required: true, note: 'Device identification should comply with Japanese traceability requirements, commonly using GS1 standards.' },
            { name: 'Lot Number', required: true, note: 'ロット番号 on label' },
            { name: 'Expiry Date', required: true, note: 'Japanese date format' },
            { name: 'Japanese Label', required: true, note: 'Product information must be available in Japanese.' },
            { name: 'Manufacturer', required: false, note: 'If different from MAH' },
            { name: 'Storage Conditions', required: false, note: 'Recommended for sensitive devices' },
        ],
        links: [
            { label: 'PMDA Official', url: 'https://www.pmda.go.jp/english/index.html' },
            { label: 'PMDEA Overview', url: 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html' },
        ],
    },
];

const GLOBAL_DISCLAIMER = 'Regulatory Disclaimer: Labeling requirements shown here are a simplified overview. Actual requirements may vary based on device classification, intended use, sterility, implantability, prescription status, and local regulatory updates.';

export default function Regulations() {
    const navigate = useNavigate();
    const [active, setActive] = useState('USA');
    const reg = REGULATIONS.find(r => r.country === active);

    const requiredFields = reg.fields.filter(f => f.required);
    const optionalFields = reg.fields.filter(f => !f.required);

    return (
        <div className="home-wrapper">

            {/* Alert Bar */}
            <div className="home-alert-bar">
                🏥 Regulatory compliance checker for medical device labels — India · USA · UK · Japan
            </div>

            {/* Header */}
            <header className="home-header">
                <div className="home-logo">
                    <div className="home-logo-cross">✚</div>
                    <div className="home-logo-text-block">
                        <span className="home-logo-title">MedLabel Verify</span>
                        <span className="home-logo-subtitle">Device Label Compliance</span>
                    </div>
                </div>
                <nav className="home-nav">
                    <span className="home-nav-item" onClick={() => navigate('/')}>Home</span>
                    <span className="home-nav-item active">Regulations</span>
                    <span className="home-nav-item" onClick={() => navigate('/help')}>Help</span>
                </nav>
            </header>

            {/* Hero */}
            <section className="home-hero-banner reg-hero">
                <div className="home-hero-left">
                    <div className="home-hero-tag">
                        <span className="home-hero-tag-dot" />
                        Global Regulatory Reference
                    </div>
                    <h1 className="home-hero-title">
                        Medical Device<br />
                        <span className="home-hero-highlight">Label Regulations</span>
                    </h1>
                    <p className="home-hero-desc">
                        Explore the official labeling requirements for medical devices across
                        <strong> 4 regulatory frameworks</strong> — FDA (USA), MHRA (UK), CDSCO (India), and PMDA (Japan).
                    </p>
                    <div className="home-hero-countries">
                        {REGULATIONS.map(r => (
                            <div key={r.country} className="home-country-badge">{r.badge}</div>
                        ))}
                    </div>
                </div>
                <div className="home-hero-right">
                    <div className="home-hero-card">
                        <div className="home-hero-card-header">📜 Quick Reference</div>
                        {REGULATIONS.map(r => (
                            <div key={r.country} className="home-hero-card-row">
                                <span>{r.country}</span>
                                <span style={{ color: r.color, fontWeight: 700, fontSize: '0.78rem' }}>{r.authority}</span>
                            </div>
                        ))}
                        <div className="home-hero-card-footer">Click a country to explore</div>
                    </div>
                </div>
            </section>

            {/* Country Tabs */}
            <section className="home-search-section reg-tabs-section">
                <h2 className="home-section-title">🌍 Select a Regulatory Authority</h2>
                <div className="reg-tabs">
                    {REGULATIONS.map(r => (
                        <button
                            key={r.country}
                            className={`reg-tab ${active === r.country ? 'reg-tab-active' : ''}`}
                            style={active === r.country ? { borderColor: r.color, color: r.color, background: r.color + '15' } : {}}
                            onClick={() => setActive(r.country)}
                        >

                            <span className="reg-tab-label">{r.country}</span>
                            <span className="reg-tab-auth">{r.authority}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Regulation Detail */}
            <section className="home-upload-section reg-detail-section">

                {/* Header */}
                <div className="reg-detail-header">

                    <div>
                        <div className="reg-detail-auth" style={{ color: reg.color }}>{reg.authority} — {reg.country}</div>
                        <div className="reg-detail-fullname">{reg.fullName}</div>
                        <div className="reg-detail-framework">📄 {reg.framework}</div>
                    </div>
                </div>

                <p className="reg-summary">{reg.summary}</p>

                {/* Required Fields */}
                <h3 className="reg-fields-heading">Required Label Fields</h3>
                <div className="reg-fields-grid">
                    {requiredFields.map(f => (
                        <div key={f.name} className="reg-field-card reg-field-required">
                            <div className="reg-field-top">
                                <span className="reg-field-status">✅ Required</span>
                            </div>
                            <div className="reg-field-name">{f.name}</div>
                            <div className="reg-field-note">{f.note}</div>
                        </div>
                    ))}
                </div>

                {/* Optional Fields */}
                {optionalFields.length > 0 && (
                    <>
                        <h3 className="reg-fields-heading">Optional Label Fields</h3>
                        <div className="reg-fields-grid">
                            {optionalFields.map(f => (
                                <div key={f.name} className="reg-field-card reg-field-optional">
                                    <div className="reg-field-top">
                                        <span className="reg-field-status">⚪ Optional</span>
                                    </div>
                                    <div className="reg-field-name">{f.name}</div>
                                    <div className="reg-field-note">{f.note}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Country-specific note */}
                <div className="reg-country-note">
                    <span className="reg-country-note-icon">📝</span>
                    <p>{reg.countryNote}</p>
                </div>

                {/* Official Links */}
                <div className="reg-links-row">
                    <span className="reg-links-label">📎 Official Resources:</span>
                    {reg.links.map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noreferrer" className="reg-link">
                            {l.label} ↗
                        </a>
                    ))}
                </div>
            </section>

            {/* Comparison Table */}
            <section className="home-steps-section reg-compare-section">
                <h2 className="home-section-title">📊 Side-by-Side Comparison</h2>
                <p className="home-section-desc">Key differences across all four regulatory frameworks</p>
                <div className="reg-table-wrap">
                    <table className="reg-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>USA</th>
                                <th>UK</th>
                                <th>India</th>
                                <th>Japan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Device Name', '✅', '✅', '✅', '✅'],
                                ['UDI', '✅', '⚪', '⚪', '✅'],
                                ['Manufacturer', '✅', '✅', '✅', '⚪'],
                                ['Lot Number', '⚪', '⚪', '✅', '✅'],
                                ['Expiry Date', '✅', '✅', '✅', '✅'],
                                ['Warnings', '✅', '⚪', '⚪', '⚪'],
                                ['Storage Conditions', '⚪', '⚪', '✅', '⚪'],
                                ['MAH / Auth Holder', '⚪', 'UK Rep', '⚪', '✅'],
                                ['License Numbers', '⚪', '⚪', '✅', '⚪'],
                                ['UKCA / CE Marking', '⚪', '✅', '⚪', '⚪'],
                                ['Japanese Label', '⚪', '⚪', '⚪', '✅'],
                            ].map(([field, ...vals]) => (
                                <tr key={field}>
                                    <td className="reg-table-field">{field}</td>
                                    {vals.map((v, i) => (
                                        <td key={i} className={`reg-table-val ${v === '✅' ? 'reg-yes' : v === '⚪' ? 'reg-no' : 'reg-special'}`}>{v}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="home-section-desc" style={{ fontSize: '0.78rem' }}>✅ Required &nbsp;⚪ Optional / Not mandated &nbsp; Specific text = special condition</p>
            </section>

            {/* Global Disclaimer */}
            <section className="home-search-section reg-disclaimer-section">
                <div className="reg-global-disclaimer">
                    <span className="reg-disclaimer-icon">⚠️</span>
                    <p>{GLOBAL_DISCLAIMER}</p>
                </div>
            </section>

            {/* CTA */}
            <section className="home-search-section reg-cta-section">
                <h2 className="home-section-title">🔍 Check Your Label Now</h2>
                <p className="home-section-desc">Upload a medical device label to instantly verify compliance against these regulations</p>
                <button className="home-search-btn reg-cta-btn" onClick={() => navigate('/')}>
                    Go to Label Checker →
                </button>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="home-footer-left">
                    <span className="home-footer-logo">✚ MedLabel Verify</span>
                    <span className="home-footer-copy">© 2026 Medical Device Label Compliance Checker</span>
                </div>
                <div className="home-footer-right">
                    <span>CDSCO</span><span>FDA</span><span>MHRA</span><span>PMDA</span>
                </div>
            </footer>
        </div>
    );
}