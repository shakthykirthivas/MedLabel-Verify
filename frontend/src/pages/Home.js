import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const GalleryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const FilesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/results?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      navigate(`/results?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
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
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      navigate('/results', { state: { file } });
    }, 'image/jpeg', 0.92);
  };

  const handleGallery = () => imageInputRef.current.click();
  const handleFiles = () => pdfInputRef.current.click();

  const onImageSelected = (e) => {
    const file = e.target.files[0];
    if (file) navigate('/results', { state: { file } });
    e.target.value = '';
  };

  const onPdfSelected = (e) => {
    const file = e.target.files[0];
    if (file) navigate('/results', { state: { file } });
    e.target.value = '';
  };

  return (
    <div className="home-wrapper">

      {/* Top alert bar */}
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
          <span className="home-nav-item active">Home</span>
          <span className="home-nav-item" onClick={() => navigate('/regulations')}>Regulations</span>
          <span className="home-nav-item" onClick={() => navigate('/help')}>Help</span>
        </nav>
      </header>

      {/* Hero Banner */}
      <section className="home-hero-banner">
        <div className="home-hero-left">
          <div className="home-hero-tag">
            <span className="home-hero-tag-dot" />
            Medical Device Regulatory Tool
          </div>
          <h1 className="home-hero-title">
            Medical Device<br />
            <span className="home-hero-highlight">Label Compliance</span><br />
            Checker
          </h1>
          <p className="home-hero-desc">
            Upload or scan a medical device label to instantly verify compliance
            with regulatory requirements across <strong>4 countries</strong>.
            Get detailed field analysis and compliance scores in seconds.
          </p>
          <div className="home-hero-countries">
            <div className="home-country-badge">CDSCO — India</div>
            <div className="home-country-badge">FDA — USA</div>
            <div className="home-country-badge">MHRA — UK</div>
            <div className="home-country-badge">PMDA — Japan</div>
          </div>
        </div>
        <div className="home-hero-right">
          <div className="home-hero-card">
            <div className="home-hero-card-header">
              <span>📋</span> Sample Compliance Report
            </div>
            <div className="home-hero-card-row">
              <span>Device Name</span><span className="found">✅ Found</span>
            </div>
            <div className="home-hero-card-row">
              <span>Manufacturer</span><span className="found">✅ Found</span>
            </div>
            <div className="home-hero-card-row">
              <span>UDI</span><span className="found">✅ Found</span>
            </div>
            <div className="home-hero-card-row">
              <span>Lot Number</span><span className="found">✅ Found</span>
            </div>
            <div className="home-hero-card-row">
              <span>Warnings</span><span className="missing">❌ Missing</span>
            </div>
            <div className="home-hero-card-footer">
              India — Best Match: <strong>85%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="home-search-section">
        <h2 className="home-section-title">
          🔍 Search Medical Device
        </h2>
        <p className="home-section-desc">
          Type a device name to view country-wise labeling requirements
        </p>
        <div className="home-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0066cc"
            strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="home-search-input"
            type="text"
            placeholder="e.g. Thermometer, Nebulizer, ECG Machine, Glucometer..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button className="home-search-btn" onClick={handleSearchClick}>
            Search
          </button>
        </div>
        <div className="home-quick-tags">
          <span className="home-tag" onClick={() => navigate('/results?q=Thermometer')}>Thermometer</span>
          <span className="home-tag" onClick={() => navigate('/results?q=Stethoscope')}>Stethoscope</span>
          <span className="home-tag" onClick={() => navigate('/results?q=Glucometer')}>Glucometer</span>
          <span className="home-tag" onClick={() => navigate('/results?q=Nebulizer')}>Nebulizer</span>
          <span className="home-tag" onClick={() => navigate('/results?q=ECG Machine')}>ECG Machine</span>
          <span className="home-tag" onClick={() => navigate('/results?q=Syringe')}>Syringe</span>
        </div>
      </section>

      {/* Upload Section */}
      <section className="home-upload-section">
        <h2 className="home-section-title">📷 Scan or Upload Label</h2>
        <p className="home-section-desc">
          Upload a medical device label image to extract fields and check compliance automatically
        </p>
        <div className="home-actions">
          <button className="home-action-btn" onClick={handleCamera}>
            <div className="home-action-icon blue"><CameraIcon /></div>
            <span className="home-action-label">Scan Label</span>
            <span className="home-action-desc">Use device camera</span>
          </button>
          <button className="home-action-btn" onClick={handleGallery}>
            <div className="home-action-icon blue"><GalleryIcon /></div>
            <span className="home-action-label">Upload Image</span>
            <span className="home-action-desc">JPG, PNG, WEBP</span>
          </button>
          <button className="home-action-btn" onClick={handleFiles}>
            <div className="home-action-icon blue"><FilesIcon /></div>
            <span className="home-action-label">Upload PDF</span>
            <span className="home-action-desc">PDF documents</span>
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="home-steps-section">
        <h2 className="home-section-title">⚙️ How It Works</h2>
        <div className="home-steps">
          <div className="home-step">
            <div className="home-step-num">1</div>
            <div className="home-step-icon">📤</div>
            <div className="home-step-title">Upload or Search</div>
            <div className="home-step-desc">Search a device name or upload a label image</div>
          </div>
          <div className="home-step-arrow">→</div>
          <div className="home-step">
            <div className="home-step-num">2</div>
            <div className="home-step-icon">👁️</div>
            <div className="home-step-title">OCR Extraction</div>
            <div className="home-step-desc">System extracts all label fields using OCR</div>
          </div>
          <div className="home-step-arrow">→</div>
          <div className="home-step">
            <div className="home-step-num">3</div>
            <div className="home-step-icon">⚖️</div>
            <div className="home-step-title">Compare Rules</div>
            <div className="home-step-desc">Fields compared against 4 country regulations</div>
          </div>
          <div className="home-step-arrow">→</div>
          <div className="home-step">
            <div className="home-step-num">4</div>
            <div className="home-step-icon">📊</div>
            <div className="home-step-title">Get Report</div>
            <div className="home-step-desc">Instant compliance percentage and best match</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-left">
          <span className="home-footer-logo">✚ MedLabel Verify</span>
          <span className="home-footer-copy">© 2026 Medical Device Label Compliance Checker</span>
        </div>
        <div className="home-footer-right">
          <span>CDSCO</span>
          <span>FDA</span>
          <span>MHRA</span>
          <span>PMDA</span>
        </div>
      </footer>

      {/* Hidden inputs */}
      <input ref={imageInputRef} type="file" accept="image/*"
        style={{ display: 'none' }} onChange={onImageSelected} />
      <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf"
        style={{ display: 'none' }} onChange={onPdfSelected} />

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="camera-modal">
          <div className="camera-modal-inner">
            <video ref={videoRef} className="camera-video" playsInline />
            <div className="camera-btn-row">
              <button className="camera-capture-btn" onClick={capturePhoto}>📸 Capture</button>
              <button className="camera-close-btn" onClick={closeCamera}>✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}