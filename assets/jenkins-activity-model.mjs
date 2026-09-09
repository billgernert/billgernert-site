import { CENSORED, PUBLIC_VIEWS } from './jenkins-activity-contract.mjs';
import { JOB_CATALOG } from './jenkins-activity-catalog.mjs';
export const TABS = ['status','description','code','workers','history','demo'];
import { DEMOS, getDemo } from './jenkins-activity-demos.mjs';
export function demoForJob(job) { return DEMOS.find(d=>d.job===job?.name)?.id||null; }
export function supportsDemo(job) { return demoForJob(job)!==null; }
export function details(job) {
  return job.name === CENSORED ? {title:CENSORED,description:'The name, description, implementation, and original view memberships of this job are withheld for security.'} : JOB_CATALOG[job.name];
}
export function viewJobs(snapshot, view='All') {
  if (!PUBLIC_VIEWS.includes(view)) return [];
  return snapshot.jobs.filter(j=>view==='All'||j.views.includes(view));
}
export function jobRoute(view,job,tab='status') {
  return '#/view/'+encodeURIComponent(view)+'/job/'+job.id+'/'+tab;
}
export function resolveRoute(hash,snapshot) {
  const parts=hash.replace(/^#\/?/,'').split('/');
  if(parts[0]==='demo') {
    const alias=parts[1]==='linux'?'Linux':parts[1]==='windows'?'Windows':null;
    const demoId=alias?(alias==='Windows'?'vm-provision-windows':'vm-provision'):parts[1];
    return parts.length<=3&&getDemo(demoId)&&(!parts[2]||['status','console','parameters'].includes(parts[2]))?{view:'Demos',demoId,tab:parts[2]||'parameters'}:{missing:true};
  }
  if(parts[0]==='view'&&parts[1]==='Demos')return parts.length===2?{view:'Demos',demos:true}:{missing:true};
  if(parts[0]==='history') return {view:'All',history:true};
  if(parts[0]!=='view') return {view:'All'};
  let view;try{view=decodeURIComponent(parts[1]);}catch{return {missing:true};}
  if(!PUBLIC_VIEWS.includes(view))return {missing:true};
  if(!parts[2])return {view};
  if(parts[2]!=='job')return {missing:true};
  const job=viewJobs(snapshot,view).find(j=>j.id===parts[3]);
  const tab=parts[4]||'status';
  if(!job||!TABS.includes(tab)||(tab==='demo'&&!supportsDemo(job)))return {missing:true};
  return {view,job,tab};
}
