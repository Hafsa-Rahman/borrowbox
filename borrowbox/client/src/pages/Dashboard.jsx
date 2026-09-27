import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

const TABS = ['My Items', 'My Borrowings', 'Incoming Requests'];

export default function Dashboard() {
  const [tab, setTab] = useState('My Items');
  const [items, setItems] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const { showToast } = useToast();

  function loadAll() {
    setLoading(true);
    Promise.all([api.get('/items/mine'), api.get('/bookings/mine'), api.get('/bookings/incoming')])
      .then(([itemsRes, borrowRes, incomingRes]) => {
        setItems(itemsRes.data.data);
        setBorrowings(borrowRes.data.data);
        setIncoming(incomingRes.data.data);
      })
      .catch(() => showToast('Could not load your dashboard.', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  async function runAction(bookingId, action, extra = {}) {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { action, ...extra });
      showToast(`Booking ${action}d.`);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || `Could not ${action} booking.`, 'error');
    }
  }

  async function deleteItem(id) {
    try {
      const res = await api.delete(`/items/${id}`);
      showToast(res.data.message || 'Item removed.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove item.', 'error');
    } finally {
      setConfirmTarget(null);
    }
  }

  async function deleteBooking(id) {
    try {
      await api.delete(`/bookings/${id}`);
      showToast('Booking removed.');
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not remove booking.', 'error');
    } finally {
      setConfirmTarget(null);
    }
  }

  async function submitReview(bookingId, rating, comment) {
    try {
      await api.post(`/bookings/${bookingId}/reviews`, { rating, comment });
      showToast('Thanks for your review!');
      setReviewTarget(null);
      loadAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not submit review.', 'error');
    }
  }

  if (loading) return <div className="page-loading">Loading dashboard…</div>;

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/items/new" className="btn btn-primary">
          + Add item
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'My Items' && (
        <div className="list-panel">
          {items.length === 0 && <p className="muted">You haven't listed any items yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="list-row">
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.category_name} · max {item.max_days} days · {item.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div className="row-actions">
                <Link to={`/items/${item.id}/edit`} className="btn btn-ghost">
                  Edit
                </Link>
                <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'item', id: item.id, title: item.title })}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'My Borrowings' && (
        <div className="list-panel">
          {borrowings.length === 0 && <p className="muted">You haven't borrowed anything yet.</p>}
          {borrowings.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <strong>{b.item_title}</strong>
                <p className="muted">
                  {b.start_date.slice(0, 10)} – {b.end_date.slice(0, 10)}
                  {b.overdue && <span className="warn"> · OVERDUE</span>}
                </p>
                <StatusBadge status={b.status} />
              </div>
              <div className="row-actions">
                {(b.status === 'REQUESTED' || b.status === 'APPROVED') && (
                  <button className="btn btn-ghost" onClick={() => runAction(b.id, 'cancel')}>
                    Cancel
                  </button>
                )}
                {['REJECTED', 'CANCELLED'].includes(b.status) && (
                  <button className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'booking', id: b.id, title: b.item_title })}>
                    Remove
                  </button>
                )}
                {b.status === 'RETURNED' && (
                  <button className="btn btn-primary" onClick={() => setReviewTarget(b)}>
                    Leave review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Incoming Requests' && (
        <div className="list-panel">
          {incoming.length === 0 && <p className="muted">No requests on your items yet.</p>}
          {incoming.map((b) => (
            <div key={b.id} className="list-row">
              <div>
                <strong>{b.item_title}</strong>
                <p className="muted">
                  From {b.borrower_name} · {b.start_date.slice(0, 10)} – {b.end_date.slice(0, 10)}
                  {b.overdue && <span className="warn"> · OVERDUE</span>}
                </p>
                {b.message && <p className="muted">"{b.message}"</p>}
                <StatusBadge status={b.status} />
              </div>
              <div className="row-actions">
                {b.status === 'REQUESTED' && (
                  <>
                    <button className="btn btn-primary" onClick={() => runAction(b.id, 'approve')}>
                      Approve
                    </button>
                    <button className="btn btn-danger" onClick={() => runAction(b.id, 'reject')}>
                      Reject
                    </button>
                  </>
                )}
                {b.status === 'APPROVED' && (
                  <button className="btn btn-primary" onClick={() => runAction(b.id, 'pickup', { note: { condition: 'good', text: 'Handed over in good condition.' } })}>
                    Mark Picked Up
                  </button>
                )}
                {b.status === 'PICKED_UP' && (
                  <button className="btn btn-primary" onClick={() => runAction(b.id, 'return', { note: { condition: 'good', text: 'Returned in good condition.' } })}>
                    Mark Returned
                  </button>
                )}
                {b.status === 'RETURNED' && (
                  <button className="btn btn-ghost" onClick={() => setReviewTarget(b)}>
                    Leave review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Are you sure?"
        message={confirmTarget ? `This will remove "${confirmTarget.title}". This cannot be undone.` : ''}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget?.type === 'item') deleteItem(confirmTarget.id);
          if (confirmTarget?.type === 'booking') deleteBooking(confirmTarget.id);
        }}
      />

      {reviewTarget && (
        <ReviewModal booking={reviewTarget} onCancel={() => setReviewTarget(null)} onSubmit={submitReview} />
      )}
    </div>
  );
}

function ReviewModal({ booking, onCancel, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Review for {booking.item_title || booking.borrower_name}</h3>
        <label>
          Rating
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Comment
          <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onSubmit(booking.id, rating, comment)}>
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
