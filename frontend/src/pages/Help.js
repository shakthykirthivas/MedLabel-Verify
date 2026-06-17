import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Help.css';

const FAQS = [
  {
    q: 'What is MedLabel Verify?',
    a: 'MedLabel Verify is a web application for medical device label verification and compliance analysis. It performs OCR-based label scanning, regulatory mark detection, country identification (USA, UK, India, and Japan), and compliance analysis based on country-specific labeling requirements.',
  },
  {
    q: 'How does OCR work?',
    a: 'OCR (Optical Character Recognition) extracts text from uploaded medical device label images or PDFs. The system processes the image, identifies text regions, and parses fields such as Device Name, UDI, Lot Number, Expiry Date, and more.',
  },
  {
    q: 'What image formats are supported?',
    a: 'You can upload JPG, JPEG, PNG, and PDF files. For best results, use a clear, well-lit, high-resolution image with the label text fully visible and in focus.',
  },
  {
    q: 'What does compliance percentage mean?',
    a: 'The compliance percentage indicates how many of the required labeling fields for a given country are present on the scanned label. It is calculated as: (Number of detected required labels ÷ Total required labels) × 100.',
  },
  {
    q: 'What is a Best Match country?',
    a: 'The Best Match country is the country whose regulatory requirements are most closely satisfied by the detected label fields. It is the country with the highest compliance percentage among USA, UK, India, and Japan.',
  },
  {
    q: 'What is a UDI?',
    a: 'UDI stands for Unique Device Identifier. It is a code that uniquely identifies a medical device and consists of a Device Identifier (DI) and a Production Identifier (PI). It is required by FDA (USA) and PMDA (Japan).',
  },
];

const HOW_TO_USE = [
  { step: '01', title: 'Search a Medical Device', desc: 'Enter a device name in the search bar on the Home page and press Enter or click Search. The system will look up the device and display its regulatory requirements.' },
  { step: '02', title: 'Upload a Label Image or PDF', desc: 'Use Camera Scan to photograph a label live, Gallery Upload to select an image from your device, or Document Upload to submit a PDF or image file.' },
  { step: '03', title: 'OCR Extracts Label Information', desc: 'The system uses OCR to automatically extract fields such as Device Name, UDI, Lot Number, Expiry Date, Manufacturer, MAH, Warnings, and more from the uploaded label.' },
  { step: '04', title: 'System Identifies Country', desc: 'Based on the extracted fields, the system compares the label content against regulatory requirements for USA, UK, India, and Japan to identify the best-matching country.' },
  { step: '05', title: 'Compliance Percentage is Calculated', desc: 'For each country, the system calculates: Compliance % = (Detected Required Labels ÷ Total Required Labels) × 100 and displays found and missing labels for each jurisdiction.' },
  { step: '06', title: 'View Missing Labels and Recommendations', desc: 'The Results page shows all found labels, missing labels per country, the compliance percentage, and the best-matching country to help you achieve full regulatory compliance.' },
];

const OCR_TIPS = [
  { icon: '💡', title: 'Use Good Lighting', desc: 'Photograph labels in bright, even lighting. Avoid shadows across the label text as they reduce OCR accuracy significantly.' },
  { icon: '📐', title: 'Keep Camera Straight', desc: 'Hold your camera parallel to the label surface. Angled shots introduce perspective distortion that reduces text recognition accuracy.' },
  { icon: '✂️', title: 'Crop the Label', desc: 'Crop the image to show only the label area before uploading. Removing background noise helps the OCR engine focus on relevant content.' },
  { icon: '🔍', title: 'Use High Resolution', desc: 'Use 300 DPI or higher for scanned documents. Low-resolution images cause small text — such as UDI barcodes and lot numbers — to be missed.' },
  { icon: '📄', title: 'Prefer PDF for Documents', desc: 'For printed or electronic documents, upload as PDF whenever possible. PDF files preserve text fidelity better than photographed images.' },
];

