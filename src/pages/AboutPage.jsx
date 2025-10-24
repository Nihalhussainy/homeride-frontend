import React from 'react';
import '../StaticPages.css';
import { FiTarget, FiUsers, FiShield, FiTrendingUp, FiBriefcase, FiGift, FiBarChart2, FiCheckCircle } from 'react-icons/fi';

function AboutPage() {
  return (
    <div className="main-container">
      <header className="page-header">
        <h1>About HomeRide</h1>
        <p className="page-description">This is not just a carpooling app — it’s a cost-saving, safety-first, and HR-aligned travel benefit platform for employees.</p>
      </header>

      {/* --- THIS SECTION IS UNCHANGED --- */}
      <section className="about-section">
        <div className="about-content">
          <h2>Our Story</h2>
          <p>
            Born from an internship project at Sopra Steria, HomeRide was created to solve the daily challenge of commuting. We envisioned a platform where colleagues could easily connect, share rides, and turn their daily travel into a more positive and collaborative experience.
          </p>
        </div>
        <div className="about-image-placeholder">
            <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto-format&fit=crop" alt="Carpooling"/>
        </div>
      </section>

      {/* --- NEW, DETAILED SECTION --- */}
      <section className="values-section">
        <h2>More Than a Ride-Sharing App</h2>
        <div className="feature-highlight-grid">
          <div className="feature-card">
            <FiShield size={32} className="value-icon" />
            <h3>Exclusive & Secure</h3>
            <p>Access is restricted to verified Sopra Steria employees, creating a trusted network for safer travel and fostering a true sense of internal community.</p>
          </div>
          <div className="feature-card">
            <FiGift size={32} className="value-icon" />
            <h3>Company-Sponsored Travel Wallet</h3>
            <p>We provide a company-sponsored travel wallet, allowing employees to receive credits or a monthly cab allowance. This unique perk improves retention and employee trust.</p>
          </div>
          <div className="feature-card">
            <FiBriefcase size={32} className="value-icon" />
            <h3>HR Integration & Policy Support</h3>
            <p>Our admin dashboard allows HR to approve trip logs, analyze travel patterns, and use data for retention strategies, festival planning, and supporting flexible work policies.</p>
          </div>
           <div className="feature-card">
            <FiBarChart2 size={32} className="value-icon" />
            <h3>Sustainability & Savings</h3>
            <p>Track estimated fuel savings and carbon footprint reduction. Our platform helps Sopra Steria save on travel reimbursements while promoting green initiatives.</p>
          </div>
        </div>
      </section>

      {/* --- NEW COMPARISON TABLE SECTION --- */}
      <section className="mission-section">
          <h2>Company-Grade Features</h2>
          <p>Public ride apps are built for consumers. HomeRide is built for the enterprise, with features that prioritize safety, cost-efficiency, and HR alignment.</p>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Public Ride Apps</th>
                <th>HomeRide Platform</th>
              </tr>
            </thead>
         
<tbody>
  <tr>
    <td>Verified Internal Employees Only</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Company-Sponsored Rides</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Monthly Employee Travel Wallet</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Admin/HR Dashboard with Analytics</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Cost, Route & Sustainability Reporting</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Internal Community & Networking</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Gender Preference for Ride Matching</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
  <tr>
    <td>Employee Retention & Benefit Tool</td>
    <td className="negative">❌</td>
    <td className="positive">✅</td>
  </tr>
</tbody>
          </table>
      </section>

    </div>
  );
}

export default AboutPage;