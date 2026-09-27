import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const EMPTY = {
  title: '',
  description: '',
  category_id: '',
  condition: 'good',
  max_days: 3,
  pickup_area: '',
  image_url: '',
};

export default function ItemForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/items/${id}`)
      .then((res) => {
        const item = res.data.data;
        setForm({
          title: item.title,
          description: item.description || '',
          category_id: item.category_id,
          condition: item.condition,
          max_days: item.max_days,
          pickup_area: item.pickup_area || '',
          image_url: item.image_url || '',
        });
      })
      .catch(() => setError('Could not load this item.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/items/${id}`, form);
        showToast('Item updated.');
      } else {
        await api.post('/items', form);
        showToast('Item listed!');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this item.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div className="page auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit item' : 'Add an item'}</h1>
        <label>
          Title
          <input value={form.title} onChange={update('title')} required />
        </label>
        <label>
          Description
          <textarea rows={3} value={form.description} onChange={update('description')} />
        </label>
        <label>
          Category
          <select value={form.category_id} onChange={update('category_id')} required>
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Condition
          <select value={form.condition} onChange={update('condition')}>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </label>
        <label>
          Max lending days
          <input type="number" min={1} value={form.max_days} onChange={update('max_days')} required />
        </label>
        <label>
          Pickup area
          <input value={form.pickup_area} onChange={update('pickup_area')} placeholder="e.g. Block B" />
        </label>
        <label>
          Image URL (optional)
          <input value={form.image_url} onChange={update('image_url')} placeholder="https://..." />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'List item'}
        </button>
      </form>
    </div>
  );
}
