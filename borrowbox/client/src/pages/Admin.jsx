import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const TABS = ['Overview', 'Users', 'Categories'];

export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  function loadAll() {
    setLoading(true);
    Promise.all([api.get('/admin/stats'), api.get('/admin/users'), api.get('/categories')])
      .then(([statsRes, usersRes, catRes]) => {
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data);
        setCategories(catRes.data.data);
      })
      .catch(() => showToast('Could not load admin data.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  async function toggleUser(user) {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
      showToast(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not update user.', 'error');
    }
  }

  async function addCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/categories', { name: newCategory.trim() });
      setNewCategory('');
      showToast('Category added.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add category.', 'error');
    }
  }

  async function renameCategory(cat) {
    const name = prompt('New category name', cat.name);
    if (!name || name === cat.name) return;
    try {
      await api.put(`/categories/${cat.id}`, { name });
      showToast('Category renamed.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not rename category.', 'error');
    }
  }

  async function deleteCategory(cat) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      showToast('Category deleted.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete category.', 'error');
    }
  }

  if (loading) return <div className="page-loading">Loading admin panel…</div>;

  return (
    <div className="page">
      <h1>Admin Panel</h1>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && stats && (
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-label">Total users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.total_items}</span>
            <span className="stat-label">Total items</span>
          </div>
          {stats.bookings_by_status.map((s) => (
            <div className="stat-card" key={s.status}>
              <span className="stat-value">{s.count}</span>
              <span className="stat-label">{s.status}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'Users' && (
        <div className="list-panel">
          {users.map((u) => (
            <div key={u.id} className="list-row">
              <div>
                <strong>{u.name}</strong> {u.role === 'admin' && <span className="tag">admin</span>}
                <p className="muted">{u.email} · {u.area || 'No area set'}</p>
              </div>
              <div className="row-actions">
                <span className={u.is_active ? 'badge-available' : 'tag'}>{u.is_active ? 'Active' : 'Deactivated'}</span>
                {u.role !== 'admin' && (
                  <button className="btn btn-ghost" onClick={() => toggleUser(u)}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Categories' && (
        <div>
          <form className="inline-form" onSubmit={addCategory}>
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" />
            <button className="btn btn-primary" type="submit">
              Add
            </button>
          </form>
          <div className="list-panel">
            {categories.map((c) => (
              <div key={c.id} className="list-row">
                <strong>{c.name}</strong>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => renameCategory(c)}>
                    Rename
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteCategory(c)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
