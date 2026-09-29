import { useState, type FormEvent } from 'react';
import { Activity, ArrowRight, Building2, Check, CheckCircle2, Eye, EyeOff, Layers3, ShieldCheck, Users, X, KeyRound, Sparkles } from 'lucide-react';
import { setToken, write, type User, type Tenant } from './api';
import { Brand, ErrorBox, Modal } from './components';
import SecurityIllustration from './SecurityIllustration';
import OrganizationForm, { type CreatedOrganization } from './OrganizationForm';

type Session = { user: User; tenant: Tenant };

export default function Landing({ onLogin }: { onLogin: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'create' | null>(null);
  const [created, setCreated] = useState<CreatedOrganization | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  // Form field state for login
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function open(next: 'login' | 'create') {
    setError('');
    setMode(next);
  }

  function fillDemo() {
    setOrgId('acme');
    setEmail('admin@acme.test');
    setPassword('DemoPassword123!');
    setError('');
  }

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      organization: form.get('organization') || orgId,
      email: form.get('email') || email,
      password: form.get('password') || password,
    };
    try {
      const result = await write<Session & { access_token: string }>('/auth/login', 'POST', payload);
      setToken(result.access_token);
      onLogin(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing-wrapper">
      {/* Top Navigation */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Brand />
          <nav className="nav-links" aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#architecture">Architecture</a>
          </nav>
          <div className="nav-actions">
            <button className="btn-secondary" onClick={() => open('login')}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => open('create')}>
              Create Organization
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="landing-main">
        <section className="hero-section" id="platform">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            MULTI-TENANT SECURITY OPERATIONS
          </div>
          <h1 className="hero-heading">
            Enterprise Security Operations,<br />
            <span>Simplified & Isolated.</span>
          </h1>
          <p className="hero-subheading">
            Coordinate incident response, campaign tracking, and role-based operational oversight
            with strict data isolation for every organization.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary btn-lg" onClick={() => open('create')}>
              Get Started <ArrowRight size={16} />
            </button>
            <button className="btn-secondary btn-lg" onClick={() => open('login')}>
              Open Workspace
            </button>
          </div>

          <div className="hero-checks">
            <span><Check size={14} className="text-emerald" /> Cryptographic Tenant Isolation</span>
            <span><Check size={14} className="text-emerald" /> Role-Based Access Control</span>
            <span><Check size={14} className="text-emerald" /> Tamper-Evident Audit Logging</span>
          </div>

          {/* Interactive Preview Widget */}
          <div className="hero-preview-container">
            <SecurityIllustration />
          </div>
        </section>

        {/* Value Strip */}
        <section className="feature-strip">
          <div className="feature-strip-item">
            <Building2 size={18} className="strip-icon" />
            <div>
              <strong>Tenant Isolation</strong>
              <p>Zero cross-organization data leakage</p>
            </div>
          </div>
          <div className="feature-strip-item">
            <Users size={18} className="strip-icon" />
            <div>
              <strong>Role Governance</strong>
              <p>Granular Admin, Manager, and User roles</p>
            </div>
          </div>
          <div className="feature-strip-item">
            <Activity size={18} className="strip-icon" />
            <div>
              <strong>Live Telemetry</strong>
              <p>Event triage, severities, and resolution</p>
            </div>
          </div>
          <div className="feature-strip-item">
            <ShieldCheck size={18} className="strip-icon" />
            <div>
              <strong>Audit Ledger</strong>
              <p>Complete traceability of all system actions</p>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="capabilities-section" id="capabilities">
          <div className="section-header">
            <span className="section-eyebrow">CAPABILITIES</span>
            <h2>Designed for Serious Security Teams</h2>
            <p>Every operational control you need, without visual clutter.</p>
          </div>

          <div className="capability-cards-grid">
            <div className="capability-card">
              <div className="cap-icon-box">
                <Layers3 size={20} />
              </div>
              <h3>Security Campaigns</h3>
              <p>Manage strategic initiatives from draft planning to execution, with direct team member assignments.</p>
            </div>

            <div className="capability-card">
              <div className="cap-icon-box">
                <Activity size={20} />
              </div>
              <h3>Incident Triage</h3>
              <p>Classify incoming events by severity (Low to Critical) and track workflows through formal investigation stages.</p>
            </div>

            <div className="capability-card">
              <div className="cap-icon-box">
                <Users size={20} />
              </div>
              <h3>Granular Team RBAC</h3>
              <p>Strict server-enforced permissions ensure members only access authorized tenant data and capabilities.</p>
            </div>

            <div className="capability-card">
              <div className="cap-icon-box">
                <ShieldCheck size={20} />
              </div>
              <h3>Audit & Traceability</h3>
              <p>Automatic immutable audit logging for logins, role elevations, campaign changes, and resource modifications.</p>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="architecture-section" id="architecture">
          <div className="arch-box">
            <div className="arch-content">
              <span className="section-eyebrow">ENTERPRISE READY</span>
              <h2>Ready to deploy in your environment</h2>
              <p>FastAPI async engine with SQLAlchemy models, standard PostgreSQL schema isolation, and React 19 UI.</p>
              <div className="arch-actions">
                <button className="btn-primary" onClick={() => open('create')}>
                  Create Organization <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <Brand />
          <p>© {new Date().getFullYear()} Deep Trace Cybernetics. All rights reserved.</p>
        </div>
      </footer>

      {/* Login / Signup Modal */}
      {mode && (
        <Modal
          title={mode === 'create' ? 'Create New Organization' : 'Sign In to Workspace'}
          onClose={() => {
            if (!busy) setMode(null);
          }}
        >
          {mode === 'create' ? (
            <div className="auth-form-wrap">
              <p className="auth-desc">Set up a dedicated, isolated workspace for your organization.</p>
              <OrganizationForm
                onCreated={(result) => {
                  setCreated(result);
                  setOrgId(result.tenant.slug);
                  setEmail(result.email);
                  setMode('login');
                  setError('');
                }}
              />
              <div className="auth-footer-link">
                <span>Already have a workspace? </span>
                <button type="button" className="btn-link" onClick={() => open('login')}>
                  Sign in
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-form-wrap">
              {created && (
                <div className="notice-banner" role="status">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <div>
                    <strong>{created.tenant.name} is ready.</strong>
                    <span> Organization ID: <b>{created.tenant.slug}</b></span>
                  </div>
                  <button type="button" className="btn-icon" aria-label="Dismiss" onClick={() => setCreated(null)}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <p className="auth-desc">Enter your organization identifier and account credentials.</p>

              {/* Demo Credentials Quick-Fill button */}
              <div className="demo-fill-bar">
                <div className="demo-fill-text">
                  <Sparkles size={14} className="text-slate" />
                  <span>Testing the platform?</span>
                </div>
                <button type="button" className="btn-demo-pill" onClick={fillDemo}>
                  <KeyRound size={12} /> Auto-fill Demo Credentials
                </button>
              </div>

              <form onSubmit={login} className="auth-form">
                <label>
                  Organization ID
                  <input
                    name="organization"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    placeholder="e.g. acme"
                    autoComplete="organization"
                    required
                    maxLength={80}
                    autoCapitalize="none"
                  />
                  <small>Workspace handle assigned to your company</small>
                </label>

                <label>
                  Email Address
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="username"
                    required
                    maxLength={254}
                  />
                </label>

                <label>
                  Password
                  <div className="password-input-group">
                    <input
                      name="password"
                      type={visible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      maxLength={128}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      aria-label={visible ? 'Hide password' : 'Show password'}
                      onClick={() => setVisible((v) => !v)}
                    >
                      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <ErrorBox message={error} />

                <button className="btn-primary btn-block" disabled={busy}>
                  {busy ? 'Signing In…' : 'Sign In to Workspace'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="auth-footer-link">
                <span>Need a new workspace? </span>
                <button type="button" className="btn-link" onClick={() => open('create')}>
                  Create Organization
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
