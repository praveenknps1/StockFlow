import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api.js';

export default function Products() {
  const [products, setProducts] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [adjusting, setAdjusting] = useState(null); // product being adjusted
  const [adj, setAdj] = useState({ delta: '', note: '' });
  const [adjError, setAdjError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/products?search=${encodeURIComponent(search)}`)
        .then((d) => setProducts(d.products))
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  async function remove(p) {
    if (!window.confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    try {
      await api(`/products/${p._id}`, { method: 'DELETE' });
      setProducts((list) => list.filter((x) => x._id !== p._id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitAdjust(e) {
    e.preventDefault();
    setAdjError('');
    try {
      const d = await api(`/products/${adjusting._id}/adjust`, { method: 'PATCH', body: { delta: adj.delta, note: adj.note } });
      setProducts((list) => list.map((x) => (x._id === d.product._id ? d.product : x)));
      setAdjusting(null);
    } catch (err) {
      setAdjError(err.message);
    }
  }

  return (
    <>
      <header className="page-head">
        <h1>Products</h1>
        <Link className="btn primary" to="/products/new">Add product</Link>
      </header>

      <input
        className="search"
        type="search"
        placeholder="Search by name or SKU"
        aria-label="Search products"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <p className="alert" role="alert">{error}</p>}

      {!products ? (
        <p className="page-note">Loading…</p>
      ) : products.length === 0 ? (
        <p className="empty">{search ? `No products match “${search}”.` : 'No products yet. Add your first product to start tracking stock.'}</p>
      ) : (
        <div className="table-wrap panel">
          <table>
            <thead>
              <tr><th>Name</th><th>SKU</th><th className="r">Quantity</th><th>Stock</th><th className="r">Selling price</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td className="sku">{p.sku}</td>
                  <td className="r">{p.quantityOnHand}</td>
                  <td>{p.isLowStock ? <span className="badge low">Low stock</span> : <span className="badge ok">In stock</span>}</td>
                  <td className="r">{money(p.sellingPrice)}</td>
                  <td className="actions">
                    <button className="link" onClick={() => { setAdjusting(p); setAdj({ delta: '', note: '' }); setAdjError(''); }}>Adjust</button>
                    <Link to={`/products/${p._id}/edit`}>Edit</Link>
                    <button className="link danger" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjusting && (
        <div className="overlay" onClick={() => setAdjusting(null)}>
          <form className="dialog" onSubmit={submitAdjust} onClick={(e) => e.stopPropagation()}>
            <h2>Adjust stock</h2>
            <p className="hint">{adjusting.name} · {adjusting.quantityOnHand} on hand</p>
            {adjError && <p className="alert" role="alert">{adjError}</p>}
            <label>Change in units
              <input type="number" step="1" required autoFocus placeholder="+10 or -3" value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value })} />
            </label>
            <label>Note (optional)
              <input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} placeholder="e.g. Received shipment" />
            </label>
            <div className="row-end">
              <button type="button" className="btn" onClick={() => setAdjusting(null)}>Cancel</button>
              <button className="btn primary">Update stock</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
