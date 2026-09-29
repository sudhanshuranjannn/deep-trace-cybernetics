import { useEffect, useState, type FormEvent } from 'react';
import { Activity, ArrowLeft, Check, ChevronRight, Pencil, Plus, Radio, RefreshCw, Trash2, UserPlus, X, ShieldAlert } from 'lucide-react';
import { api, write, type Audit, type Campaign, type Page, type SecurityEvent, type User } from './api';
import { Badge, date, Empty, ErrorBox, Loading, Modal, Pagination, SearchBox, time } from './components';
import type { View } from './App';

type RecordItem = Campaign & SecurityEvent & User & Audit;
type FormValues = Record<string, string>;

const campaignStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const eventStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED'];
const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const roles = ['ADMIN', 'MANAGER', 'USER'];

const config = {
  campaigns: {
    title: 'Campaigns',
    subtitle: 'Plan, coordinate, and track operational security initiatives.',
    path: '/campaigns',
    create: 'New Campaign',
    sectionTag: 'SECURITY OPERATIONS',
  },
  events: {
    title: 'Security Events',
    subtitle: 'Triage threat signals, investigate alerts, and track resolutions.',
    path: '/security-events',
    create: 'Report Event',
    sectionTag: 'THREAT TELEMETRY',
  },
  users: {
    title: 'Team Members',
    subtitle: 'Manage user access, role assignments, and workspace accounts.',
    path: '/users',
    create: 'Add Member',
    sectionTag: 'IAM & GOVERNANCE',
  },
  audit: {
    title: 'Audit Logs',
    subtitle: 'Immutable ledger of all administrative and data actions.',
    path: '/audit-logs',
    create: '',
    sectionTag: 'COMPLIANCE & TRACEABILITY',
  },
};

function SelectOptions({ values }: { values: string[] }) {
  return (
    <>
      {values.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll('_', ' ')}
        </option>
      ))}
    </>
  );
}

