export const TYPES=['Research','Outreach','Follow-up','Response','Conversation','Price quote','Paid work','Review'];
export const METHODS=['Scouter','Random prospecting'];
export const RESPONSES=['Not contacted','Awaiting reply','Replied','Conversation held','Declined','Pending / late'];
export const MODULES=[{id:'discover',status:'manual',owns:'Opportunity intake and profile fit'},{id:'intelligence',status:'manual',owns:'Evidence, qualification and discovery'},{id:'workbench',status:'future',owns:'Delivery workflows and tools'},{id:'ops',status:'limited',owns:'Activities, quote and payment records'},{id:'trades',status:'parked',owns:'Separate lane and experiment'}];
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Boise',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export const clone=x=>structuredClone(x);
export const id=()=>crypto.randomUUID();
export function numberOrNull(v){return v===''||v===null||v===undefined?null:Number(v);}
export function inPeriod(a,experiment){return a.date>=experiment.start&&a.date<=experiment.end;}
export function sumRecorded(rows,key){const values=rows.map(a=>a[key]).filter(v=>typeof v==='number');return values.length?values.reduce((a,b)=>a+b,0):null;}
export function metrics(state,method=null){
 const opps=state.opportunities.filter(o=>!method||o.method===method);
 const rows=state.activities.filter(a=>inPeriod(a,state.experiment)&&(!method||a.method===method));
 const research=rows.filter(a=>a.type==='Research');
 const counts=Object.fromEntries(TYPES.map(t=>[t,rows.filter(a=>a.type===t).length]));
 const owners=new Set(rows.filter(a=>a.ownerWords&&a.ownerVerified).map(a=>a.businessId));
 return {decisions:opps.filter(o=>o.decision!=='Undecided').length,pursued:opps.filter(o=>o.decision==='Pursue').length,businesses:opps.length,counts,rows:rows.length,research:sumRecorded(research,'minutes'),minutes:sumRecorded(rows,'minutes'),payments:sumRecorded(rows.filter(a=>a.type==='Paid work'),'payment'),quotes:sumRecorded(rows.filter(a=>a.type==='Price quote'),'quote'),missingTime:rows.filter(a=>a.minutes===null).length,missingPayment:rows.filter(a=>a.type==='Paid work'&&a.payment===null).length,ownerBusinesses:owners.size,friction:rows.filter(a=>a.friction).length,late:state.activities.filter(a=>a.date>state.experiment.end&&(!method||a.method===method)).length};
}
export function ownerEvidence(state,businessId){return state.activities.filter(a=>a.businessId===businessId&&a.ownerVerified&&a.ownerWords.trim());}
export function offerReady(state,o){return Boolean(ownerEvidence(state,o.id).length&&o.ownerResult.trim()&&o.problem.trim()&&o.deliveryConfirmed&&state.profile.services.some(s=>s.id===o.deliveryService&&s.confirmed));}
export function reviewReady(state,o){return Boolean(o.decision==='Pursue'&&o.contactVerified&&state.profile.name.trim()&&!o.draft.includes('[your name]')&&o.draft.trim());}
export function newOpportunity(values){return {id:id(),lane:'digital-services',name:'',type:'',location:'',website:'',contact:'',method:'Scouter',service:'',sourceBrief:'',evidence:[],question:'',counter:'',decision:'Undecided',reason:'',nextAction:'',due:'',draft:'',subject:'',reviewStatus:'Needs review',response:'Not contacted',ownerResult:'',problem:'',workaround:'',priority:'',deliveryService:'',deliveryConfirmed:false,contactVerified:false,offer:'',offerPrice:null,offerTiming:'',offerAcceptance:'Not discussed',...values};}
export function validateActivity(a,state){
 if(!TYPES.includes(a.type)||!METHODS.includes(a.method))throw Error('Choose a valid activity and research method.');
 if(!validDate(a.date))throw Error('Enter a valid activity date.');
 if(a.businessId!=='General'&&!state.opportunities.some(o=>o.id===a.businessId))throw Error('Business does not exist.');
 for(const key of ['minutes','quote','payment'])if(a[key]!==null&&(!Number.isFinite(a[key])||a[key]<0))throw Error(`${key} must be blank or a non-negative number.`);
 if(a.type!=='Price quote'&&a.quote!==null)throw Error('Record quote amounts only on a Price quote activity.');
 if(a.type!=='Paid work'&&a.payment!==null)throw Error('Record received money only on a Paid work activity.');
 if(a.ownerVerified&&(!a.ownerWords.trim()||!a.recipient.trim()||a.businessId==='General'))throw Error('An owner statement needs exact words, an identified speaker and a business.');
 if(['Outreach','Follow-up'].includes(a.type)&&(!a.message.trim()||!a.recipient.trim()))throw Error('Log the message actually sent and the channel / recipient.');
 if(a.type==='Price quote'&&(!a.scope.trim()||!a.reference.trim()))throw Error('A quote needs its scope / status and a unique quote reference.');
 if(a.type==='Paid work'&&(!a.scope.trim()||!a.reference.trim()))throw Error('Paid work needs its scope / status and a unique payment or work reference.');
 if(a.reference&&['Price quote','Paid work'].includes(a.type)&&state.activities.some(x=>x.id!==a.id&&x.type===a.type&&x.businessId===a.businessId&&x.reference===a.reference))throw Error('That reference is already logged. Edit the existing record to avoid counting it twice.');
 return a;
}
export function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function csv(rows){return '\ufeff'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export function validateState(s){
 if(!s||s.schemaVersion!==2||!s.profile||!s.experiment||!Array.isArray(s.opportunities)||!Array.isArray(s.activities)||!Array.isArray(s.review))throw Error('This is not a Scouter V2 backup.');
 const string=(v)=>typeof v==='string';
 for(const key of ['name','skills','tools','location','radius','availability','incomeGoal','jobSize','urgency','excluded','channels','constraints'])if(!string(s.profile[key]))throw Error('Invalid profile.');
 if(!Array.isArray(s.profile.services)||s.profile.services.some(x=>!string(x.id)||!string(x.name)||typeof x.confirmed!=='boolean'))throw Error('Invalid service profile.');
 for(const key of ['id','name','timezone','question','baselinePlan','comparisonNotes'])if(!string(s.experiment[key]))throw Error('Invalid experiment.');
 if(!validDate(s.experiment.start)||!validDate(s.experiment.end)||s.experiment.start>s.experiment.end)throw Error('Invalid review period.');
 const ids=new Set();
 for(const o of s.opportunities){
  if(!string(o.id)||!o.id||ids.has(o.id))throw Error('Duplicate or missing business ID.');ids.add(o.id);
  for(const key of ['name','type','location','website','contact','service','sourceBrief','question','counter','reason','nextAction','due','draft','subject','ownerResult','problem','workaround','priority','deliveryService','offer','offerTiming'])if(!string(o[key]))throw Error('Invalid opportunity field: '+key);
  if(o.lane!=='digital-services'||!METHODS.includes(o.method)||!['Undecided','Pursue','Pass','Later'].includes(o.decision)||!RESPONSES.includes(o.response)||!['Needs review','Reviewed','Needs revision'].includes(o.reviewStatus)||!['Not discussed','Draft','Sent manually','Accepted','Declined'].includes(o.offerAcceptance))throw Error('Invalid opportunity status.');
  if(typeof o.contactVerified!=='boolean'||typeof o.deliveryConfirmed!=='boolean'||(o.offerPrice!==null&&(!Number.isFinite(o.offerPrice)||o.offerPrice<0)))throw Error('Invalid delivery / offer fields.');
  if(!Array.isArray(o.evidence)||o.evidence.some(e=>!['Fact','Signal','Hypothesis','Unknown'].includes(e.kind)||!['id','text','url','date','provenance'].every(k=>string(e[k]))||!validDate(e.date)))throw Error('Invalid evidence.');
 }
 const activityIds=new Set();
 for(const a of s.activities){
  if(!string(a.id)||!a.id||activityIds.has(a.id))throw Error('Duplicate or missing activity ID.');activityIds.add(a.id);
  for(const k of ['businessId','type','method','date','recipient','message','notes','ownerWords','scope','reference','friction','nextAction','due'])if(!string(a[k]))throw Error('Invalid activity field: '+k);
  if(typeof a.ownerVerified!=='boolean')throw Error('Invalid owner evidence flag.');validateActivity(a,s);
 }
 if(s.review.length!==5||s.review.some(r=>!['question','conclusion','evidence','missing','nextTest'].every(k=>string(r[k]))))throw Error('Invalid review notes.');
 return s;
}
export function migrateV1(leads,state){
 if(!Array.isArray(leads))throw Error('Paste the V1 scout_pipeline JSON array.');
 const result=clone(state);let imported=0,skipped=0;
 for(const lead of leads){
  if(!lead||typeof lead.name!=='string'||!lead.name.trim()||!['string','number'].includes(typeof lead.id))throw Error('Every V1 prospect needs an ID and business name.');
  const legacyId='v1-'+String(lead.id);
  if(result.opportunities.some(o=>o.id===legacyId)){skipped++;continue;}
  const o=newOpportunity({id:legacyId,name:lead.name,type:'Imported V1 prospect',location:typeof lead.address==='string'?lead.address:'',contact:typeof lead.phone==='string'?lead.phone:'',sourceBrief:'V1 snapshot imported. Original fields (status is historical and unverified):\n'+JSON.stringify(lead,null,2),service:'Requalify before pursuing',question:'What result would you most like to improve, if anything?',counter:'Drop the hypothesis if there is no owner priority or delivery fit.',evidence:[{id:legacyId+'-unknown',kind:'Unknown',text:'Confirm current website, operations, recipient and any owner problem. V1 status '+String(lead.status||'unknown')+' has not been verified. Historical hasWebsite value: '+String(lead.hasWebsite)+'.',url:'',date:today(),provenance:'Legacy browser record imported today; original observation date unavailable.'}]});
  result.opportunities.push(o);imported++;
 }
 return {state:validateState(result),imported,skipped};
}
