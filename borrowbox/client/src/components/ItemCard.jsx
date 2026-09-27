import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-card-image" aria-hidden="true">
        {item.title.slice(0, 1).toUpperCase()}
      </div>
      <div className="item-card-body">
        <h3>{item.title}</h3>
        <p className="item-card-meta">
          {item.category_name} · max {item.max_days} days
        </p>
        <div className="item-card-footer">
          <span className="rating">★ {Number(item.owner_rating || 0).toFixed(1)}</span>
          <span className="badge-available">Available</span>
        </div>
      </div>
    </Link>
  );
}
