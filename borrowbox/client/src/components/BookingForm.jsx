import { useMemo, useState } from 'react';

function daysBetween(from, to) {
  if (!from || !to) return 0;
  const ms = new Date(to) - new Date(from);
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

export default function BookingForm({ item, bookedRanges, onSubmit, submitting, disabledReason }) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  function overlapsBooked(start, end) {
    return bookedRanges.some((r) => start <= r.end_date && end >= r.start_date);
  }

  function validate() {
    if (!startDate || !endDate) return 'Please choose both a start and end date.';
    if (endDate < startDate) return 'End date must be on or after the start date.';
    if (days > item.max_days) return `Maximum ${item.max_days} days allowed for this item.`;
    if (overlapsBooked(startDate, endDate)) return 'Those dates overlap an existing booking.';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSubmit({ item_id: item.id, start_date: startDate, end_date: endDate, message });
  }

  if (disabledReason) {
    return <p className="muted">{disabledReason}</p>;
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h3>Request to borrow</h3>
      <p className="muted">Owner approval required · max {item.max_days} days</p>

      <label>
        From
        <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>
      <label>
        To
        <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      </label>

      {startDate && endDate && (
        <p className={days > item.max_days ? 'warn' : 'muted'}>
          {days} day{days === 1 ? '' : 's'} selected (max {item.max_days} allowed)
        </p>
      )}

      <label>
        Message
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the owner why you need this item and when you'll return it."
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Request'}
      </button>
    </form>
  );
}
