const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const PAGE_SIZE = 6;

async function list(req, res, next) {
  try {
    const { search, category, from, to, page = 1 } = req.query;
    const conditions = ['i.is_active = true', 'u.is_active = true'];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category) {
      conditions.push(`i.category_id = $${idx}`);
      params.push(category);
      idx++;
    }
    if (from && to) {
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.item_id = i.id
          AND b.status IN ('APPROVED', 'PICKED_UP')
          AND b.start_date <= $${idx + 1}
          AND b.end_date >= $${idx}
      )`);
      params.push(from, to);
      idx += 2;
    }

    const whereClause = conditions.join(' AND ');
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const offset = (pageNum - 1) * PAGE_SIZE;

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM items i JOIN users u ON u.id = i.owner_id WHERE ${whereClause}`,
      params
    );

    params.push(PAGE_SIZE, offset);
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, u.name AS owner_name,
              COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.reviewee_id = u.id), 0)::float AS owner_rating
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.owner_id
       WHERE ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        page: pageNum,
        pageSize: PAGE_SIZE,
        total: countRows[0].count,
        totalPages: Math.max(1, Math.ceil(countRows[0].count / PAGE_SIZE)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name
       FROM items i JOIN categories c ON c.id = i.category_id
       WHERE i.owner_id = $1 ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, u.name AS owner_name, u.area AS owner_area,
              COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.reviewee_id = u.id), 0)::float AS owner_rating,
              (SELECT COUNT(*)::int FROM reviews r WHERE r.reviewee_id = u.id) AS owner_review_count
       FROM items i
       JOIN categories c ON c.id = i.category_id
       JOIN users u ON u.id = i.owner_id
       WHERE i.id = $1`,
      [id]
    );
    if (!rows[0]) throw new ApiError(404, 'Item not found.');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function availability(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT start_date, end_date, status FROM bookings
       WHERE item_id = $1 AND status IN ('APPROVED', 'PICKED_UP', 'REQUESTED')
       ORDER BY start_date ASC`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { title, description, category_id, condition, max_days, pickup_area, image_url } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO items (owner_id, category_id, title, description, condition, max_days, pickup_area, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, category_id, title, description || null, condition, max_days, pickup_area || null, image_url || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    const item = existingRows[0];
    if (!item) throw new ApiError(404, 'Item not found.');
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the owner can edit this item.');
    }

    const { title, description, category_id, condition, max_days, pickup_area, image_url, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE items SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         category_id = COALESCE($3, category_id),
         condition = COALESCE($4, condition),
         max_days = COALESCE($5, max_days),
         pickup_area = COALESCE($6, pickup_area),
         image_url = COALESCE($7, image_url),
         is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [title, description, category_id, condition, max_days, pickup_area, image_url, is_active, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: existingRows } = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    const item = existingRows[0];
    if (!item) throw new ApiError(404, 'Item not found.');
    if (item.owner_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Only the owner can delete this item.');
    }

    const { rows: historyRows } = await pool.query('SELECT COUNT(*)::int AS count FROM bookings WHERE item_id = $1', [id]);
    if (historyRows[0].count > 0) {
      const { rows: openRows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM bookings WHERE item_id = $1 AND status IN ('REQUESTED','APPROVED','PICKED_UP')`,
        [id]
      );
      if (openRows[0].count > 0) {
        throw new ApiError(409, 'Cannot delete an item with open bookings.');
      }
      await pool.query('UPDATE items SET is_active = false WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Item has booking history, so it was deactivated instead of deleted.' });
    }

    await pool.query('DELETE FROM items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, mine, getOne, availability, create, update, remove };
