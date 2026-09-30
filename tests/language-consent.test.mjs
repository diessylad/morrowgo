import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveLanguage } from '../lib/i18n/config.mjs';
import { translateText, formatDays } from '../lib/i18n/translate.mjs';
import { readConsent, makeConsent, MAX_AGE } from '../lib/i18n/consent.mjs';
const dictionaries = JSON.parse(readFileSync(new URL('../locales/dictionaries.json', import.meta.url)));
test('explicit saved choice wins; first visits ignore browser language and use English', () => {
 assert.equal(resolveLanguage('ru',['de-DE']), 'ru');
 assert.equal(resolveLanguage('xx',['it-IT','fr-CA']), 'en');
 assert.equal(resolveLanguage(null,['ru-RU','ru']), 'en');
 assert.equal(resolveLanguage(undefined,['de-DE']), 'en');
 for (const language of ['en','de','es','ru','fr']) assert.equal(resolveLanguage(language,['ru-RU']), language);
});
test('every dictionary has the same translated entries and preserves unknown data', () => {
 const keys=Object.keys(dictionaries.en).sort();
 for(const language of ['de','es','ru','fr']) {
  assert.deepEqual(Object.keys(dictionaries[language]).sort(), keys);
  assert.ok(Object.values(dictionaries[language]).every(value => typeof value==='string' && value.trim()));
  assert.notEqual(translateText('Buy now',language,dictionaries),'Buy now');
  assert.equal(translateText('Moshi Moshi',language,dictionaries),'Moshi Moshi');
  assert.equal(translateText('LPA:1$host$token',language,dictionaries),'LPA:1$host$token');
  assert.equal(translateText('unknown future text',language,dictionaries),'unknown future text');
  const fair=translateText('Lower speed rate of 1 Mbps after 3 GB usage per day.',language,dictionaries);
  assert.ok(fair.includes('1')&&fair.includes('3')); assert.ok(!fair.includes('{speed}'));
 }
});
test('consent is denied until valid explicit choice, expires, and does not accept malformed values',()=>{
 assert.equal(readConsent(null),null);assert.equal(readConsent('{}'),null);assert.equal(readConsent('bad'),null);
 const rejected=makeConsent(false,false),accepted=makeConsent(true,true);
 assert.equal(readConsent(JSON.stringify(rejected)).analytics,false);
 assert.equal(readConsent(JSON.stringify(accepted)).marketing,true);
 assert.equal(readConsent(JSON.stringify(accepted),accepted.savedAt+MAX_AGE),null);
 assert.equal(readConsent(JSON.stringify({...accepted,analytics:'true'})),null);
 assert.equal(readConsent(JSON.stringify({...accepted,version:0})),null);
 assert.equal(readConsent(JSON.stringify({...accepted,savedAt:Date.now()+100000})),null);
 assert.equal(readConsent(JSON.stringify({...rejected,necessary:false})).necessary,true);
});

test('duration plural forms preserve numbers in every locale', () => {
 assert.equal(formatDays(1,'ru',dictionaries),'1 день');
 assert.equal(formatDays(3,'ru',dictionaries),'3 дня');
 assert.equal(formatDays(11,'ru',dictionaries),'11 дней');
 assert.equal(formatDays(21,'ru',dictionaries),'21 день');
 assert.equal(formatDays(1,'en',dictionaries),'1 day');
 assert.equal(formatDays(7,'fr',dictionaries),'7 jours');
});