export default function Help() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const { scrollTo } = routerLocation.state || {};
    if (scrollTo) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }, [routerLocation.state]);

  const doSearch = (q) => {
    const term = q.trim().toLowerCase();
    if (!term) { setSearchResults(null); return; }

    const matchedFaqs = FAQS.filter(
      f => f.q.toLowerCase().includes(term) || f.a.toLowerCase().includes(term)
    ).map(f => ({ type: 'FAQ', title: f.q, body: f.a }));

    const matchedSteps = HOW_TO_USE.filter(
      s => s.title.toLowerCase().includes(term) || s.desc.toLowerCase().includes(term)
    ).map(s => ({ type: 'How To', title: s.title, body: s.desc }));

    const matchedTips = OCR_TIPS.filter(
      t => t.title.toLowerCase().includes(term) || t.desc.toLowerCase().includes(term)
    ).map(t => ({ type: 'OCR Tip', title: t.title, body: t.desc }));

    setSearchResults([...matchedFaqs, ...matchedSteps, ...matchedTips]);
  };

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') doSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div className="help-site">
      <div className="utility-bar">
        User Support Infrastructure &middot; Protocol Support v2.1
      </div>

      <Navbar />

      {/* Hero */}
      <header className="help-hero py-32 border-b border-hairline-light bg-surface">
        <div className="swiss-grid">
          <div className="col-span-8">
            <span className="text-xs-bold text-accent mb-4 block">Knowledge Base</span>
            <h1 className="text-h1 mb-8">Institutional<br />Documentation.</h1>
            <div className="search-frame p-1 border border-text flex mt-12 max-w-2xl bg-white">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search documentation — e.g. UDI, OCR precision"
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{ padding: '0 12px', fontSize: '18px', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}
                >✕</button>
              )}
              <button className="btn-primary" onClick={() => doSearch(searchQuery)}>Search</button>
            </div>

            {/* Search Results */}
            {searchResults !== null && (
              <div style={{ marginTop: '24px', maxWidth: '672px' }}>
                {searchResults.length === 0 ? (
                  <div style={{
                    padding: '24px', border: '1px solid var(--color-border)',
                    background: 'white', fontSize: '14px', opacity: 0.6
                  }}>
                    No results found for &ldquo;<strong>{searchQuery}</strong>&rdquo;. Try terms like UDI, OCR, FDA, compliance, or lot number.
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.4, marginBottom: '12px' }}>
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                    </p>
                    {searchResults.map((r, i) => (
                      <div key={i} style={{
                        padding: '20px 24px', marginBottom: '8px',
                        background: 'white', border: '1px solid var(--color-border)',
                        borderLeft: '3px solid var(--color-accent)'
                      }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                          letterSpacing: '0.2em', color: 'var(--color-accent)', display: 'block', marginBottom: '6px'
                        }}>{r.type}</span>
                        <p style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{r.title}</p>
                        <p style={{ fontSize: '13px', opacity: 0.65, lineHeight: 1.6 }}>{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* How to Use */}
      <section id="how-to-use" className="section-padding border-b border-hairline-light">
        <div className="swiss-grid mb-20">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">How to Use MedLabel Verify</h2>
            <p className="text-lead opacity-60">Step-by-step guide to verifying your medical device labels.</p>
          </div>
        </div>
        <div className="swiss-grid" style={{ rowGap: '0' }}>
          <div className="col-span-8 col-start-3">
            <div className="border-t border-text">
              {HOW_TO_USE.map((step, i) => (
                <div key={i} className="border-b border-hairline-light" style={{ padding: '40px 0', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '24px' }}>
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.2em',
                      color: 'var(--color-accent)', display: 'block', marginBottom: '8px'
                    }}>Step</span>
                    <span style={{
                      fontFamily: 'var(--font-heading)', fontWeight: 900,
                      fontSize: '48px', letterSpacing: '-0.04em', color: 'var(--color-text)',
                      opacity: 0.15, lineHeight: 1
                    }}>{step.step}</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '24px', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '16px', lineHeight: 1.7, opacity: 0.65 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* OCR Tips */}
      <section id="ocr-tips" className="tips-section py-32 bg-surface">
        <div className="swiss-grid mb-20">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">OCR Accuracy Tips</h2>
            <p className="text-lead opacity-60">Optimal surface capture protocols for precision extraction.</p>
          </div>
        </div>
        <div className="swiss-grid">
          {OCR_TIPS.map((t, i) => (
            <div key={i} className="col-span-4 protocol-card">
              <span className="protocol-index">0{i + 1} Protocol</span>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{t.icon}</div>
              <h3 className="protocol-title">{t.title}</h3>
              <p className="protocol-desc">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq-section section-padding">
        <div className="swiss-grid mb-24">
          <div className="col-span-12">
            <h2 className="text-h2 mb-4">Frequently Asked Questions</h2>
            <p className="text-lead opacity-60">Deterministic answers to platform inquiries.</p>
          </div>
        </div>
        <div className="swiss-grid">
          <div className="col-span-8 col-start-3">
            <div className="faq-ledger border-t border-text">
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-entry border-b border-hairline-light">
                  <button className="faq-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="faq-q">{faq.q}</span>
                    <i className={`ti ti-chevron-${openFaq === i ? 'up' : 'down'}`}></i>
                  </button>
                  {openFaq === i && (
                    <div className="faq-body pb-10">
                      <p className="faq-a">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section-padding bg-surface border-t border-hairline-light">
        <div className="swiss-grid text-center">
          <div className="col-span-12">
            <h2 className="text-h2 mb-8">Ready to check your label?</h2>
            <p className="text-lead opacity-60 mb-12">Return to the core engine to begin verification.</p>
            <div className="flex justify-center gap-6">
              <button className="btn-primary" onClick={() => navigate('/')}>Go to Checker</button>
              <button className="btn-accent" onClick={() => navigate('/regulations')}>View Standards</button>
            </div>
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