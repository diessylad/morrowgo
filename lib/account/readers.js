import { serializeCustomerEsim, serializeCustomerOrder } from '../esims/model';

const ESIM_COLUMNS = 'id,user_id,destination_iso,destination_name,plan_name,initial_data_bytes,remaining_data_bytes,used_data_bytes,is_unlimited,validity_days,activated_at,expires_at,usage_updated_at,ordered_at,status,networks,supports_5g,rechargeable,install_details';
const ORDER_COLUMNS = 'id,user_id,destination_iso,plan_name,ordered_at,status,amount_total,currency';
export const isRecordId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function readOwned(client, userId, { table, columns, serialize, id }) {
  if (!client || !isRecordId(userId)) return { data: null, error: 'unavailable' };
  if (id !== undefined && !isRecordId(id)) return { data: null, error: 'invalid_id' };
  try {
    let query = client.from(table).select(columns).eq('user_id', userId);
    if (id !== undefined) query = query.eq('id', id);
    const result = id === undefined
      ? await query.order('ordered_at', { ascending: false }).limit(100)
      : await query.maybeSingle();
    if (result.error) return { data: null, error: 'unavailable' };
    if (id !== undefined) {
      if (!result.data) return { data: null, error: null };
      if (result.data.user_id !== userId) return { data: null, error: 'unavailable' };
      return { data: serialize(result.data), error: null };
    }
    if (!Array.isArray(result.data) || result.data.some(row => row.user_id !== userId)) return { data: null, error: 'unavailable' };
    return { data: result.data.map(serialize), error: null };
  } catch {
    return { data: null, error: 'unavailable' };
  }
}

export const readCustomerEsims = (client, userId) => readOwned(client, userId, { table: 'customer_esims', columns: ESIM_COLUMNS, serialize: serializeCustomerEsim });
export const readCustomerEsim = (client, userId, id) => isRecordId(id)
  ? readOwned(client, userId, { table: 'customer_esims', columns: ESIM_COLUMNS, serialize: serializeCustomerEsim, id })
  : Promise.resolve({ data: null, error: 'invalid_id' });
export const readCustomerOrders = (client, userId) => readOwned(client, userId, { table: 'customer_orders', columns: ORDER_COLUMNS, serialize: serializeCustomerOrder });
