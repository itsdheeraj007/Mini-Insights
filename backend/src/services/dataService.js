const supabase = require('../db');

/**
 * Fetch raw sales rows from fact_sales.
 * All filters are optional — any combination can be applied.
 *
 * @param {Object} filters - { region, channel, campaign, from, to }
 * @returns {Promise<Array>} array of sales rows
 */
const getSalesData = async (filters = {}) => {
  const { region, channel, campaign, from, to } = filters;

  let query = supabase
    .from('fact_sales')
    .select('*')
    .order('date', { ascending: true });

  if (region)   query = query.eq('region', region);
  if (channel)  query = query.eq('channel', channel);
  if (campaign) query = query.eq('campaign', campaign);
  if (from)     query = query.gte('date', from);
  if (to)       query = query.lte('date', to);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return data;
};

module.exports = { getSalesData };
