import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import './Help.css'; // create this file in src/pages/

const FAQS = [
  {
    q: 'What is MedLabel Verify?',
    a: 'MedLabel Verify is a regulatory compliance tool that checks medical device labels against official requirements from 4 countries — USA (FDA), UK (MHRA), India (CDSCO), and Japan (PMDA). You can search a device by name or upload a label image for instant OCR-based analysis.',
  },
  {
    q: 'How does the label scan work?',
    a: 'When you upload or photograph a label, the system uses OCR (Optical Character Recognition) powered by Tesseract to extract text from the image. It then runs regex-based field parsing to identify fields like Device Name, UDI, Lot Number, Expiry Date, and more.',
  },
  {
    q: 'What image formats are supported?',
    a: 'You can upload JPG, PNG, and WEBP image files. PDF documents are also supported. For best results, use a clear, well-lit photo with the label text in focus. Avoid blurry, skewed, or low-contrast images.',
  },
  {
    q: 'What does the compliance percentage mean?',
    a: 'The compliance percentage shows how many of a country\'s required label fields were found on your label. 100% means all mandatory fields were detected. Lower percentages indicate missing fields that may cause regulatory issues.',
  },
  {
    q: 'What is a "Best Match" country?',
    a: 'The Best Match is the country whose regulatory requirements are most satisfied by the scanned label. It is determined by whichever country has the highest compliance percentage based on the fields found.',
  },
  {
    q: 'What is a UDI?',
    a: 'UDI stands for Unique Device Identifier. It is a code that uniquely identifies a medical device. It consists of a Device Identifier (DI) and a Production Identifier (PI). UDI is mandatory in the USA, UK, and Japan, and is being phased in for India.',
  },
  {
    q: 'Why are some fields shown as "Not Found"?',
    a: 'Fields may not be found if the label image is unclear, the text is not in a standard format, or the field genuinely doesn\'t exist on the label. Try the /debug-ocr endpoint to see the raw text extracted from your label and verify OCR quality.',
  },
  {
    q: 'How accurate is the OCR?',
    a: 'OCR accuracy depends on image quality. Printed labels with clear, high-contrast text in standard fonts achieve the best results. Handwritten labels, embossed text, or heavily styled fonts may produce lower accuracy. Using 300 DPI or higher images is recommended.',
  },
  {
    q: 'Can I check devices not in the search list?',
    a: 'The search feature covers 15 pre-loaded device types. If your device isn\'t listed, use the upload/scan feature instead — it extracts and scores fields directly from the label image regardless of device type.',
  },
  {
    q: 'Is my uploaded data stored?',
    a: 'No. Uploaded files are processed in memory and are not saved to disk or any database. The system only retains the extracted text fields for the duration of the request.',
  },
];

const TIPS = [
  {
    icon: '💡',
    title: 'Use good lighting',
    desc: 'Photograph labels in bright, even lighting. Avoid shadows across the label text.',
  },
  {
    icon: '📐',
    title: 'Keep the camera straight',
    desc: 'Hold your camera parallel to the label. Angled shots reduce OCR accuracy significantly.',
  },
  {
    icon: '🔍',
    title: 'Crop to the label',
    desc: 'Crop your image so the label fills most of the frame before uploading.',
  },
  {
    icon: '🖨️',
    title: 'High resolution helps',
    desc: 'Use 300 DPI or higher for scanned documents. Low-res images miss small text.',
  },
  {
    icon: '📄',
    title: 'Prefer PDF for documents',
    desc: 'For digital label documents, export and upload as PDF for cleaner text extraction.',
  },
  {
    icon: '🔬',
    title: 'Use debug mode',
    desc: 'Use the /debug-ocr API endpoint to preview raw extracted text before scoring.',
  },
];

