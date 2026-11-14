import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="page-note">Loading…</p>;

  return (
    <>
      <header className="page-head"><h1>Dashboard</h1></header>

      <section className="stats">
        <div className="stat"><span className="num">{data.totalProducts}</span><span>Products</span></div>
        <div className="stat"><span className="num">{data.totalUnits.toLocaleString()}</span><span>Units on hand</span></div>
        <div className={`stat ${data.lowStockCount ? 'warn' : ''}`}><span className="num">{data.lowStockCount}</span><span>Low stock</span></div>
      </section>

      <section className="panel">
        <h2>Low stock items</h2>
        {data.totalProducts === 0 ? (
          <p className="empty">No products yet. <Link to="/products/new">Add your first product</Link> to start tracking stock.</p>
        ) : data.lowStock.length === 0 ? (
          <p className="empty">Every product is above its low stock threshold.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>SKU</th><th className="r">On hand</th><th className="r">Threshold</th><th>Level</th></tr>
              </thead>
              <tbody>
                {data.lowStock.map((p) => {
                  const pct = p.lowStockThreshold > 0 ? Math.min(100, (p.quantityOnHand / p.lowStockThreshold) * 100) : 0;
                  return (
                    <tr key={p.id}>
                      <td><Link to={`/products/${p.id}/edit`}>{p.name}</Link></td>
                      <td className="sku">{p.sku}</td>
                      <td className="r">{p.quantityOnHand}</td>
                      <td className="r">{p.lowStockThreshold}{p.usesDefaultThreshold && <span className="hint"> default</span>}</td>
                      <td>
                        <div className="gauge" role="img" aria-label={`${p.quantityOnHand} of ${p.lowStockThreshold} threshold`}>
                          <div style={{ width: `${pct}%` }} className={p.quantityOnHand === 0 ? 'out' : ''} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
