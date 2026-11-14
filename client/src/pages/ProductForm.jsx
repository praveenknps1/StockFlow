import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';

const EMPTY = { name: '', sku: '', description: '', quantityOnHand: 0, costPrice: '', sellingPrice: '', lowStockThreshold: '' };

export default function ProductForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/products/${id}`)
      .then(({ product: p }) =>
        setForm({
          name: p.name, sku: p.sku, description: p.description || '', quantityOnHand: p.quantityOnHand,
          costPrice: p.costPrice ?? '', sellingPrice: p.sellingPrice ?? '', lowStockThreshold: p.lowStockThreshold ?? '',
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);
    try {
      await api(editing ? `/products/${id}` : '/products', { method: editing ? 'PUT' : 'POST', body: form });
      navigate('/products');
    } catch (err) {
      setErrors(err.fields || {});
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (k, label, props = {}, hint) => (
    <label>{label}
      <input value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {hint && !errors[k] && <span className="hint">{hint}</span>}
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  if (loading) return <p className="page-note">Loading…</p>;

  return (
    <>
      <header className="page-head"><h1>{editing ? 'Edit product' : 'Add product'}</h1></header>
      <form className="panel form" onSubmit={submit} noValidate>
        {error && <p className="alert" role="alert">{error}</p>}
        <div className="grid2">
          {field('name', 'Name', { autoFocus: !editing })}
          {field('sku', 'SKU', {}, 'Must be unique in your organization.')}
        </div>
        <label>Description (optional)
          <textarea rows={3} value={form.description} onChange={set('description')} />
        </label>
        <div className="grid3">
          {field('quantityOnHand', 'Quantity on hand', { type: 'number', min: 0, step: 1 })}
          {field('costPrice', 'Cost price', { type: 'number', min: 0, step: '0.01' })}
          {field('sellingPrice', 'Selling price', { type: 'number', min: 0, step: '0.01' })}
        </div>
        {field('lowStockThreshold', 'Low stock threshold', { type: 'number', min: 0, step: 1, placeholder: 'Use default' }, 'Leave empty to use the default from Settings.')}
        <div className="row-end">
          <Link className="btn" to="/products">Cancel</Link>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
        </div>
      </form>
    </>
  );
}
