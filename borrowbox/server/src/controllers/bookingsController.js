const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const bookingService = require('../services/bookingService');

async function create(req, res, next) {
  try {
    const { item_id, start_date, end_date, message } = req.body;
    const booking = await bookingService.createBooking({
      itemId: item_id,
      borrowerId: req.user.id,
      startDate: start_date,
      endDate: end_date,
      message,
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

function withOverdueFlag(rows) {
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((b) => ({
    ...b,
    overdue: b.status === 'PICKED_UP' && b.end_date.toISOString().slice(0, 10) < today,
  }));
}

async function mine(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, i.title AS item_title, i.image_url
       FROM bookings b JOIN items i ON i.id = b.item_id
       WHERE b.borrower_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: withOverdueFlag(rows) });
  } catch (err) {
    next(err);
  }
}

async function incoming(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, i.title AS item_title, i.image_url, u.name AS borrower_name
       FROM bookings b
       JOIN items i ON i.id = b.item_id
       JOIN users u ON u.id = b.borrower_id
       WHERE i.owner_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: withOverdueFlag(rows) });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT b.*, i.title AS item_title, i.owner_id, i.max_days,
              owner.name AS owner_name, borrower.name AS borrower_name
       FROM bookings b
       JOIN items i ON i.id = b.item_id
       JOIN users owner ON owner.id = i.owner_id
       JOIN users borrower ON borrower.id = b.borrower_id
       WHERE b.id = $1`,
      [id]
    );
    const booking = rows[0];
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (booking.owner_id !== req.user.id && booking.borrower_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not allowed to view this booking.');
    }

    const { rows: logs } = await pool.query(
      'SELECT * FROM condition_logs WHERE booking_id = $1 ORDER BY logged_at ASC',
      [id]
    );
    const { rows: reviews } = await pool.query(
      'SELECT * FROM reviews WHERE booking_id = $1',
      [id]
    );

    res.json({ success: true, data: { ...booking, condition_logs: logs, reviews } });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { start_date, end_date, message } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    const booking = existingRows[0];
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (booking.borrower_id !== req.user.id) throw new ApiError(403, 'Only the borrower can edit this booking.');
    if (booking.status !== 'REQUESTED') throw new ApiError(409, 'Only a REQUESTED booking can be edited.');

    const { rows } = await pool.query(
      `UPDATE bookings SET
         start_date = COALESCE($1, start_date),
         end_date = COALESCE($2, end_date),
         message = COALESCE($3, message),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [start_date, end_date, message, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    const booking = existingRows[0];
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (booking.borrower_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the borrower can remove this booking.');
    }
    if (!['REJECTED', 'CANCELLED'].includes(booking.status)) {
      throw new ApiError(409, 'Only a REJECTED or CANCELLED booking can be removed.');
    }
    await pool.query('DELETE FROM bookings WHERE id = $1', [id]);
    res.json({ success: true, message: 'Booking removed.' });
  } catch (err) {
    next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { action, note, reject_reason } = req.body;
    const allowed = ['approve', 'reject', 'cancel', 'pickup', 'return'];
    if (!allowed.includes(action)) {
      throw new ApiError(400, `action must be one of: ${allowed.join(', ')}`);
    }
    const booking = await bookingService.applyStatusAction({
      bookingId: id,
      actorId: req.user.id,
      actorRole: req.user.role,
      action,
      note,
      rejectReason: reject_reason,
    });
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, mine, incoming, getOne, update, remove, changeStatus };
