import { useState, type FormEvent } from 'react';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { write } from './api';
import { ErrorBox } from './components';

export type CreatedOrganization = { tenant: { name: string; slug: string }; email: string };

export default function OrganizationForm({ onCreated }: { onCreated: (result: CreatedOrganization) => void }) {
  const [slug, setSlug] = useState('');
  const [editedSlug, setEditedSlug] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (values.password !== values.confirm_password) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    delete values.confirm_password;
    setBusy(true);
    try {
      onCreated(await write<CreatedOrganization>('/organizations', 'POST', values));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="form-section-header">
        <Building2 size={15} />
        <span>Organization Information</span>
      </div>

      <label>
        Organization Name
        <input
          name="organization_name"
          autoComplete="organization"
          placeholder="Apex Cybersecurity"
          minLength={2}
          maxLength={120}
          required
          onChange={(e) => {
            if (!editedSlug) {
              setSlug(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-|-$/g, '')
                  .slice(0, 80)
              );
            }
          }}
        />
      </label>

      <label>
        Workspace Slug / ID
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setEditedSlug(true);
            setSlug(e.target.value.toLowerCase());
          }}
          placeholder="apex-cybersecurity"
          minLength={2}
          maxLength={80}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          autoCapitalize="none"
          spellCheck={false}
        />
        <small>Unique workspace identifier (lowercase letters, digits, and hyphens).</small>
      </label>

      <div className="form-section-header">
        <CheckCircle2 size={15} />
        <span>Primary Administrator Account</span>
      </div>

      <div className="form-grid-2">
        <label>
          Full Name
          <input name="name" placeholder="John Doe" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label>
          Email Address
          <input name="email" type="email" placeholder="admin@apex.test" autoComplete="email" required maxLength={254} />
        </label>
      </div>

      <label>
        Admin Password
        <div className="password-input-group">
          <input
            name="password"
            type={visible ? 'text' : 'password'}
            placeholder="At least 12 characters"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
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

      <label>
        Confirm Password
        <input
          name="confirm_password"
          type="password"
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>

      <ErrorBox message={error} />

      <p className="form-footnote">
        This user will be registered as the root ADMIN of the new workspace. Additional team members can be added
        afterwards.
      </p>

      <button className="btn-primary btn-block" disabled={busy}>
        {busy ? 'Creating Workspace…' : 'Create Organization'}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
