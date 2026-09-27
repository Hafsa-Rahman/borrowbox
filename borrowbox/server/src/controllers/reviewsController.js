const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function create(req, res, next) {
  try {
    const { id: bookingId } = req.params;
    const { rating, comment } = req.body;

    const { rows: bookingRows } = await pool.query(
      `SELECT b.*, i.owner_id FROM bookings b JOIN items i ON i.id = b.item_id WHERE b.id = $1`,
      [bookingId]
    );
    const booking = bookingRows[0];
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (booking.status !== 'RETURNED') throw new ApiError(409, 'Reviews can only be left after the item is returned.');

    const isOwner = booking.owner_id === req.user.id;
    const isBorrower = booking.borrower_id === req.user.id;
    if (!isOwner && !isBorrower) throw new ApiError(403, 'Only the two parties of this booking can leave a review.');

    const revieweeId = isOwner ? booking.borrower_id : booking.owner_id;

    const { rows: existing } = await pool.query(
      'SELECT id FROM reviews WHERE booking_id = $1 AND reviewer_id = $2',
      [bookingId, req.user.id]
    );
    if (existing.length > 0) throw new ApiError(409, 'You already reviewed this booking.');

    const { rows } = await pool.query(
      `INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [bookingId, req.user.id, revieweeId, rating, comment || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const { rows: existingRows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    const review = existingRows[0];
    if (!review) throw new ApiError(404, 'Review not found.');
    if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the author or an admin can edit this review.');
    }
    const { rows } = await pool.query(
      `UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment) WHERE id = $3 RETURNING *`,
      [rating, comment, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    const review = existingRows[0];
    if (!review) throw new ApiError(404, 'Review not found.');
    if (review.reviewer_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the author or an admin can delete this review.');
    }
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, update, remove };
