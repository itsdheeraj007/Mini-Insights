const { Router } = require('express');
const { listInsights, getInsight } = require('../controllers/insightController');

const router = Router();

router.get('/',    listInsights);
router.get('/:id', getInsight);

module.exports = router;
