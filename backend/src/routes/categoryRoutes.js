const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');

// Public category list
router.get(
    '/',
    categoryController.viewCategories
);

module.exports = router;