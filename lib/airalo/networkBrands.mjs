// Editorial preference only: every displayed name must match a current package network.
const preferred = ['Vodafone', 'Orange', 'O2', 'T-Mobile', 'TIM', 'Movistar', 'Verizon', 'EE', 'Airtel', 'Singtel', 'Telia', 'Telenor'];
const key = value => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export function selectNetworkBrands(countries) {
  const available = new Set(countries.flatMap(country => (country.packages || []).flatMap(plan => (plan.networks || []).filter(name => typeof name === 'string').map(key))));
  return preferred.filter(name => available.has(key(name)));
}
