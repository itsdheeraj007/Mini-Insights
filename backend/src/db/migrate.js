/**
 * Migration via Supabase SDK using rpc('exec_sql').
 *
 * IMPORTANT: Before running this, go to Supabase Dashboard → SQL Editor and run:
 *
 *   CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void
 *   LANGUAGE plpgsql SECURITY DEFINER AS $$
 *   BEGIN EXECUTE sql; END; $$;
 *
 * Then run: node src/db/migrate.js
 */
const supabase = require('./index');

const tables = `
  CREATE TABLE IF NOT EXISTS fact_sales (
    id           SERIAL PRIMARY KEY,
    date         DATE NOT NULL,
    region       VARCHAR(100),
    channel      VARCHAR(100),
    campaign     VARCHAR(100),
    spend        NUMERIC(12, 2) DEFAULT 0,
    leads        INTEGER DEFAULT 0,
    demos        INTEGER DEFAULT 0,
    conversions  INTEGER DEFAULT 0,
    revenue      NUMERIC(12, 2) DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS kpis (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150),
    description  TEXT
  );

  CREATE TABLE IF NOT EXISTS signals (
    id          SERIAL PRIMARY KEY,
    kpi_id      INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
    type        VARCHAR(20) CHECK (type IN ('spike', 'drop')) NOT NULL,
    value       NUMERIC(10, 4),
    severity    VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
    region      VARCHAR(100),
    channel     VARCHAR(100),
    campaign    VARCHAR(100),
    created_at  TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS insights (
    id             SERIAL PRIMARY KEY,
    signal_id      INTEGER REFERENCES signals(id) ON DELETE CASCADE,
    title          VARCHAR(255),
    description    TEXT,
    why            TEXT,
    impact         TEXT,
    recommendation TEXT,
    severity       VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,
    created_at     TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS insight_tags (
    id         SERIAL PRIMARY KEY,
    insight_id INTEGER REFERENCES insights(id) ON DELETE CASCADE,
    tag        VARCHAR(100) NOT NULL
  );
`;

const run = async () => {
  const { error } = await supabase.rpc('exec_sql', { sql: tables });

  if (error) {
    console.error('[Migrate] Error:', error.message);
    console.error('[Migrate] Hint: Make sure you created the exec_sql function in Supabase SQL Editor first.');
    process.exit(1);
  }

  console.log('[Migrate] All tables created successfully.');
};

run();
