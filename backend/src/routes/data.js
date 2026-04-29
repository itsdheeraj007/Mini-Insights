const { Router } = require('express');
const { getData } = require('../controllers/dataController');
const { getKPIs, getKPISummary } = require('../controllers/kpiController');
const { getFeatures } = require('../controllers/featureController');

const router = Router();

router.get('/',             getData);
router.get('/kpis',         getKPIs);
router.get('/kpis/summary', getKPISummary);
router.get('/features',     getFeatures);

module.exports = router;
