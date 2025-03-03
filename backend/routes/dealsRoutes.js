const express = require('express');
const dealsController = require('../controllers/dealsController.js');

const router = express.Router();

// Получить все предложения по фильтрации и пагинации
router.get("/allDeals", dealsController.getAllDeals);

module.exports = router;