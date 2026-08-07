const {
    getAllCategories
} = require('../models/categoryModel');

// View all categories
const viewCategories = async (req, res) => {
    try {
        const categories = await getAllCategories();

        return res.json({
            categories: categories
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: 'Server error while loading categories'
        });
    }
};

module.exports = {
    viewCategories
};