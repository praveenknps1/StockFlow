import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Settings() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('/settings').then((d) => setValue(d.defaultLowStockThreshold)).catch((e) => setError(e.message));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError(''); setFieldError(''); setSaved(false);
    try {
      await api('/settings', { method: 'PUT', body: { defaultLowStockThreshold: value } });
      setSaved(true);
    } catch (err) {
      setError(err.message);
      setFieldError(err.fields?.defaultLowStockThreshold || '');
    }
  }

  return (
    <>
      <header className="page-head"><h1>Settings</h1></header>
      <form className="panel form narrow" onSubmit={submit} noValidate>
        {error && <p className="alert" role="alert">{error}</p>}
        {saved && <p className="success" role="status">Settings saved.</p>}
        <label>Default low stock threshold
          <input type="number" min="0" step="1" value={value} onChange={(e) => { setValue(e.target.value); setSaved(false); }} aria-invalid={!!fieldError} />
          {fieldError ? <span className="field-error">{fieldError}</span> : <span className="hint">Products without their own threshold are flagged when quantity is at or below this number.</span>}
        </label>
        <div className="row-end"><button className="btn primary">Save settings</button></div>
      </form>
    </>
  );
}
