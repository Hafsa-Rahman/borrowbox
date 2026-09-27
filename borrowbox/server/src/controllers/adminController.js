const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function stats(req, res, next) {
  try {
    const { rows: userCount } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    const { rows: itemCount } = await pool.query('SELECT COUNT(*)::int AS count FROM items');
    const { rows: byStatus } = await pool.query(
      'SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status'
    );
    res.json({
      success: true,
      data: {
        total_users: userCount[0].count,
        total_items: itemCount[0].count,
        bookings_by_status: byStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, phone, area, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function setUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') throw new ApiError(400, 'is_active must be true or false.');
    const { rows } = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, id]
    );
    if (!rows[0]) throw new ApiError(404, 'User not found.');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { id } = req.params;
    await pool.query('UPDATE items SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true, message: 'Item removed (deactivated).' });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, listUsers, setUserStatus, removeItem };
