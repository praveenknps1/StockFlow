import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">StockFlow</div>
        <p className="org">{user.organization.name}</p>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="rail-foot">
          <span className="email">{user.email}</span>
          <button className="link" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
