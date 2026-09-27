import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/${id}`)
      .then((res) => setProfile(res.data.data))
      .catch(() => setError('This profile could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading profile…</div>;
  if (error || !profile) return <div className="page"><p className="form-error">{error}</p></div>;

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar avatar-lg">{profile.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <h1>{profile.name}</h1>
          <p className="muted">{profile.area}</p>
          <p className="rating-large">★ {profile.avg_rating.toFixed(1)} · {profile.review_count} reviews</p>
        </div>
      </div>

      <h2>Reviews</h2>
      {profile.reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      <div className="reviews-list">
        {profile.reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-header">
              <strong>{r.reviewer_name}</strong>
              <span className="rating">★ {r.rating}</span>
            </div>
            {r.comment && <p>{r.comment}</p>}
            <p className="muted small">{new Date(r.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
