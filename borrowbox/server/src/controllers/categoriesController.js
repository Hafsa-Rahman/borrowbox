const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

async function list(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Category name is required.');
    const { rows: existing } = await pool.query('SELECT id FROM categories WHERE name = $1', [name.trim()]);
    if (existing.length > 0) throw new ApiError(400, 'A category with this name already exists.');
    const { rows } = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name.trim()]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) throw new ApiError(400, 'Category name is required.');
    const { rows } = await pool.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING *', [name.trim(), id]);
    if (!rows[0]) throw new ApiError(404, 'Category not found.');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const { rows: usedRows } = await pool.query('SELECT COUNT(*)::int AS count FROM items WHERE category_id = $1', [id]);
    if (usedRows[0].count > 0) {
      throw new ApiError(409, 'Cannot delete a category that is used by items.');
    }
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    if (rowCount === 0) throw new ApiError(404, 'Category not found.');
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove };
