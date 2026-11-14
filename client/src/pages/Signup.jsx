import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ organizationName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    const local = {};
    if (form.password.length < 8) local.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) local.confirm = 'Passwords don’t match.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await signup({ email: form.email, password: form.password, organizationName: form.organizationName });
      navigate('/');
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (k, label, type = 'text', extra = {}) => (
    <label>{label}
      <input type={type} required value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...extra} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Create your StockFlow account</h1>
        {error && <p className="alert" role="alert">{error}</p>}
        {field('organizationName', 'Organization name', 'text', { placeholder: 'My Test Store', autoFocus: true })}
        {field('email', 'Email', 'email')}
        {field('password', 'Password', 'password')}
        {field('confirm', 'Confirm password', 'password')}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="alt">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
