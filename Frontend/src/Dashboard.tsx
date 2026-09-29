import { useEffect, useState } from 'react';
import { Activity, ArrowRight, CalendarDays, ChevronRight, CircleAlert, Radio, RefreshCw, ShieldCheck, Users, ExternalLink } from 'lucide-react';
import { api, type Dashboard, type User } from './api';
import { Badge, Empty, ErrorBox, Loading, time } from './components';
import type { View } from './App';

export default function DashboardPage({ user, navigate }: { user: User; navigate: (v: View) => void }) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setError('');
    api<Dashboard>('/dashboard')
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  if (!data) return error ? <ErrorBox message={error} /> : <Loading />;

  const max = Math.max(1, ...data.trend.map((d) => d.count));
  const totalUnresolved = Object.values(data.severity_counts).reduce((a, b) => a + b, 0);

  const metrics = [
    {
      label: 'Active Team Members',
      value: data.users,
      icon: Users,
      note: 'Tenant-wide roster',
      type: 'users',
    },
    {
      label: 'Security Campaigns',
      value: data.campaigns,
      icon: Radio,
      note: `${data.active_campaigns} in active flight`,
      type: 'campaigns',
    },
    {
      label: 'Open Security Events',
      value: data.open_events,
      icon: Activity,
      note: 'Under active triage',
      type: 'events',
    },
    {
      label: 'Critical Threats',
      value: data.critical_events,
      icon: CircleAlert,
      note: data.critical_events ? 'Requires immediate action' : 'Zero critical incidents',
      type: 'critical',
      highlight: data.critical_events > 0,
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-heading">
        <div className="heading-left">
          <span className="eyebrow-tag">DASHBOARD OVERVIEW</span>
          <h1>Security Command Center</h1>
          <p>
            Welcome, <b>{user.name}</b> ({user.role.toLowerCase()}). Here is the current posture of your workspace.
          </p>
        </div>
        <div className="heading-right">
          <div className="date-badge">
            <CalendarDays size={14} />
            <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <button
            className="btn-icon bordered"
            aria-label="Refresh dashboard data"
            title="Refresh"
            onClick={() => setRefresh((v) => v + 1)}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* Overview Status Banner */}
      <div className={`status-banner ${data.critical_events ? 'alert' : 'normal'}`}>
        <div className="banner-icon-wrap">
          <ShieldCheck size={20} />
        </div>
        <div className="banner-text">
          <strong>
            {data.critical_events
              ? `${data.critical_events} Critical alert${data.critical_events > 1 ? 's' : ''} detected.`
              : 'All systems operational & tenant isolation verified.'}
          </strong>
          <p>
            {data.critical_events
              ? 'Immediate review recommended. Check unresolved security events below.'
              : 'Continuous telemetry active across campaigns and infrastructure.'}
          </p>
        </div>
        <button className="btn-secondary btn-sm" onClick={() => navigate('events')}>
          Review Events <ArrowRight size={14} />
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className={`metric-card ${m.highlight ? 'metric-critical' : ''}`}>
            <div className="metric-header">
              <span className="metric-title">{m.label}</span>
              <div className="metric-icon-wrap">
                <m.icon size={16} />
              </div>
            </div>
            <div className="metric-value">{m.value.toString().padStart(2, '0')}</div>
            <div className="metric-footer">
              <span className="metric-sub">{m.note}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="analytics-grid">
        {/* Weekly Trend Bar Chart */}
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Incident Activity Trend</h2>
              <p>Security events logged over the last 7 days</p>
            </div>
            <span className="panel-tag">Past 7 Days</span>
          </div>
          <div className="chart-body">
            <div className="chart-scale">
              <span>{max}</span>
              <span>{Math.round(max / 2)}</span>
              <span>0</span>
            </div>
            <div className="chart-bars-wrap">
              {data.trend.map((d, i) => {
                const heightPercent = max > 0 ? (d.count / max) * 100 : 0;
                const isToday = i === data.trend.length - 1;
                return (
                  <div key={i} className="chart-column">
                    <span className="bar-val">{d.count}</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${isToday ? 'today' : ''}`}
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                        title={`${d.day}: ${d.count} events`}
                      />
                    </div>
                    <span className="bar-day">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-footer">
            <span>Weekly Total: <b>{data.trend.reduce((s, d) => s + d.count, 0)} events</b></span>
            <span>Refreshed live</span>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="panel breakdown-panel">
          <div className="panel-header">
            <div>
              <h2>Severity Distribution</h2>
              <p>Unresolved threats by priority</p>
            </div>
            <CircleAlert size={16} className="text-slate" />
          </div>
          <div className="breakdown-body">
            <div className="breakdown-total">
              <strong>{totalUnresolved}</strong>
              <span>unresolved events</span>
            </div>

            {/* Segmented Bar */}
            <div className="breakdown-progress-bar">
              {Object.entries(data.severity_counts).map(([sev, cnt]) => {
                const flexValue = totalUnresolved > 0 ? cnt / totalUnresolved : 0.25;
                return (
                  <div
                    key={sev}
                    className={`bar-segment seg-${sev.toLowerCase()}`}
                    style={{ flex: Math.max(0.04, flexValue) }}
                    title={`${sev}: ${cnt}`}
                  />
                );
              })}
            </div>

            {/* Severity Legend */}
            <div className="breakdown-legend">
              {Object.entries(data.severity_counts).map(([sev, cnt]) => (
                <div key={sev} className="legend-row">
                  <div className="legend-label">
                    <span className={`legend-dot dot-${sev.toLowerCase()}`} />
                    <span>{sev.charAt(0) + sev.slice(1).toLowerCase()}</span>
                  </div>
                  <strong className="legend-cnt">{cnt}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events Table */}
      <div className="panel table-panel">
        <div className="panel-header">
          <div>
            <h2>Recent Security Telemetry</h2>
            <p>Latest signals captured across tenant systems</p>
          </div>
          <button className="btn-link" onClick={() => navigate('events')}>
            View All Events <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>EVENT TYPE</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>TIMESTAMP</th>
                <th className="th-action">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_events.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="table-item-primary">
                      <strong>{e.event_type}</strong>
                      <small>ID: EVT-{String(e.id).padStart(4, '0')}</small>
                    </div>
                  </td>
                  <td>
                    <Badge value={e.severity} />
                  </td>
                  <td>
                    <Badge value={e.status} />
                  </td>
                  <td className="text-muted">{time(e.created_at)}</td>
                  <td className="td-action">
                    <button
                      className="btn-icon"
                      aria-label={`View ${e.event_type}`}
                      title="Inspect Event"
                      onClick={() => navigate('events')}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.recent_events.length && <Empty text="No security events recorded yet." />}
        </div>
      </div>

      {/* Campaign Spotlight */}
      <div className="campaign-spotlight-section">
        <div className="section-header-row">
          <div>
            <h2>{user.role === 'USER' ? 'Your Assigned Campaigns' : 'Active Campaign Spotlight'}</h2>
            <p>Operational defense initiatives and active reviews</p>
          </div>
          <button className="btn-link" onClick={() => navigate('campaigns')}>
            All Campaigns <ArrowRight size={14} />
          </button>
        </div>

        <div className="campaign-cards-row">
          {data.recent_campaigns.map((c) => (
            <div className="campaign-card" key={c.id} onClick={() => navigate('campaigns')}>
              <div className="card-top">
                <Badge value={c.status} />
                <span className="card-id">CMP-{String(c.id).padStart(4, '0')}</span>
              </div>
              <h3 className="card-title">{c.title}</h3>
              <p className="card-desc">{c.description || 'No description provided.'}</p>
              <div className="card-bottom">
                <span>View Details</span>
                <ExternalLink size={13} />
              </div>
            </div>
          ))}
          {!data.recent_campaigns.length && <Empty text="No campaigns available for your account." />}
        </div>
      </div>
    </div>
  );
}