export default function RecordsPage({ view, user }: { view: Exclude<View, 'overview'>; user: User }) {
  const settings = config[view];
  const [data, setData] = useState<Page<RecordItem> | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState('desc');
  const [refresh, setRefresh] = useState(0);

  const [editor, setEditor] = useState<RecordItem | 'new' | null>(null);
  const [detail, setDetail] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<RecordItem | null>(null);
  const [notice, setNotice] = useState('');

  const canWrite = user.role !== 'USER' && view !== 'audit' && (view !== 'users' || user.role === 'ADMIN');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    const params = new URLSearchParams({
      q: search,
      page: String(page),
      page_size: '10',
      order,
    });
    if (filter) params.set(view === 'users' ? 'role' : 'status', filter);
    if (severity) params.set('severity', severity);

    api<Page<RecordItem>>(`${settings.path}?${params}`)
      .then((d) => {
        if (active) {
          if (page > 1 && !d.items.length && d.total > 0) {
            setPage(Math.ceil(d.total / 10));
          } else {
            setData(d);
          }
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [settings.path, search, page, filter, severity, order, refresh, view]);

  function updated(message = 'Changes saved successfully.') {
    setEditor(null);
    setDeleting(null);
    setRefresh((n) => n + 1);
    setNotice(message);
  }

  return (
    <div className="records-page">
      {/* Header */}
      <div className="page-heading">
        <div className="heading-left">
          <span className="eyebrow-tag">{settings.sectionTag}</span>
          <h1>{settings.title}</h1>
          <p>{settings.subtitle}</p>
        </div>
        {canWrite && settings.create && (
          <div className="heading-right">
            <button className="btn-primary" onClick={() => setEditor('new')}>
              <Plus size={16} /> {settings.create}
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="notice-banner" role="status">
          <Check size={16} className="text-emerald" />
          <span>{notice}</span>
          <button className="btn-icon" aria-label="Dismiss notification" onClick={() => setNotice('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Panel */}
      <div className="panel">
        {/* Filter Bar */}
        <div className="toolbar">
          <div className="toolbar-search">
            <SearchBox value={q} onChange={setQ} placeholder={`Filter ${settings.title.toLowerCase()}…`} />
          </div>

          <div className="toolbar-filters">
            {view !== 'audit' && (
              <select
                aria-label={view === 'users' ? 'Filter by role' : 'Filter by status'}
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All {view === 'users' ? 'Roles' : 'Statuses'}</option>
                <SelectOptions
                  values={view === 'campaigns' ? campaignStatuses : view === 'events' ? eventStatuses : roles}
                />
              </select>
            )}

            {view === 'events' && (
              <select
                aria-label="Filter by severity"
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Severities</option>
                <SelectOptions values={severities} />
              </select>
            )}

            <select
              aria-label="Sort order"
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                setPage(1);
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>

            <button
              className="btn-icon bordered"
              aria-label="Refresh records"
              title="Refresh"
              onClick={() => setRefresh((n) => n + 1)}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <ErrorBox message={error} />

        {busy ? (
          <Loading />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  {(view === 'campaigns'
                    ? ['CAMPAIGN', 'STATUS', 'CREATED', 'ACTIONS']
                    : view === 'events'
                    ? ['EVENT TYPE & DETAILS', 'SEVERITY', 'STATUS', 'TIMESTAMP', 'ACTIONS']
                    : view === 'users'
                    ? ['MEMBER', 'ROLE', 'STATUS', 'JOINED', 'ACTIONS']
                    : ['ACTION', 'ACTOR', 'RESOURCE', 'TIMESTAMP']
                  ).map((h) => (
                    <th key={h} className={h === 'ACTIONS' ? 'th-action' : ''}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr key={row.id}>
                    {view === 'campaigns' ? (
                      <>
                        <td>
                          <button className="table-row-title-btn" onClick={() => setDetail(row.id)}>
                            <div className="table-item-primary">
                              <strong>{row.title}</strong>
                              <small>CMP-{String(row.id).padStart(4, '0')}</small>
                            </div>
                          </button>
                        </td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td className="text-muted">{date(row.created_at)}</td>
                        <td className="td-action">
                          <div className="row-action-group">
                            <button
                              className="btn-icon"
                              title="Inspect Campaign"
                              aria-label={`View ${row.title}`}
                              onClick={() => setDetail(row.id)}
                            >
                              <ChevronRight size={16} />
                            </button>
                            {canWrite && (
                              <button
                                className="btn-icon"
                                title="Edit Campaign"
                                aria-label={`Edit ${row.title}`}
                                onClick={() => setEditor(row)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {user.role === 'ADMIN' && (
                              <button
                                className="btn-icon text-danger"
                                title="Delete Campaign"
                                aria-label={`Delete ${row.title}`}
                                onClick={() => setDeleting(row)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    ) : view === 'events' ? (
                      <>
                        <td>
                          <div className="table-item-primary">
                            <strong>{row.event_type}</strong>
                            <small className="desc-truncate" title={row.description}>
                              {row.description}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge value={row.severity} />
                        </td>
                        <td>
                          <Badge value={row.status} />
                        </td>
                        <td className="text-muted">{time(row.created_at)}</td>
                        <td className="td-action">
                          <button
                            className="btn-icon"
                            aria-label={`${canWrite ? 'Edit' : 'View'} ${row.event_type}`}
                            title={canWrite ? 'Edit Event' : 'View Event'}
                            onClick={() => setEditor(row)}
                          >
                            {canWrite ? <Pencil size={15} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                      </>
                    ) : view === 'users' ? (
                      <>
                        <td>
                          <div className="member-cell">
                            <div className="avatar-chip">
                              {row.name
                                .split(' ')
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div>
                              <strong>
                                {row.name}
                                {row.id === user.id && <span className="you-pill">You</span>}
                              </strong>
                              <small>{row.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge value={row.role} />
                        </td>
                        <td>
                          <Badge value={row.is_active ? 'ENABLED' : 'DISABLED'} />
                        </td>
                        <td className="text-muted">{date(row.created_at)}</td>
                        <td className="td-action">
                          {canWrite && (
                            <button
                              className="btn-icon"
                              aria-label={`Edit ${row.name}`}
                              title="Edit Member"
                              onClick={() => setEditor(row)}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          <span className="audit-action-tag">{row.action.replaceAll('_', ' ')}</span>
                        </td>
                        <td>
                          <b>{row.actor}</b>
                        </td>
                        <td className="text-muted">{row.resource}</td>
                        <td className="text-muted">{time(row.created_at)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items.length && !error && <Empty />}
          </div>
        )}

        {data && <Pagination page={page} total={data.total} onChange={setPage} />}
      </div>

      {/* Editor Modal */}
      {editor && (
        <Editor
          view={view}
          row={editor === 'new' ? null : editor}
          canWrite={canWrite}
          onClose={() => setEditor(null)}
          onSaved={() => updated()}
        />
      )}

      {/* Campaign Details & Membership Modal */}
      {detail !== null && (
        <CampaignDetail
          id={detail}
          canWrite={canWrite}
          onClose={() => setDetail(null)}
          onChanged={() => setRefresh((n) => n + 1)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <DeleteDialog
          row={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => updated('Campaign deleted. Audit history has been preserved.')}
        />
      )}
    </div>
  );
}

function Editor({
  view,
  row,
  canWrite,
  onClose,
  onSaved,
}: {
  view: Exclude<View, 'overview'>;
  row: RecordItem | null;
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editing = Boolean(row);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget)) as FormValues;
    const body: Record<string, unknown> = { ...values };

    if (view === 'users' && editing) {
      body.is_active = values.is_active === 'true';
      if (!body.password) delete body.password;
    }

    try {
      await write(`${config[view].path}${row ? `/${row.id}` : ''}`, row ? 'PATCH' : 'POST', body);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const statuses = row
    ? row.status === 'DRAFT'
      ? ['DRAFT', 'ACTIVE', 'CANCELLED']
      : row.status === 'ACTIVE'
      ? ['ACTIVE', 'COMPLETED', 'CANCELLED']
      : [row.status]
    : [];

  const eventTransitions = row
    ? row.status === 'OPEN'
      ? eventStatuses
      : row.status === 'INVESTIGATING'
      ? ['INVESTIGATING', 'RESOLVED']
      : ['RESOLVED']
    : [];

  return (
    <Modal
      title={`${canWrite ? (editing ? 'Edit' : 'Create') : 'View'} ${
        view === 'users' ? 'Team Member' : view === 'events' ? 'Security Event' : 'Campaign'
      }`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="auth-form">
        <fieldset disabled={!canWrite || busy}>
          {view === 'campaigns' ? (
            <>
              <label>
                Campaign Title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={160}
                  defaultValue={row?.title}
                  placeholder="e.g. Q3 SOC Perimeter Assessment"
                />
              </label>
              <label>
                Description & Objectives
                <textarea
                  name="description"
                  rows={4}
                  maxLength={5000}
                  defaultValue={row?.description}
                  placeholder="Scope, expected outcomes, and remediation targets"
                />
              </label>
              {editing && (
                <label>
                  Campaign Status
                  <select name="status" defaultValue={row?.status}>
                    <SelectOptions values={statuses} />
                  </select>
                </label>
              )}
            </>
          ) : view === 'events' ? (
            <>
              <label>
                Event Type
                {editing ? (
                  <input value={row?.event_type} disabled />
                ) : (
                  <input
                    name="event_type"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder="e.g. Anomalous Privilege Elevation"
                  />
                )}
              </label>
              <label>
                Severity Level
                <select name="severity" defaultValue={row?.severity || 'MEDIUM'}>
                  <SelectOptions values={severities} />
                </select>
              </label>
              <label>
                Description & Impact
                <textarea
                  name="description"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={4}
                  defaultValue={row?.description}
                  placeholder="Affected infrastructure, IP addresses, and observed anomalies"
                />
              </label>
              {editing && (
                <label>
                  Incident Status
                  <select name="status" defaultValue={row?.status}>
                    <SelectOptions values={eventTransitions} />
                  </select>
                </label>
              )}
            </>
          ) : (
            <>
              <label>
                Full Name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  defaultValue={row?.name}
                  placeholder="Alex Rivera"
                />
              </label>
              {!editing && (
                <label>
                  Email Address
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="user@organization.test"
                  />
                </label>
              )}
              <label>
                Role Assignment
                <select name="role" defaultValue={row?.role || 'USER'}>
                  <SelectOptions values={roles} />
                </select>
              </label>
              {editing && (
                <label>
                  Account Status
                  <select name="is_active" defaultValue={String(row?.is_active)}>
                    <option value="true">Enabled (Active Access)</option>
                    <option value="false">Disabled (Revoked Access)</option>
                  </select>
                </label>
              )}
              <label>
                {editing ? 'New Password (Optional)' : 'Initial Password'}
                <input
                  name="password"
                  type="password"
                  required={!editing}
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder={editing ? 'Leave blank to preserve current password' : 'Minimum 12 characters'}
                />
              </label>
            </>
          )}
        </fieldset>

        <ErrorBox message={error} />

        <div className="modal-actions-bar">
          <button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>
            {canWrite ? 'Cancel' : 'Close'}
          </button>
          {canWrite && (
            <button className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Record'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}

function DeleteDialog({ row, onClose, onDeleted }: { row: Campaign; onClose: () => void; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setBusy(true);
    try {
      await write(`/campaigns/${row.id}`, 'DELETE');
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Delete Campaign" onClose={onClose}>
      <div className="delete-dialog-body">
        <div className="delete-warning-icon">
          <ShieldAlert size={28} className="text-danger" />
        </div>
        <p>
          Are you sure you want to delete <b>“{row.title}”</b>?
        </p>
        <p className="modal-desc">
          Campaign record and its analyst assignments will be permanently removed. The immutable audit trail will be
          preserved for compliance.
        </p>
      </div>

      <ErrorBox message={error} />

      <div className="modal-actions-bar">
        <button className="btn-secondary" disabled={busy} onClick={onClose}>
          Keep Campaign
        </button>
        <button className="btn-danger" disabled={busy} onClick={remove}>
          {busy ? 'Deleting…' : 'Delete Campaign'}
        </button>
      </div>
    </Modal>
  );
}

function CampaignDetail({
  id,
  canWrite,
  onClose,
  onChanged,
}: {
  id: number;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [people, setPeople] = useState<Page<User> | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    api<Campaign>(`/campaigns/${id}`)
      .then((c) => {
        if (active) setCampaign(c);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, version]);

  useEffect(() => {
    if (!canWrite) return;
    let active = true;
    const timer = setTimeout(() => {
      api<Page<User>>(`/users?active=true&page=${page}&page_size=5&q=${encodeURIComponent(q)}`)
        .then((p) => {
          if (active) setPeople(p);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q, page, canWrite, version]);

  async function membership(userId: number, remove: boolean) {
    setBusy(true);
    setError('');
    try {
      await write(
        `/campaigns/${id}/members${remove ? `/${userId}` : ''}`,
        remove ? 'DELETE' : 'POST',
        remove ? undefined : { user_id: userId }
      );
      setVersion((v) => v + 1);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Campaign Details" onClose={onClose}>
      <ErrorBox message={error} />
      {!campaign ? (
        <Loading />
      ) : (
        <div className="campaign-detail-content">
          <div className="detail-meta-strip">
            <Badge value={campaign.status} />
            <span className="text-muted">CMP-{String(campaign.id).padStart(4, '0')}</span>
            <span className="text-muted">· Created {date(campaign.created_at)}</span>
          </div>

          <h2 className="detail-title">{campaign.title}</h2>
          <p className="detail-description">{campaign.description || 'No description provided.'}</p>

          <div className="detail-members-section">
            <div className="section-sub-header">
              <h3>Assigned Team Members</h3>
              <span className="count-tag">{campaign.members?.length || 0}</span>
            </div>

            {campaign.members?.length ? (
              <div className="members-list">
                {campaign.members.map((m) => (
                  <div className="member-list-item" key={m.id}>
                    <div className="avatar-chip">{m.name.charAt(0).toUpperCase()}</div>
                    <div className="member-item-info">
                      <strong>{m.name}</strong>
                      <small>{m.email}</small>
                    </div>
                    <Badge value={m.role} />
                    {canWrite && (
                      <button
                        className="btn-icon text-danger"
                        disabled={busy}
                        aria-label={`Remove ${m.name}`}
                        title="Remove member"
                        onClick={() => membership(m.id, true)}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No members assigned yet.</p>
            )}

            {canWrite && (
              <div className="member-assign-box">
                <h4>Assign Additional Member</h4>
                <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search active users…" />
                <div className="assign-candidate-list">
                  {people?.items.map((p) => {
                    const isAssigned = campaign.members?.some((m) => m.id === p.id);
                    return (
                      <div className="assign-candidate-item" key={p.id}>
                        <div>
                          <strong>{p.name}</strong>
                          <small>{p.email}</small>
                        </div>
                        <button
                          className="btn-secondary btn-sm"
                          disabled={busy || isAssigned}
                          onClick={() => membership(p.id, false)}
                        >
                          {isAssigned ? <Check size={13} /> : <UserPlus size={13} />}
                          <span>{isAssigned ? 'Assigned' : 'Assign'}</span>
                        </button>
                      </div>
                    );
                  })}
                  {people && !people.items.length && <Empty text="No matching users found." />}
                  {people && <Pagination page={page} total={people.total} size={5} onChange={setPage} />}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions-bar">
            <button className="btn-secondary" onClick={onClose}>
              <ArrowLeft size={15} /> Back to Campaigns
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
