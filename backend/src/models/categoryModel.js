const db = require('../config/db');

// Get all categories
const getAllCategories = async () => {
    const [rows] = await db.query(
        `SELECT category_id, category_name
         FROM categories
         ORDER BY category_name ASC`
    );

    return rows;
};

module.exports = {
    getAllCategories
};