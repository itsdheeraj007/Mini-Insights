/**
 * Seed script — inserts sample KPIs and sales data.
 * Usage: node src/db/seed.js
 */
const supabase = require('./index');

const seedKPIs = async () => {
  const kpis = [
    { name: 'cost_per_demo',  display_name: 'Cost Per Demo',  description: 'Total spend divided by number of demos booked.' },
    { name: 'demo_rate',      display_name: 'Demo Rate',      description: 'Percentage of leads that converted to demos.' },
    { name: 'close_rate',     display_name: 'Close Rate',     description: 'Percentage of demos that resulted in a conversion.' },
  ];

  const { error } = await supabase.from('kpis').upsert(kpis, { onConflict: 'name' });
  if (error) throw new Error(`KPI seed failed: ${error.message}`);
  console.log('[Seed] KPIs inserted.');
};

const seedSalesData = async () => {
  const rows = [
    // Region: North — Channel: Email — Campaign: Spring Sale
    { date: '2024-01-01', region: 'North', channel: 'Email', campaign: 'Spring Sale', spend: 5000, leads: 200, demos: 40, conversions: 10, revenue: 30000 },
    { date: '2024-01-02', region: 'North', channel: 'Email', campaign: 'Spring Sale', spend: 4800, leads: 190, demos: 38, conversions: 9,  revenue: 28000 },
    { date: '2024-01-03', region: 'North', channel: 'Email', campaign: 'Spring Sale', spend: 5200, leads: 210, demos: 70, conversions: 18, revenue: 52000 }, // spike
    { date: '2024-01-04', region: 'North', channel: 'Email', campaign: 'Spring Sale', spend: 5100, leads: 205, demos: 41, conversions: 10, revenue: 31000 },
    { date: '2024-01-05', region: 'North', channel: 'Email', campaign: 'Spring Sale', spend: 4900, leads: 195, demos: 15, conversions: 3,  revenue: 12000 }, // drop

    // Region: South — Channel: Paid — Campaign: Q1 Push
    { date: '2024-01-01', region: 'South', channel: 'Paid', campaign: 'Q1 Push', spend: 8000, leads: 300, demos: 60, conversions: 15, revenue: 45000 },
    { date: '2024-01-02', region: 'South', channel: 'Paid', campaign: 'Q1 Push', spend: 7800, leads: 290, demos: 58, conversions: 14, revenue: 43000 },
    { date: '2024-01-03', region: 'South', channel: 'Paid', campaign: 'Q1 Push', spend: 8200, leads: 310, demos: 62, conversions: 15, revenue: 46000 },
    { date: '2024-01-04', region: 'South', channel: 'Paid', campaign: 'Q1 Push', spend: 8100, leads: 305, demos: 20, conversions: 4,  revenue: 18000 }, // drop
    { date: '2024-01-05', region: 'South', channel: 'Paid', campaign: 'Q1 Push', spend: 7900, leads: 295, demos: 90, conversions: 22, revenue: 68000 }, // spike
  ];

  const { error } = await supabase.from('fact_sales').insert(rows);
  if (error) throw new Error(`Sales seed failed: ${error.message}`);
  console.log('[Seed] Sales data inserted.');
};

const run = async () => {
  try {
    await seedKPIs();
    await seedSalesData();
    console.log('[Seed] Done.');
  } catch (err) {
    console.error('[Seed] Error:', err.message);
    process.exit(1);
  }
};

run();
