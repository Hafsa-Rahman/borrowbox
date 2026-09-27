const COLORS = {
  REQUESTED: '#c07b00',
  APPROVED: '#1e8fd5',
  PICKED_UP: '#5b4bc4',
  RETURNED: '#1a9b6c',
  REJECTED: '#c0392b',
  CANCELLED: '#6b7280',
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || '#6b7280';
  return (
    <span
      className="status-badge"
      style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}55` }}
    >
      {status}
    </span>
  );
}
