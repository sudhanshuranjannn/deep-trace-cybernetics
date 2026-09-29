import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Bell, ChevronDown, CircleHelp, LayoutDashboard, LogOut, Menu, Radio, Users, X, ListChecks, Shield, Plus } from 'lucide-react';
import { api, hasToken, setToken, write, type Tenant, type User } from './api';
import { Brand, ErrorBox, Loading, Modal } from './components';
import DashboardPage from './Dashboard';
import RecordsPage from './Records';
import Landing from './Landing';
import OrganizationForm, { type CreatedOrganization } from './OrganizationForm';

type Session = { user: User; tenant: Tenant };
export type View = 'overview' | 'campaigns' | 'events' | 'users' | 'audit';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'campaigns', label: 'Campaigns', icon: Radio },
  { id: 'events', label: 'Security Events', icon: Activity },
  { id: 'users', label: 'Team Members', icon: Users },
  { id: 'audit', label: 'Audit Logs', icon: ListChecks },
] as const;

export default function App() {
  const [createOrganization, setCreateOrganization] = useState(false);
  const [newOrganization, setNewOrganization] = useState<CreatedOrganization | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(hasToken());
  const [loggingOut, setLoggingOut] = useState(false);
  const [view, setView] = useState<View>('overview');
  const [mobile, setMobile] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const expire = () => {
      setSession(null);
      setError('Your session ended. Please sign in again.');
    };
    window.addEventListener('session-expired', expire);
    if (hasToken()) {
      api<Session>('/auth/me')
        .then((s) => {
          if (active) setSession(s);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
      window.removeEventListener('session-expired', expire);
    };
  }, []);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');
    try {
      await write('/auth/logout', 'POST');
      setToken('');
      setSession(null);
      setView('overview');
      setMobile(false);
      setCreateOrganization(false);
      setNewOrganization(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoggingOut(false);
    }
  }

  function navigate(next: View) {
    setView(next);
    setMobile(false);
    setError('');
  }

  if (loading) return <Loading />;

  if (!session) {
    return (
      <>
        <Landing
          onLogin={(s) => {
            setSession(s);
            setView('overview');
            setError('');
          }}
        />
        {error && (
          <div className="toast" role="status">
            <span>{error}</span>
            <button aria-label="Dismiss" onClick={() => setError('')}>
              <X size={15} />
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <div className="sidebar-brand-box">
          <Brand />
        </div>

        {/* Tenant Workspace Box */}
        <div className="workspace-badge-card">
          <div className="tenant-avatar">{session.tenant.name.charAt(0).toUpperCase()}</div>
          <div className="tenant-info">
            <span className="tenant-name">{session.tenant.name}</span>
            <span className="tenant-slug">/{session.tenant.slug}</span>
          </div>
        </div>

        <button
          className="btn-create-org"
          onClick={() => {
            setNewOrganization(null);
            setCreateOrganization(true);
          }}
        >
          <Plus size={14} /> Create Organization
        </button>

        <span className="nav-section-title">NAVIGATION</span>
        <nav className="sidebar-nav">
          {navigation
            .filter((n) => n.id !== 'audit' || session.user.role === 'ADMIN')
            .map((n) => {
              const isSelected = view === n.id;
              return (
                <button
                  key={n.id}
                  className={`nav-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => navigate(n.id)}
                >
                  <n.icon size={17} className="nav-icon" />
                  <span>{n.label}</span>
                  {isSelected && <span className="nav-active-pip" />}
                </button>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-security-chip">
            <Shield size={14} className="text-emerald" />
            <div>
              <strong>Tenant Scoped</strong>
              <small>Zero Cross-Org Access</small>
            </div>
          </div>

          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="sidebar-docs-link">
            <CircleHelp size={15} />
            <span>API Docs</span>
            <ArrowRight size={13} className="docs-arrow" />
          </a>

          <div className="sidebar-user-profile">
            <div className="user-avatar-circle">
              {session.user.name
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{session.user.name}</span>
              <span className="user-role-tag">{session.user.role}</span>
            </div>
            <button
              className="btn-icon btn-logout"
              title="Sign Out"
              aria-label="Sign out"
              disabled={loggingOut}
              onClick={logout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobile && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setMobile(false)} />}

      {/* Main Workspace Frame */}
      <div className="main-shell">
        {createOrganization && (
          <Modal title="Create New Organization" onClose={() => setCreateOrganization(false)}>
            {newOrganization ? (
              <div className="org-created-modal">
                <h3>{newOrganization.tenant.name} is ready.</h3>
                <p>
                  Organization Identifier: <b>{newOrganization.tenant.slug}</b>
                </p>
                <p className="modal-desc">
                  Your current session remains active in this workspace. To access the new organization, sign out and sign
                  in with your new admin account.
                </p>
                <button className="btn-primary" onClick={() => setCreateOrganization(false)}>
                  Continue in current workspace
                </button>
              </div>
            ) : (
              <OrganizationForm onCreated={setNewOrganization} />
            )}
          </Modal>
        )}

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-icon mobile-menu-btn" aria-label="Open navigation" onClick={() => setMobile(true)}>
              <Menu size={18} />
            </button>
            <div className="breadcrumb">
              <span className="crumb-org">{session.tenant.name}</span>
              <span className="crumb-slash">/</span>
              <span className="crumb-view">{navigation.find((n) => n.id === view)?.label}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="env-pill">
              <span className="pulse-dot" />
              <span>LIVE WORKSPACE</span>
            </div>
            <button
              className="btn-icon"
              aria-label="View security events"
              title="View Events"
              onClick={() => navigate('events')}
            >
              <Bell size={17} />
            </button>
            <button className="btn-secondary btn-sm" onClick={logout} disabled={loggingOut}>
              <LogOut size={14} />
              <span>{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content">
          <ErrorBox message={error} />
          {view === 'overview' ? (
            <DashboardPage user={session.user} navigate={navigate} />
          ) : (
            <RecordsPage key={view} view={view} user={session.user} />
          )}

          <footer className="page-footer">
            <span>Deep Trace Cybernetics — Multi-Tenant Security Platform</span>
            <span>Version 1.0.0</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
