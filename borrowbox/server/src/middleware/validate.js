/**
 * Small dependency-free validation helpers. Each returns an array of
 * error strings (empty when the payload is valid).
 */

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

function validateRegister(body) {
  const errors = [];
  if (!body.name || String(body.name).trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!isEmail(body.email)) errors.push('A valid email is required.');
  if (!body.password || String(body.password).length < 6) errors.push('Password must be at least 6 characters.');
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!isEmail(body.email)) errors.push('A valid email is required.');
  if (!body.password) errors.push('Password is required.');
  return errors;
}

function validateItem(body) {
  const errors = [];
  if (!body.title || String(body.title).trim().length < 2) errors.push('Title is required.');
  if (!body.category_id) errors.push('Category is required.');
  if (!['new', 'good', 'fair'].includes(body.condition)) errors.push('Condition must be new, good or fair.');
  if (!body.max_days || Number(body.max_days) <= 0) errors.push('Max days must be a positive number.');
  return errors;
}

function validateBooking(body) {
  const errors = [];
  if (!body.item_id) errors.push('item_id is required.');
  if (!isDateString(body.start_date)) errors.push('A valid start_date (YYYY-MM-DD) is required.');
  if (!isDateString(body.end_date)) errors.push('A valid end_date (YYYY-MM-DD) is required.');
  if (isDateString(body.start_date) && isDateString(body.end_date) && body.end_date < body.start_date) {
    errors.push('end_date must be on or after start_date.');
  }
  return errors;
}

function validateReview(body) {
  const errors = [];
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.push('Rating must be an integer from 1 to 5.');
  return errors;
}

/** Generic middleware factory: runs `validatorFn` against req.body. */
function validateBody(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }
    next();
  };
}

module.exports = {
  isEmail,
  isDateString,
  validateRegister,
  validateLogin,
  validateItem,
  validateBooking,
  validateReview,
  validateBody,
};
