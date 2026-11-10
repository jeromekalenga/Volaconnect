import test from 'node:test'; import assert from 'node:assert/strict';
import { allowRoles } from './security.js';
test('allowRoles rejects roles outside its allow-list',()=>{let code;const res={status(n){code=n;return this},json(){return this}};allowRoles('admin')({user:{role:'buyer'}},res,()=>{throw new Error('must not call next')});assert.equal(code,403);});
test('allowRoles accepts an explicitly allowed role',()=>{let next=false;allowRoles('farmer')({user:{role:'farmer'}},{},()=>{next=true});assert.equal(next,true);});