const STEPS = [
  { num: '1', icon: '🔍', title: 'Search or Upload', desc: 'Enter a device name in the search bar or upload a label photo/PDF.' },
  { num: '2', icon: '👁️', title: 'OCR Extraction', desc: 'The system reads the label using Tesseract OCR and extracts structured fields.' },
  { num: '3', icon: '⚖️', title: 'Compliance Check', desc: 'Extracted fields are compared against FDA, MHRA, CDSCO, and PMDA requirements.' },
  { num: '4', icon: '📊', title: 'View Report', desc: 'See compliance scores, missing fields, and best-match country instantly.' },
];

export default function Help() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

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
          <span className="home-nav-item" onClick={() => navigate('/regulations')}>Regulations</span>
          <span className="home-nav-item active">Help</span>
        </nav>
      </header>

      {/* Hero */}
      <section className="home-hero-banner">
        <div className="home-hero-left">
          <div className="home-hero-tag">
            <span className="home-hero-tag-dot" />
            User Guide & Support
          </div>
          <h1 className="home-hero-title">
            How to Use<br />
            <span className="home-hero-highlight">MedLabel Verify</span>
          </h1>
          <p className="home-hero-desc">
            Everything you need to get the most out of the compliance checker —
            from uploading your first label to understanding compliance scores.
          </p>
          <div className="home-hero-countries">
            <div className="home-country-badge">📷 Scan Labels</div>
            <div className="home-country-badge">🔍 Search Devices</div>
            <div className="home-country-badge">📊 View Scores</div>
            <div className="home-country-badge">📋 Export Reports</div>
          </div>
        </div>
        <div className="home-hero-right">
          <div className="home-hero-card">
            <div className="home-hero-card-header">🧭 Quick Links</div>
            {[
              { label: 'How it works', anchor: '#how-it-works' },
              { label: 'OCR tips', anchor: '#ocr-tips' },
              { label: 'FAQs', anchor: '#faqs' },

            ].map(l => (
              <div key={l.label} className="home-hero-card-row help-quick-link"
                onClick={() => document.querySelector(l.anchor)?.scrollIntoView({ behavior: 'smooth' })}>
                <span>{l.label}</span>
                <span style={{ color: '#0066cc', fontWeight: 700 }}>↓</span>
              </div>
            ))}
            <div className="home-hero-card-footer">Scroll to explore</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="home-steps-section" id="how-it-works">
        <h2 className="home-section-title">⚙️ How It Works</h2>
        <p className="home-section-desc">Four simple steps from label to compliance report</p>
        <div className="home-steps">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="home-step">
                <div className="home-step-num">{s.num}</div>
                <div className="home-step-icon">{s.icon}</div>
                <div className="home-step-title">{s.title}</div>
                <div className="home-step-desc">{s.desc}</div>
              </div>
              {i < STEPS.length - 1 && <div className="home-step-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* OCR Tips */}
      <section className="home-upload-section" id="ocr-tips">
        <h2 className="home-section-title">📷 Tips for Better OCR Results</h2>
        <p className="home-section-desc">Follow these tips to get the most accurate field extraction from your label</p>
        <div className="help-tips-grid">
          {TIPS.map(t => (
            <div key={t.title} className="help-tip-card">
              <div className="help-tip-icon">{t.icon}</div>
              <div className="help-tip-title">{t.title}</div>
              <div className="help-tip-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="home-search-section help-faq-section" id="faqs">
        <h2 className="home-section-title">❓ Frequently Asked Questions</h2>
        <p className="home-section-desc">Answers to the most common questions about MedLabel Verify</p>
        <div className="help-faq-list">
          {FAQS.map((faq, i) => (
            <div key={i} className={`help-faq-item ${openFaq === i ? 'help-faq-open' : ''}`}>
              <button className="help-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="help-faq-arrow">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && (
                <div className="help-faq-a">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>



      {/* CTA */}
      <section className="home-search-section">
        <h2 className="home-section-title">🚀 Ready to check your label?</h2>
        <p className="home-section-desc">Go back to the home page and upload or scan your medical device label</p>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="home-search-btn" onClick={() => navigate('/')}>
            Check a Label →
          </button>
          <button className="home-search-btn" style={{ background: '#0a1628' }}
            onClick={() => navigate('/regulations')}>
            View Regulations →
          </button>
        </div>
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