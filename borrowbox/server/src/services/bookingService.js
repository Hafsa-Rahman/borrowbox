const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const OPEN_STATUSES = ['REQUESTED', 'APPROVED', 'PICKED_UP'];
const BLOCKING_STATUSES = ['APPROVED', 'PICKED_UP'];

// Allowed status transitions: from -> { action: [to, allowedActor] }
const TRANSITIONS = {
  REQUESTED: { approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED' },
  APPROVED: { pickup: 'PICKED_UP', cancel: 'CANCELLED' },
  PICKED_UP: { return: 'RETURNED' },
};

/** Overlap check: does item have an APPROVED/PICKED_UP booking overlapping [start, end]? */
async function hasOverlap(client, itemId, start, end, excludeBookingId = null) {
  const params = [itemId, start, end];
  let sql = `
    SELECT 1 FROM bookings
    WHERE item_id = $1
      AND status IN ('APPROVED', 'PICKED_UP')
      AND start_date <= $3
      AND end_date >= $2
  `;
  if (excludeBookingId) {
    params.push(excludeBookingId);
    sql += ` AND id <> $4`;
  }
  const { rows } = await client.query(sql, params);
  return rows.length > 0;
}

/** Rule set applied before a booking request is created. */
async function validateNewBooking(client, { itemId, borrowerId, startDate, endDate }) {
  const today = new Date().toISOString().slice(0, 10);
  if (startDate < today) {
    throw new ApiError(400, 'start_date must not be in the past.');
  }
  if (endDate < startDate) {
    throw new ApiError(400, 'end_date must be on or after start_date.');
  }

  const { rows: itemRows } = await client.query(
    `SELECT i.*, u.is_active AS owner_active
     FROM items i JOIN users u ON u.id = i.owner_id
     WHERE i.id = $1`,
    [itemId]
  );
  const item = itemRows[0];
  if (!item) throw new ApiError(404, 'Item not found.');
  if (!item.is_active || !item.owner_active) {
    throw new ApiError(400, 'This item is not currently available for borrowing.');
  }
  if (item.owner_id === borrowerId) {
    throw new ApiError(400, 'You cannot borrow your own item.');
  }

  const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
  if (days > item.max_days) {
    throw new ApiError(400, `Borrow duration must not exceed ${item.max_days} days for this item.`);
  }

  const overlap = await hasOverlap(client, itemId, startDate, endDate);
  if (overlap) {
    throw new ApiError(409, 'The requested dates overlap an existing approved booking.');
  }

  const { rows: openRows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM bookings
     WHERE borrower_id = $1 AND status = ANY($2::varchar[])`,
    [borrowerId, OPEN_STATUSES]
  );
  if (openRows[0].count >= 3) {
    throw new ApiError(400, 'You may have at most 3 open bookings at a time.');
  }

  return item;
}

async function createBooking({ itemId, borrowerId, startDate, endDate, message }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await validateNewBooking(client, { itemId, borrowerId, startDate, endDate });

    const { rows } = await client.query(
      `INSERT INTO bookings (item_id, borrower_id, start_date, end_date, message, status)
       VALUES ($1, $2, $3, $4, $5, 'REQUESTED')
       RETURNING *`,
      [itemId, borrowerId, startDate, endDate, message || null]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Applies a status action (approve | reject | cancel | pickup | return).
 * Runs the whole state change (plus any side effects) inside one transaction.
 */
async function applyStatusAction({ bookingId, actorId, actorRole, action, note, rejectReason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bookingRows } = await client.query(
      `SELECT b.*, i.owner_id
       FROM bookings b JOIN items i ON i.id = b.item_id
       WHERE b.id = $1 FOR UPDATE`,
      [bookingId]
    );
    const booking = bookingRows[0];
    if (!booking) throw new ApiError(404, 'Booking not found.');

    const isOwner = booking.owner_id === actorId;
    const isBorrower = booking.borrower_id === actorId;
    const isAdmin = actorRole === 'admin';

    const ownerActions = ['approve', 'reject', 'pickup', 'return'];
    const borrowerActions = ['cancel'];

    if (ownerActions.includes(action) && !isOwner && !isAdmin) {
      throw new ApiError(403, 'Only the item owner can perform this action.');
    }
    if (borrowerActions.includes(action) && !isBorrower && !isAdmin) {
      throw new ApiError(403, 'Only the borrower can perform this action.');
    }

    const allowedFromStatus = TRANSITIONS[booking.status];
    const nextStatus = allowedFromStatus && allowedFromStatus[action];
    if (!nextStatus) {
      throw new ApiError(409, `Cannot ${action} a booking that is ${booking.status}.`);
    }

    // Lock the item row to keep the overlap re-check consistent with concurrent approvals.
    await client.query('SELECT id FROM items WHERE id = $1 FOR UPDATE', [booking.item_id]);

    if (action === 'approve') {
      const overlap = await hasOverlap(client, booking.item_id, booking.start_date, booking.end_date, booking.id);
      if (overlap) {
        throw new ApiError(409, 'These dates were just taken by another approved booking.');
      }
    }

    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const params = [nextStatus];
    let paramIndex = 2;

    if (action === 'reject' && rejectReason) {
      updateFields.push(`reject_reason = $${paramIndex++}`);
      params.push(rejectReason);
    }

    params.push(bookingId);
    await client.query(
      `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    if (action === 'approve') {
      // Auto-reject any other REQUESTED bookings on this item that now overlap.
      await client.query(
        `UPDATE bookings
         SET status = 'REJECTED', reject_reason = 'Dates no longer available (another request was approved).', updated_at = NOW()
         WHERE item_id = $1
           AND id <> $2
           AND status = 'REQUESTED'
           AND start_date <= $4
           AND end_date >= $3`,
        [booking.item_id, bookingId, booking.start_date, booking.end_date]
      );
    }

    if (action === 'pickup' || action === 'return') {
      const stage = action === 'pickup' ? 'handover' : 'return';
      await client.query(
        `INSERT INTO condition_logs (booking_id, stage, condition, note, logged_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (booking_id, stage) DO UPDATE SET note = EXCLUDED.note, condition = EXCLUDED.condition`,
        [bookingId, stage, note?.condition || 'good', note?.text || null, actorId]
      );
    }

    const { rows: updatedRows } = await client.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    await client.query('COMMIT');
    return updatedRows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createBooking, applyStatusAction, hasOverlap, OPEN_STATUSES, BLOCKING_STATUSES };
