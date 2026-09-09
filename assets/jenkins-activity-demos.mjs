import { DEMOS, getDemo } from './jenkins-activity-demo-definitions.mjs';
export { DEMOS, getDemo };
export const TITLES = {
  'Service Desk':['Service Desk Analyst','Senior Service Desk Analyst','Service Desk Lead','Service Desk Manager'],
  'SysAdmin':['Systems Administrator','Senior Systems Administrator','Infrastructure Engineer','IT Operations Manager'],
  'Platform':['Platform Engineer','Senior Platform Engineer','DevOps Engineer','Platform Engineering Manager'],
  'NetOps':['Network Administrator','Network Engineer','Senior Network Engineer','Network Operations Manager']
};
const managers=['demo.manager - Demo Manager','demo.lead - Demo Lead'];
export function fieldChoices(field,values) {
  if(field.name==='TITLE')return TITLES[values.DEPARTMENT]||TITLES['Service Desk'];
  if(field.name==='MANAGER'){
    const q=(values.MANAGER_SEARCH||'').trim().toLowerCase();
    if(q.length<2)return ['-- type at least 2 characters in MANAGER_SEARCH --'];
    const matches=managers.filter(m=>m.toLowerCase().includes(q));return matches.length?matches:['-- no matches --'];
  }
  if(['DISK_GB','DATA_DISK_GB'].includes(field.name)&&field.kind==='cascade'&&values.STORAGE==='NVMe')return field.values.filter(v=>v==='None'||Number(v)<=400);
  return field.values;
}
export function defaultRequest(id){return Object.fromEntries(getDemo(id).fields.map(f=>[f.name,Array.isArray(f.default)?[...f.default]:f.default]));}
export function createDemoRun(id, values, key=id) {
  const d=getDemo(id);if(!d)throw new Error('Unknown demo.');
  const params={};
  for(const f of d.fields){
    const v=values[f.name];
    if(f.kind==='boolean'){if(typeof v!=='boolean')throw new Error(f.name+' must be a checkbox value.');params[f.name]=v;}
    else if(f.kind==='checkboxes'){if(!Array.isArray(v)||v.some(x=>!f.values.includes(x))||new Set(v).size!==v.length)throw new Error('Choose valid '+f.name+' options.');params[f.name]=[...v];}
    else if(f.values){if(!fieldChoices(f,values).includes(v))throw new Error('Choose a valid '+f.name+'.');params[f.name]=v;}
    else{if(typeof v!=='string'||v.length>100||/[<>\r\n]/.test(v))throw new Error('Use a short sample value for '+f.name+'.');params[f.name]=v.trim();}
  }
  return {id,key,params,step:0,state:'running',startedAt:Date.now(),endedAt:null,skipped:[],error:null};
}
function failure(run,stage){
  const p=run.params;
  if(stage==='Gate'&&(!p.CONFIRM||!p.SAM))return !p.CONFIRM?'CONFIRM not ticked - refusing to offboard':'SAM is empty';
  if(stage==='Validate SAM available'){
    if(!p.SAM)return 'SAM is empty';
    if(!p.GIVEN_NAME||!p.SURNAME)return 'First name and last name are required.';
    if(!managers.includes(p.MANAGER))return 'Select a manager from the fictional directory.';
  }
  if(stage==='Validate input'){
    if(!p.VM_NAME)return 'VM_NAME is required';
    const pattern=run.id.startsWith('vm-deprovision')?/^[a-zA-Z0-9-]+$/:/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    if(!pattern.test(p.VM_NAME))return 'VM_NAME contains invalid characters.';
    if(run.id==='vm-provision-windows'&&p.VM_NAME.length>15)return 'Windows VM_NAME must be at most 15 characters.';
    if(p.FEATURES?.includes('Hyper-V')&&!p.NESTED_VIRT)return 'Hyper-V requires NESTED_VIRT.';
  }
  if(stage==='Validate provision target'&&p.ROLE!=='infra')return 'This provisioning target is not currently supported. Select infra for this example.';
  return null;
}
function shouldSkip(run,stage){const p=run.params;return (stage==='Configure CI runner (Ansible)'&&p.CONFIG_PROFILE!=='ci-runner')||(stage==='Move disk to NVMe'&&p.STORAGE!=='NVMe')||(stage==='Add data disk'&&p.DATA_DISK_GB==='None')||(stage==='Name collision gate'&&p.SAM!=='demo-existing');}
export function approval(run){
  const stage=getDemo(run.id).stages[run.step];
  if(stage==='Four-eyes approval')return {label:'Approve offboard',message:'Disable and offboard '+run.params.SAM+'? Approval must come from a different authorized operator.',secondOperator:true};
  if(stage==='Name collision gate')return {label:'RECONCILE EXISTING USER',message:run.params.SAM+' already exists in the fictional directory. Proceed reconciles this existing account.'};
  if(stage==='Approval')return {label:run.id.startsWith('vm-deprovision')?'Destroy':'Apply',message:run.id.startsWith('vm-deprovision')?'PERMANENTLY DESTROY '+run.params.VM_NAME+'?':'Apply the reviewed plan for '+run.params.VM_NAME+'?'};
  return null;
}
export function advanceDemo(run,action,operator='demo.approver'){
  if(!['running','paused'].includes(run.state))throw new Error('This build has ended.');
  if(action==='abort')return {...run,state:'aborted',endedAt:Date.now()};
  if(run.state==='paused'){
    if(action!=='approve')throw new Error('This stage requires approval.');
    if(approval(run)?.secondOperator&&operator!=='demo.approver')throw new Error('The approver must differ from the requester.');
  }else if(action!=='tick')throw new Error('No approval is pending.');
  const d=getDemo(run.id),error=failure(run,d.stages[run.step]);
  if(error)return {...run,state:'failed',error,endedAt:Date.now()};
  let step=run.step+1;const skipped=[...run.skipped];
  while(step<d.stages.length&&shouldSkip(run,d.stages[step])){skipped.push(step);step++;}
  const next={...run,step,skipped,state:step===d.stages.length?'completed':'running',endedAt:step===d.stages.length?Date.now():null};
  if(next.state==='running'&&approval(next))next.state='paused';
  return next;
}
export function stageMessage(run){
  const stage=getDemo(run.id).stages[run.step];
  if(stage==='Terraform Plan')return 'Plan: 1 to add, 0 to change, 0 to destroy.';
  if(stage==='Terraform Plan (destroy)')return 'Plan: 0 to add, 0 to change, 1 to destroy.';
  if(stage==='Four-eyes approval')return 'Requested by demo.requester. Waiting for a different operator.';
  return stage?'Simulating '+stage+'.':'Simulation completed.';
}
