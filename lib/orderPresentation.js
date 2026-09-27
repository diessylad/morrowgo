import en from './../locales/en.json';
export function orderPresentation(order) {
  if (!order) return { key: 'loading', title: en["m_c015d688bb17"], text: en["m_534b96270d7d"], poll: true };
  if (!order.paid) return { key: 'payment_pending', title: en["m_603dad6fe064"], text: en["m_7795ad65a779"], poll: true };
  if (['validation_failed', 'failed', 'fulfillment_failed', 'fulfillment_uncertain', 'error'].includes(order.status)) return { key: 'attention', title: en["m_d194d49069e1"], text: en["m_efad0a8fba0c"], poll: false };
  if (order.status === 'ready' || order.fulfillmentStatus === 'ready') return { key: 'ready', title: en["m_8a75365e9a18"], text: en["m_f4e462a954b0"], poll: false };
  if (['validated', 'awaiting_fulfillment'].includes(order.status) || order.fulfillmentStatus === 'awaiting_fulfillment') return { key: 'waiting', title: en["m_7b9de10eeb26"], text: en["m_0dfa38a6dde1"], poll: false };
  if (order.status === 'fulfilling' && order.fulfillmentStatus === 'transaction_pending') return { key: 'attention', title: en["m_2f9999b5aa42"], text: en["m_65f84f274f90"], poll: false };
  if (['processing', 'fulfilling'].includes(order.status)) return { key: 'processing', title: en["m_43a3f3cba1c4"], text: en["m_5a96cb94e380"], poll: true };
  return { key: 'attention', title: en["m_d194d49069e1"], text: en["m_7e3a5ae2b017"], poll: false };
}
