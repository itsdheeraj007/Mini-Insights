require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Health check — verifies Supabase connectivity over HTTPS
app.get('/health', async (req, res) => {
  const { error } = await supabase.from('kpis').select('id').limit(1);

  if (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }

  res.json({ status: 'ok', db: 'connected' });
});

app.use('/data',         require('./routes/data'));
app.use('/run-pipeline', require('./routes/pipeline'));
app.use('/insights',     require('./routes/insights'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
