import { Activity, ShieldCheck, Lock, Radio, Server, CheckCircle2 } from 'lucide-react';

export default function SecurityIllustration() {
  return (
    <div className="preview-console" aria-label="Security platform preview">
      {/* Console Header Bar */}
      <div className="preview-header">
        <div className="preview-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-title">
          <Lock size={12} />
          <span>tenant-isolation :: live_session [AES-256]</span>
        </div>
        <div className="preview-status">
          <span className="live-dot" />
          <span>ENCRYPTED</span>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="preview-body">
        {/* Top Metric Strip */}
        <div className="preview-stats">
          <div className="preview-stat-card">
            <span className="stat-label">Tenant Isolation</span>
            <div className="stat-val">
              <ShieldCheck size={16} className="text-emerald" />
              <span>Enforced</span>
            </div>
            <span className="stat-sub">Strict RBAC boundaries</span>
          </div>
          <div className="preview-stat-card">
            <span className="stat-label">Active Monitoring</span>
            <div className="stat-val">
              <Radio size={16} className="text-slate" />
              <span>24/7 Live</span>
            </div>
            <span className="stat-sub">4 active campaigns</span>
          </div>
          <div className="preview-stat-card">
            <span className="stat-label">System Health</span>
            <div className="stat-val">
              <Server size={16} className="text-slate" />
              <span>99.98%</span>
            </div>
            <span className="stat-sub">0 open vulnerabilities</span>
          </div>
        </div>

        {/* Live Stream Mockup */}
        <div className="preview-stream">
          <div className="stream-header">
            <span>REAL-TIME AUDIT & INCIDENT LOG</span>
            <span>SCOPED: TENANT_ACME</span>
          </div>
          <div className="stream-rows">
            <div className="stream-row">
              <span className="stream-time">19:24:02</span>
              <span className="stream-badge tag-low">RESOLVED</span>
              <span className="stream-msg">Security Event #0042: Anomalous token refresh verified</span>
              <CheckCircle2 size={14} className="stream-icon text-emerald" />
            </div>
            <div className="stream-row">
              <span className="stream-time">19:21:40</span>
              <span className="stream-badge tag-info">CAMPAIGN</span>
              <span className="stream-msg">SOC Initiative Q3: Assigned 3 analysts to perimeter audit</span>
              <Activity size={14} className="stream-icon text-slate" />
            </div>
            <div className="stream-row">
              <span className="stream-time">19:15:11</span>
              <span className="stream-badge tag-info">SESSION</span>
              <span className="stream-msg">Administrator authentication verified with multi-tenant token</span>
              <ShieldCheck size={14} className="stream-icon text-slate" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
