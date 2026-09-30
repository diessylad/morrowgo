import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeReturnPath,destinationsHref} from '../lib/navigation/returnPath.mjs';
test('internal origin survives link, URL parsing and refresh',()=>{
 for(const path of ['/account','/account/esims','/','/help','/destination/JP']){
 const href=destinationsHref(path);assert.equal(safeReturnPath(new URL(href,'https://www.morrowgo.com').searchParams.get('returnTo')),path);
 }
});
test('missing and unsafe paths fall back home',()=>{
 for(const path of [null,'','https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','javascript:alert(1)','/destinations','/api/test','/auth/callback'])assert.equal(safeReturnPath(path),'/');
});
