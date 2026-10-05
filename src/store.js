import {SEED} from './seed.js';
import {clone,validateState} from './domain.js';
const KEY='scouter.v2.workspace';
let lastRaw=null;
export function load(){
 const raw=localStorage.getItem(KEY);
 lastRaw=raw;
 if(!raw)return clone(SEED);
 return validateState(JSON.parse(raw));
}
export function save(state){validateState(state);if(localStorage.getItem(KEY)!==lastRaw)throw Error('Another tab changed this workspace. Reload before saving to preserve its changes.');const next=JSON.stringify(state);localStorage.setItem(KEY,next);lastRaw=next;}
