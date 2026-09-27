const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { publicUser } = require('./authController');

async function updateMe(req, res, next) {
  try {
    const { name, phone, area } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         area = COALESCE($3, area)
       WHERE id = $4 RETURNING *`,
      [name, phone, area, req.user.id]
    );
    res.json({ success: true, data: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function deleteMe(req, res, next) {
  try {
    const { rows: openRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM bookings b
       JOIN items i ON i.id = b.item_id
       WHERE (b.borrower_id = $1 OR i.owner_id = $1)
         AND b.status IN ('REQUESTED','APPROVED','PICKED_UP')`,
      [req.user.id]
    );
    if (openRows[0].count > 0) {
      throw new ApiError(409, 'Cannot delete account while you have open bookings.');
    }
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    next(err);
  }
}

async function getPublicProfile(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT id, name, area, created_at FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    if (!rows[0]) throw new ApiError(404, 'User not found.');

    const { rows: statsRows } = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::float AS avg_rating, COUNT(*)::int AS review_count
       FROM reviews WHERE reviewee_id = $1`,
      [id]
    );
    const { rows: reviews } = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...rows[0],
        avg_rating: Number(statsRows[0].avg_rating.toFixed(2)),
        review_count: statsRows[0].review_count,
        reviews,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateMe, deleteMe, getPublicProfile };
