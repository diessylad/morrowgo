export function translateText(text, language, dictionaries) {
  if (typeof text !== 'string' || language === 'en') return text;
  const trimmed = text.trim(), dictionary = dictionaries[language] || {};
  if (dictionary[trimmed]) return text.replace(trimmed, dictionary[trimmed]);
  const t = value => translateText(value, language, dictionaries);
  const formats = [
    [/^(.+) used$/, '{value} used'],
    [/^(\d+) days? remaining$/, '{value} days remaining'],
    [/^Until (.+)$/, 'Until {value}'],
    [/^Last updated (.+)$/, 'Last updated {value}'],
    [/^Sample reading (.+)$/, 'Sample reading {value}'],
    [/^Data remaining for (.+)$/, 'Data remaining for {value}'],
    [/^Copy (.+)$/, 'Copy {value}']
  ];
  for (const [pattern, template] of formats) {
    const match = trimmed.match(pattern);
    if (match) return t(template).replace('{value}', t(match[1]));
  }
  if (trimmed.endsWith(' copied. Demonstration only.')) return t(trimmed.slice(0, -28)) + ' ' + t('Copied') + '. ' + t('Demonstration only.');
  if (trimmed.includes(' · ')) return text.split(' · ').map(t).join(' · ');
  if (trimmed === 'days ·') return text.replace('days', t('days'));
  if (/^From [€$£]/.test(trimmed)) return text.replace('From', t('From'));
  if (/^\d+ days?$/.test(trimmed)) return formatDays(Number(trimmed.split(' ')[0]), language, dictionaries);
  if (/^Continue — /.test(trimmed)) return text.replace('Continue', t('Continue'));
  if (trimmed.endsWith(' copied.')) return t(trimmed.slice(0, -8)) + ' ' + t('Copied');
  const fair = trimmed.match(/^Lower speed rate of ([\d.]+) Mbps after ([\d.]+) GB usage per day\.$/);
  if (fair) return t('Lower speed rate of {speed} Mbps after {data} GB usage per day.').replace('{speed}', fair[1]).replace('{data}', fair[2]);
  const plan = trimmed.match(/^(Select|Buy) (.+), (\d+) days, (.+)$/);
  if (plan) return t(`${plan[1]} {data}, {days} days, {price}`).replace('{data}', t(plan[2])).replace('{days}', plan[3]).replace('{price}', plan[4]);
  return text;
}

export function formatDays(days, language, dictionaries) {
  const rule = new Intl.PluralRules(language).select(Number(days));
  const key = rule === 'one' ? 'day.one' : rule === 'few' ? 'day.few' : 'day.other';
  return `${days} ${dictionaries[language]?.[key] || dictionaries.en[key]}`;
}
