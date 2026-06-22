import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '../components/Navbar';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

const SUPPORTED_DEVICES = [
  'Thermometer', 'Syringe', 'Blood Pressure Monitor', 'Pulse Oximeter',
  'Stethoscope', 'Glucometer', 'Nebulizer', 'ECG Machine', 'Defibrillator',
  'Infusion Pump', 'Surgical Mask', 'Wheelchair', 'Hearing Aid',
  'MRI Machine', 'X-Ray Machine'
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const navigate = useNavigate();

  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoRef = useRef(null);

  const timelineRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-reveal', {
        autoAlpha: 0, y: 40, duration: 1, stagger: 0.1,
        ease: 'power4.out', delay: 0.2
      });
      gsap.from('.hero-image-box', {
        autoAlpha: 0, filter: 'blur(20px)', scale: 1.05,
        duration: 1.5, ease: 'power2.out'
      });
      gsap.fromTo('#scan-line',
        { top: '0%' },
        { top: '100%', duration: 3, repeat: -1, yoyo: true, ease: 'power1.inOut' }
      );
      gsap.to(progressRef.current, {
        height: '100%', ease: 'none',
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top 60%', end: 'bottom 40%', scrub: true
        }
      });
    });
    return () => ctx.revert();
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) doSearch(query.trim());
  };

  const handleSearchClick = () => {
    if (query.trim()) doSearch(query.trim());
  };

  const doSearch = (q) => {
    const matched = SUPPORTED_DEVICES.find(d => d.toLowerCase() === q.toLowerCase());
    if (matched) {
      setSearchError('');
      navigate(`/results?q=${encodeURIComponent(matched)}`);
    } else {
      setSearchError(
        `"${q}" was not found in the device registry. Supported devices include: Thermometer, Syringe, Blood Pressure Monitor, Pulse Oximeter, Stethoscope, Glucometer, Nebulizer, ECG Machine, Defibrillator, Infusion Pump, Surgical Mask, Wheelchair, Hearing Aid, MRI Machine, X-Ray Machine.`
      );
    }
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch (err) {
      alert('Camera access denied: ' + err.message);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      closeCamera();
      const file = new File([blob], 'scan_capture.jpg', { type: 'image/jpeg' });
      navigate('/results', { state: { file } });
    }, 'image/jpeg', 0.92);
  };

  const onFileSelected = (e) => {
    const file = e.target.files[0];
    if (file) navigate('/results', { state: { file } });
    e.target.value = '';
  };

  return (
    <div className="home-site">
      <Navbar />

      {/* Hero Block */}
      <header className="hero section-padding" style={{ paddingTop: '48px' }}>
        <div className="swiss-grid items-center">
          <div className="col-span-7">
            <div className="mb-8 flex items-center gap-3 hero-reveal">
              <span className="tag-eyebrow">Global Standards</span>
              <span className="sub-eyebrow">Regulatory Compliance Platform v4.2</span>
            </div>
            <h1 className="text-h1 mb-8 hero-reveal">
              Medical Device Label<br />
              <span className="text-accent">Compliance Checker</span>
            </h1>

            {/* Project Description */}
            <p className="text-lead mb-6 hero-reveal">
              MedLabel Verify is a web application for medical device label verification, OCR-based label scanning, regulatory mark detection, country identification (USA, UK, India, and Japan), and compliance analysis based on country-specific labeling requirements.
            </p>
            <p className="text-lead mb-12 hero-reveal">
              Verify medical device labels against the world's strictest regulations in seconds. Our platform provides deterministic verification for FDA, MHRA, CDSCO, and PMDA requirements.
            </p>

            {/* Search Bar */}
            <div className="hero-reveal mb-4">
              <div className="flex items-center gap-4 border border-text bg-white p-1 max-w-xl">
                <input
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSearchError(''); }}
                  onKeyDown={handleSearch}
                  placeholder="Search a device — e.g. Thermometer, Syringe…"
                  style={{
                    flex: 1, padding: '14px 20px', fontFamily: 'var(--font-body)',
                    fontSize: '15px', border: 'none', outline: 'none', background: 'transparent'
                  }}
                />
                <button className="btn-primary" onClick={handleSearchClick}>Search</button>
              </div>
              {searchError && (
                <p style={{
                  marginTop: '10px', fontSize: '13px', color: 'var(--color-error)',
                  maxWidth: '560px', lineHeight: '1.6'
                }}>
                  ⚠ {searchError}
                </p>
              )}
            </div>

            {/* Upload Options */}
            <div className="flex items-center gap-4 hero-reveal" style={{ marginTop: '24px' }}>
              <button className="btn-accent" onClick={handleCamera}>
                <i className="ti ti-camera" style={{ marginRight: '8px' }}></i>Camera Scan
              </button>
              <button className="btn-accent" onClick={() => imageInputRef.current.click()}>
                <i className="ti ti-photo" style={{ marginRight: '8px' }}></i>Gallery Upload
              </button>
              <button className="btn-accent" onClick={() => pdfInputRef.current.click()}>
                <i className="ti ti-file-text" style={{ marginRight: '8px' }}></i>Document Upload
              </button>
            </div>
            <p style={{ fontSize: '11px', opacity: 0.45, marginTop: '10px', letterSpacing: '0.05em' }}>
              Supported formats: JPG, PNG, WEBP, PDF
            </p>

            <div className="flex items-center gap-8 hero-reveal" style={{ marginTop: '32px' }}>
              <div className="flex items-center gap-3 framework-link group" onClick={() => navigate('/regulations')}>
                <span className="link-text">View Compliance Framework</span>
                <i className="ti ti-arrow-right"></i>
              </div>
            </div>
          </div>

          <div className="col-span-5">
            <div className="hero-image-box">
              <img src="/images/hero-label.jpg" alt="Medical device label scan" />
              <div className="scan-line" id="scan-line"></div>
              <div className="hud-badge">
                <span className="pulse-dot"></span>
                <span className="hud-text">ACTIVE_VALIDATION</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Verification Pipeline */}
      <section className="pipeline-section py-32 bg-text text-white">
        <div className="swiss-grid mb-24">
          <div className="col-span-6">
            <h2 className="text-h2 mb-8 text-white">The Verification Pipeline</h2>
            <p className="text-lead text-white opacity-60">Institutional-grade rigor at every stage.</p>
          </div>
        </div>
        <div className="swiss-grid" ref={timelineRef}>
          <div className="col-span-8 col-start-3 relative">
            <div className="spine" style={{ top: '6px' }}>
              <div className="spine-progress" ref={progressRef}></div>
            </div>
            {[
              { phase: '01', title: 'Ingestion & Pre-processing', desc: 'Native PDF or high-resolution imagery is ingested via encrypted channel. Multi-spectrum noise reduction ensures clinical-grade legibility.' },
              { phase: '02', title: 'Parameter Extraction', desc: 'Proprietary vision models extract device names, manufacturer details, lot numbers, and symbols with 99.9% accuracy.' },
              { phase: '03', title: 'Regulatory Cross-Check', desc: 'Extracted data points are compared against a real-time updated library of 24,000+ national regulatory requirements.' },
              { phase: '04', title: 'Compliance Certification', desc: 'A cryptographically signed compliance report is generated, detailing specific passes or flags for each target jurisdiction.' }
            ].map((step, i, arr) => (
              <div key={i} className={`pipeline-step pl-20 relative ${i !== arr.length - 1 ? 'mb-24' : ''}`}>
                <div className="step-marker"></div>
                <div className="max-w-xl">
                  <span className="step-phase">Phase {step.phase}</span>
                  <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                  <p className="text-lg font-light opacity-70 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer className="footer bg-white border-t-2 border-text pt-24 pb-12" id="company">
        <div className="swiss-grid pb-24 border-b border-hairline-light">
          <div className="col-span-4">
            <div className="logo-group flex items-center gap-2 mb-8" onClick={() => navigate('/')}>
              <div className="wordmark-box small">M</div>
              <span className="wordmark-text small">MEDLABEL<span className="wordmark-light">VERIFY</span></span>
            </div>
            <p className="footer-bio">
              The institutional standard for medical device label verification and regulatory compliance automation.
            </p>
            <div className="flex gap-4">
              <button className="social-link"><i className="ti ti-brand-linkedin"></i></button>
              <button className="social-link"><i className="ti ti-brand-x"></i></button>
            </div>
          </div>
          {[
            {
              title: 'Platform',
              links: [
                { label: 'Rules', action: () => navigate('/regulations', { state: { scrollTo: 'reg-details' } }) },
                { label: 'Security', action: () => navigate('/help', { state: { scrollTo: 'faq' } }) },
              ]
            },
            {
              title: 'Standards',
              links: [
                { label: 'FDA', action: () => navigate('/regulations', { state: { country: 'USA', scrollTo: 'reg-details' } }) },
                { label: 'MHRA', action: () => navigate('/regulations', { state: { country: 'UK', scrollTo: 'reg-details' } }) },
                { label: 'CDSCO', action: () => navigate('/regulations', { state: { country: 'India', scrollTo: 'reg-details' } }) },
                { label: 'PMDA', action: () => navigate('/regulations', { state: { country: 'Japan', scrollTo: 'reg-details' } }) },
              ]
            },
            {
              title: 'Resources',
              links: [
                { label: 'Regulations', action: () => navigate('/regulations', { state: { scrollTo: 'country-tabs' } }) },
                { label: 'OCR Tips', action: () => navigate('/help', { state: { scrollTo: 'ocr-tips' } }) },
                { label: 'FAQ', action: () => navigate('/help', { state: { scrollTo: 'faq' } }) },
                { label: 'Debug OCR', action: () => navigate('/help', { state: { scrollTo: 'ocr-tips' } }) },
              ]
            },
            {
              title: 'Support',
              links: [
                { label: 'How It Works', action: () => navigate('/help', { state: { scrollTo: 'how-to-use' } }) },
                { label: 'Documentation', action: () => navigate('/help') },
                { label: 'Contact', action: () => navigate('/help', { state: { scrollTo: 'faq' } }) },
              ]
            },
          ].map((col, i) => (
            <div key={i} className="col-span-2">
              <h4 className="footer-title">{col.title}</h4>
              <ul className="footer-nav">
                {col.links.map(({ label, action }, j) => (
                  <li key={j} onClick={action}>{label}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="swiss-grid pt-12">
          <div className="col-span-6 legal-copy">
            &copy; 2026 MedLabel Verify INC. All rights reserved. Precision compliance technology.
          </div>
          <div className="col-span-6 text-right status-copy">
            System Status: <span className="text-success">Operational</span> &middot; HQ: Zurich, Switzerland
          </div>
        </div>
      </footer>

      {/* Hidden File Inputs */}
      <input ref={imageInputRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={onFileSelected} />
      <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf,image/*" className="hidden" onChange={onFileSelected} />

      {/* Scanner Modal */}
      {cameraOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span className="text-xs-bold">Live Scan Capture</span>
              <button className="close-btn" onClick={closeCamera}>&times;</button>
            </div>
            <video ref={videoRef} className="modal-video" playsInline />
            <div className="modal-footer">
              <button className="btn-primary" onClick={capturePhoto}>Capture Frame</button>
              <button className="btn-accent secondary" onClick={closeCamera}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}