const { Router } = require('express');
const { runPipeline, runPipelineStream } = require('../controllers/pipelineController');

const router = Router();

router.post('/',       runPipeline);
router.get('/stream',  runPipelineStream);

module.exports = router;
