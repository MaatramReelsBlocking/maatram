// Self-check for the month and top-3 logic. Run: node test.mjs
import assert from 'node:assert';

import { topThree, scoreFor, lastMonth, monthName } from './send.mjs';
assert.equal(lastMonth(new Date('2026-11-01T00:10:00+05:30')), '2026-10');
assert.equal(lastMonth(new Date('2026-01-15T10:00:00Z')), '2025-12');
assert.equal(monthName('2026-10'), 'October 2026');
const u=[{uid:'a',name:'A','m_2026-10':900,cycle:'2026-11',points:5},{uid:'b',name:'B',cycle:'2026-10',points:1200},
 {uid:'c',name:'C','m_2026-10':1500,banned:true},{uid:'d',name:'D','m_2026-10':300},{uid:'e',name:'E','m_2026-10':800},{uid:'f',name:'F',points:50,cycle:'2026-11'}];
assert.equal(scoreFor(u[1],'2026-10'),1200);
const t=topThree(u,'2026-10'); assert.deepEqual(t.map(x=>x.uid+x.rank),['b1','a2','e3']);
console.log('ok');
