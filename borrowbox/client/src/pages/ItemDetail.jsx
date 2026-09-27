import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import BookingForm from '../components/BookingForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    Promise.all([api.get(`/items/${id}`), api.get(`/items/${id}/availability`)])
      .then(([itemRes, availRes]) => {
        setItem(itemRes.data.data);
        setBookedRanges(availRes.data.data);
      })
      .catch(() => setError('This item could not be found.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleBookingSubmit(payload) {
    if (!user) {
      navigate('/login', { state: { from: `/items/${id}` } });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/bookings', payload);
      showToast('Borrow request sent!');
      navigate('/dashboard');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not send request.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">Loading item…</div>;
  if (error || !item) return <div className="page"><p className="form-error">{error}</p></div>;

  const isOwner = user && user.id === item.owner_id;

  let disabledReason = null;
  if (!item.is_active) disabledReason = 'This item is currently unavailable.';
  else if (isOwner) disabledReason = 'This is your own item — you can edit it from your Dashboard.';

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/">Browse</Link> / {item.category_name} / {item.title}
      </p>

      <div className="item-detail-layout">
        <div>
          <div className="item-detail-image">{item.title.slice(0, 1).toUpperCase()}</div>
          <h1>{item.title}</h1>
          <div className="tag-row">
            <span className="tag">{item.category_name}</span>
            <span className="tag">Condition: {item.condition}</span>
            <span className="tag">Max {item.max_days} days</span>
          </div>
          <p>{item.description}</p>

          <div className="owner-card">
            <div className="avatar">{item.owner_name.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{item.owner_name}</strong>
              <p className="muted">Item owner · Pickup area: {item.pickup_area || 'Not specified'}</p>
              <p className="muted">★ {Number(item.owner_rating).toFixed(1)} · {item.owner_review_count} reviews</p>
            </div>
            <Link to={`/profile/${item.owner_id}`} className="btn btn-ghost">
              View profile
            </Link>
          </div>

          {isOwner && (
            <Link to={`/items/${item.id}/edit`} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Edit item
            </Link>
          )}
        </div>

        <aside className="booking-panel">
          <BookingForm
            item={item}
            bookedRanges={bookedRanges}
            onSubmit={handleBookingSubmit}
            submitting={submitting}
            disabledReason={disabledReason}
          />
          {bookedRanges.length > 0 && (
            <div className="booked-ranges">
              <h4>Already booked</h4>
              <ul>
                {bookedRanges.map((r, i) => (
                  <li key={i}>
                    {r.start_date.slice(0, 10)} – {r.end_date.slice(0, 10)} ({r.status})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
