import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ItemCard from '../components/ItemCard';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (from) params.from = from;
    if (to) params.to = to;
    params.page = page;

    api
      .get('/items', { params })
      .then((res) => {
        setItems(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError('Could not load items. Please try again.'))
      .finally(() => setLoading(false));
  }, [search, category, from, to, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  }

  return (
    <div className="page">
      <section className="hero">
        <h1>Borrow what you need. Lend what you don't.</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search tools & gadgets..."
            defaultValue={search}
            onKeyDown={(e) => e.key === 'Enter' && updateParam('search', e.target.value)}
          />
          <input type="date" value={from} onChange={(e) => updateParam('from', e.target.value)} title="From" />
          <input type="date" value={to} onChange={(e) => updateParam('to', e.target.value)} title="To" />
          <select value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="browse-layout">
        <aside className="filters">
          <h3>Filters</h3>
          <div className="filter-group">
            <label>Category</label>
            {categories.map((c) => (
              <label key={c.id} className="checkbox-row">
                <input
                  type="radio"
                  name="category"
                  checked={String(category) === String(c.id)}
                  onChange={() => updateParam('category', c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
          <button className="link-btn" onClick={clearFilters}>
            Clear filters
          </button>
        </aside>

        <main className="results">
          <div className="results-header">
            <h2>{meta.total ?? items.length} items found</h2>
            {from && to && <span className="badge-available">Free on {from} – {to}</span>}
          </div>

          {loading && (
            <div className="skeleton-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-card" />
              ))}
            </div>
          )}

          {!loading && error && <p className="form-error">{error}</p>}

          {!loading && !error && items.length === 0 && (
            <p className="muted">No items found. Try clearing your filters.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <div className="item-grid">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
              <div className="pagination">
                <button disabled={Number(page) <= 1} onClick={() => goToPage(Number(page) - 1)}>
                  ‹
                </button>
                <span>
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button disabled={Number(page) >= meta.totalPages} onClick={() => goToPage(Number(page) + 1)}>
                  ›
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
