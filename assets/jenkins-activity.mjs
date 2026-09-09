import { CENSORED, PUBLIC_VIEWS, validateSnapshot, isFresh, duration } from './jenkins-activity-contract.mjs';
import { supportsDemo, details, viewJobs, jobRoute, resolveRoute, demoForJob, mobileBuildSummary, workerProfiles } from './jenkins-activity-model.mjs';
import { DEMOS, getDemo, fieldChoices, defaultRequest, createDemoRun, advanceDemo, approval, stageMessage } from './jenkins-activity-demos.mjs';
import { consoleEvents, demoEmails } from './jenkins-activity-demo-console.mjs';
const $=id=>document.getElementById(id);
let snapshot=null,preview=false,failed=false,pollTimer=null,sortDescending=false;
let demo=null;
let searchQuery="";
let consoleFollow=true,consoleScrollTop=0;
const resultText={SUCCESS:'Success',FAILURE:'Failed',UNSTABLE:'Unstable',ABORTED:'Aborted',NOT_BUILT:'Not built'};
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function link(text,href,cls){const a=el('a',text,cls);a.href=href;return a;}
function button(text,action,cls){const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;}
function icon(kind){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('aria-hidden','true');svg.classList.add('side-icon');const paths={plus:'M12 4v16M4 12h16',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',edit:'m4 16 12-12 4 4-12 12-5 1zM14 6l4 4',settings:'M9 3h6l1 4 4 2v6l-4 2-1 4H9l-1-4-4-2V9l4-2zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',fingerprint:'M3 12a9 9 0 0 1 18 0M6 14v-2a6 6 0 0 1 12 0v5M9 18v-6a3 3 0 0 1 6 0v8M12 12v10',home:'M3 10 12 3 21 10M5 9v12h14V9M9 21v-7h6v7',history:'M4 6v5h5M4 11a8 8 0 1 1 1 7M12 7v5l3 2',views:'M3 4h7v6H3zM14 4h7v6h-7zM3 14h7v6H3zM14 14h7v6h-7z',code:'m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',play:'m7 4 14 8-14 8z',file:'M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8',worker:'M3 4h18v13H3zM8 21h8M12 17v4'};const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',paths[kind]||paths.file);svg.append(p);return svg;}
function status(job){const cls=job.running?'running':(job.last_result||'unknown').toLowerCase();const e=document.createElementNS('http://www.w3.org/2000/svg','svg');e.setAttribute('viewBox','0 0 24 24');e.classList.add('status-icon',cls);e.setAttribute('role','img');e.setAttribute('aria-label',job.running?'Running':resultText[job.last_result]||'Never run');const c=document.createElementNS(e.namespaceURI,'circle');c.setAttribute('cx','12');c.setAttribute('cy','12');c.setAttribute('r','9');const p=document.createElementNS(e.namespaceURI,'path');p.setAttribute('d',job.last_result==='SUCCESS'?'m8 12 3 3 5-6':job.last_result==='FAILURE'?'m8 8 8 8m-8 0 8-8':job.last_result==='ABORTED'?'m6 18 12-12':'M7 12h10');e.append(c,p);return e;}
function weather(score){if(score===null)return el('span','N/A');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('role','img');svg.setAttribute('aria-label','Build health '+score+' percent');svg.classList.add('weather');if(score>=80){svg.innerHTML='<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>';}else{svg.classList.add('cloud');svg.innerHTML='<path d="M6 18a4 4 0 0 1-1-8 6 6 0 0 1 11-2 5 5 0 0 1 2 10Z"/>'; }return svg;}
function age(ms){if(ms===null)return 'N/A';let seconds=Math.max(0,Math.floor((snapshot.generated_at_ms-ms)/1000));const units=[[2592000,'mo'],[86400,'days'],[3600,'hr'],[60,'min'],[1,'sec']];const parts=[];for(const [size,label]of units){const n=Math.floor(seconds/size);if(n){parts.push(n+' '+(label==='days'&&n===1?'day':label));seconds%=size;if(parts.length===2)break;}}return parts.join(' ')||'0 sec';}
function frozen(){return preview||failed||!isFresh(snapshot);}
function title(job){return details(job)?.title||job.name;}
function jobLink(job,view='All',tab='status'){return link(title(job),jobRoute(view,job,tab),job.name===CENSORED?'censored-name':'');}
function navItem(label,href,kind,selected=false){const a=link('',href,selected?'selected':'');a.append(icon(kind),el('span',label));return a;}
function showBlocked(job){$('blocked-title').textContent='Build blocked';$('blocked-dialog').querySelector('p').textContent='Public visitors cannot start Jenkins jobs. No build was submitted.';const available=supportsDemo(job);$('blocked-demo-note').hidden=!available;$('blocked-demo').hidden=!available;$('blocked-demo').onclick=()=>{$('blocked-dialog').close();location.hash='#/demo/'+demoForJob(job);};$('blocked-dialog').showModal();}
$('blocked-close').addEventListener('click',()=>$('blocked-dialog').close());
function blockedControl(label){$('blocked-title').textContent=label+' blocked';$('blocked-dialog').querySelector('p').textContent='This control is unavailable in the public console. No change was submitted.';$('blocked-demo-note').hidden=true;$('blocked-demo').hidden=true;$('blocked-dialog').showModal();}
function sidebar(route){
  const nav=$('side-tasks');nav.replaceChildren();
  const control=(label,kind='file')=>{const b=button('',()=>blockedControl(label));b.dataset.control=label;b.append(icon(kind),el('span',label));return b;};
  if(route.demoId){const d=getDemo(route.demoId);nav.append(navItem('Status','#/demo/'+d.id+'/status','file',route.tab==='status'),navItem('Changes','#/demo/'+d.id+'/status','code'),navItem('Build with Parameters','#/demo/'+d.id,'play',route.tab==='parameters'),control('Configure','settings'),control('Delete Pipeline','trash'),navItem('Console Output','#/demo/'+d.id+'/console','code',route.tab==='console'),navItem('Parameters','#/demo/'+d.id+'/parameters','file'),navItem('Demos','#/view/Demos','views'));}
  else if(route.job){nav.append(navItem('Status',jobRoute(route.view,route.job),'file',route.tab==='status'),navItem('Changes',jobRoute(route.view,route.job,'history'),'code'));const b=button('',()=>showBlocked(route.job));b.append(icon('play'),el('span','Build with Parameters'));nav.append(b,control('Configure','settings'),control('Delete Pipeline','trash'),navItem('Job Config History',jobRoute(route.view,route.job,'code'),'history'),control('Rename','edit'),navItem('Pipeline Syntax',jobRoute(route.view,route.job,'code'),'code'));if(supportsDemo(route.job))nav.append(navItem('Try demo','#/demo/'+demoForJob(route.job),'play'));}
  else{nav.append(control('New Item','plus'),navItem('Build History','#/history','history',route.history),control('Edit View','settings'),control('Delete View','trash'),control('Project Relationship','views'),control('Check File Fingerprint','fingerprint'));}
  nav.append(navItem('Back to Jenkins project','/projects/jenkins/#public-console','home'));
  const queue=$('queue-content');queue.replaceChildren();const queued=snapshot.jobs.filter(j=>j.queued);if(!queued.length)queue.textContent=frozen()?'No builds queued at capture.':'No builds in the queue.';for(const j of queued){const row=el('div',undefined,'queue-job');row.append(jobLink(j),el('span','Waiting'));queue.append(row);}
  const executors=$('executor-content');executors.replaceChildren();
  if(demo&&['running','paused'].includes(demo.state)){
    const d=getDemo(demo.id),row=el('div',undefined,'executor-build demo-executor');
    row.append(el('div','Demo executor / simulation','executor-name'),link(d.title,'#/demo/'+d.id+'/console'),el('span','#1 / '+(demo.state==='paused'?'Waiting for input':d.stages[demo.step]),'executor-stage'));
    const progress=el('progress');progress.max=d.stages.length;progress.value=demo.step;progress.setAttribute('aria-label','Demo stage progress');row.append(progress,button('×',()=>{demo=advanceDemo(demo,'abort');render();},'cancel-build'));executors.append(row);
  }
  const active=snapshot.jobs.filter(j=>j.running);if(!active.length)executors.append(el('p',frozen()?'No real jobs running at capture.':'No real jobs running.'));
  for(const j of active){for(let n=0;n<j.running;n++){const row=el('div',undefined,'executor-build');row.append(el('div','Build executor '+(n+1),'executor-name'),jobLink(j),el('span',(frozen()?'Running at capture / ':'Running / ')+duration((frozen()?snapshot.generated_at_ms:Date.now())-j.running_since_ms),'executor-stage'));const progress=el('progress');progress.setAttribute('aria-label','Build running at capture');row.append(progress,button('×',()=>blockedControl('Cancel build'),'cancel-build'));executors.append(row);}}
  $('history-box').hidden=!route.job&&!route.demoId;
  if(route.demoId){$('sidebar-history').replaceChildren();if(demo?.id===route.demoId)$('sidebar-history').append(link('#1 / '+demo.state,'#/demo/'+route.demoId+'/status'));else $('sidebar-history').append(el('p','No demo builds yet.'));}
  else if(route.job){$('sidebar-history').replaceChildren();for(const [label,ms]of[['Last completed',route.job.last_finished_ms],['Last success',route.job.last_success_ms],['Last failure',route.job.last_failure_ms]]){const row=el('div',undefined,'history-row');row.append(link(label,jobRoute(route.view,route.job,'history')),el('span',age(ms)));$('sidebar-history').append(row);}}
}
function mobileJobCards(jobs,view){
  const list=el('div',undefined,'mobile-jobs-list');
  for(const job of jobs){
    const card=el('article',undefined,'mobile-job-card');
    const detail=jobLink(job,view);detail.classList.add('mobile-job-details');detail.replaceChildren();
    detail.append(el('span',job.running?(frozen()?'Running at capture':'Running'):resultText[job.last_result]||'Never run','sr-only'));
    const copy=el('div',undefined,'mobile-job-copy');copy.append(el('p',title(job),'mobile-job-name'));
    if(job.name===CENSORED)copy.append(el('span','Job '+job.id.slice(4,12).toUpperCase(),'job-id'));
    copy.append(el('span',mobileBuildSummary(job,snapshot.generated_at_ms),'mobile-job-summary'));
    if(job.running||job.queued)copy.append(el('span',[job.running?(frozen()?'Running at capture':'Running'):'',job.queued?'Queued':''].filter(Boolean).join(' / '),'build-state'));
    detail.append(copy);
    const build=button('',()=>showBlocked(job),'mobile-build');build.append(icon('play'));build.setAttribute('aria-label','Build Now: '+title(job));
    card.append(detail,build);list.append(card);
  }
  return list;
}
function mobileDemoCards(){
  const list=el('div',undefined,'mobile-jobs-list');
  for(const d of DEMOS.filter(d=>d.title.toLowerCase().includes(searchQuery.toLowerCase()))){
    const card=el('article',undefined,'mobile-job-card'),detail=link('','#/demo/'+d.id,'mobile-job-details');
    const copy=el('div',undefined,'mobile-job-copy');copy.append(el('p',d.title,'mobile-job-name'),el('span',d.summary,'mobile-job-summary'),el('span','Demo / simulation','job-id'));detail.append(copy);
    const build=link('','#/demo/'+d.id,'mobile-build');build.append(icon('play'));build.setAttribute('aria-label','Open demo: '+d.title);card.append(detail,build);list.append(card);
  }
  return list;
}
function dashboard(route){const jobs=viewJobs(snapshot,route.view).filter(j=>title(j).toLowerCase().includes(searchQuery.toLowerCase()));const root=el('div',undefined,'job-dashboard');const context=el('p',route.view==='Private'?'Names, descriptions, and original view memberships are withheld for these jobs.':route.view==='All'?'All jobs. Select a view or click a job to read its description.':route.view+' view / '+jobs.length+' public jobs','view-context');if(route.view==='All')root.append(context);const wrap=el('div',undefined,'table-scroll');const table=el('table',undefined,'project-table');table.append(el('caption','Jenkins job status, build health, last success, last failure, and last duration.','sr-only'));const head=el('thead'),tr=el('tr');['S','W','Name','Last Success','Last Failure','Last Duration',''].forEach((label,i)=>{const th=el('th',i===2?undefined:label);th.scope='col';if(i===0)th.title='Status of last build';if(i===1)th.title='Weather report: aggregated recent build health';if(i===2)th.append(button('Name '+(sortDescending?'↑':'↓'),()=>{sortDescending=!sortDescending;render();},'sort-button'));tr.append(th);});head.append(tr);table.append(head);const body=el('tbody');jobs.sort((a,b)=>(title(a).localeCompare(title(b))||a.id.localeCompare(b.id))*(sortDescending?-1:1));for(const j of jobs){const row=el('tr');const cells=Array.from({length:7},()=>{const td=el('td');row.append(td);return td;});cells[0].append(status(j));cells[1].append(weather(j.health_score));cells[2].append(jobLink(j,route.view));if(j.name===CENSORED)cells[2].append(el('span','Job '+j.id.slice(4,12).toUpperCase(),'job-id'));if(j.running||j.queued)cells[2].append(el('span',[j.running?(frozen()?'Running at capture':'Running'):'',j.queued?'Queued':''].filter(Boolean).join(' / '),'build-state'));cells[3].append(link(age(j.last_success_ms),jobRoute(route.view,j,'history')));cells[4].append(link(age(j.last_failure_ms),jobRoute(route.view,j,'history')));if(j.last_success_number)cells[3].append(link('#'+j.last_success_number,jobRoute(route.view,j,'history'),'build-badge'));if(j.last_failure_number)cells[4].append(link('#'+j.last_failure_number,jobRoute(route.view,j,'history'),'build-badge'));cells[5].textContent=j.last_duration_ms===null?'N/A':duration(j.last_duration_ms);const b=button('▷',()=>showBlocked(j),'build-now-icon');b.setAttribute('aria-label','Build Now: '+title(j));b.title='Build Now (public execution blocked)';cells[6].append(b);body.append(row);}table.append(body);wrap.append(table);wrap.classList.add('desktop-jobs-table');root.append(wrap,mobileJobCards(jobs,route.view));if(!jobs.length)root.append(el('p','No public jobs in this view.','empty-state'));root.append(el('p','S = build status. W = recent build health. Censored jobs appear under All and Private.','legend'));return root;}
function facts(job){const dl=el('dl',undefined,'detail-facts');for(const [label,value]of[['Last completed result',resultText[job.last_result]||'Never run'],['Last duration',job.last_duration_ms===null?'N/A':duration(job.last_duration_ms)],['Activity',job.running?(frozen()?'Running at capture':'Running'):job.queued?'Queued':job.disabled?'Disabled':'Idle']]){const d=el('div');d.append(el('dt',label),el('dd',value));dl.append(d);}return dl;}
function description(job){const data=details(job),block=el('section',undefined,'job-description');block.append(el('h2',data.title),el('p',data.description));if(data.why)block.append(el('h3','Why I run it'),el('p',data.why));if(data.schedule){block.append(el('p','Schedule: '+data.schedule,'job-schedule'));if(data.cron)block.append(el('code',data.cron,'cron-expression'));if(data.scheduleSource)block.append(el('p',data.scheduleSource,'source-note'));}if(job.name===CENSORED){block.append(facts(job));return block;}if(data.stages){block.append(el('h3','What it does, stage by stage'));const table=el('table');const head=el('tr');const purposes=data.stages.some(row=>row[1]);head.append(el('th','Stage'));if(purposes)head.append(el('th','Purpose'));table.append(head);for(const [stage,purpose]of data.stages){const row=el('tr');row.append(el('td',stage));if(purposes)row.append(el('td',purpose));table.append(row);}block.append(table);}block.append(facts(job),el('p','Public description reviewed from the job definition. Internal addresses, credentials, parameters, and operational links are withheld.','source-note'));return block;}
function codeDetails(job){const block=el('section',undefined,'job-description');block.append(el('h2','Infrastructure as code'));if(job.name===CENSORED){block.append(el('p','Implementation details are withheld for this job.'));return block;}block.append(el('p','I keep the job definition and its execution steps in Git. Changes pass review before the pipeline uses them.'));const grid=el('div',undefined,'code-stack');for(const [name,body]of[['Configuration as Code','Defines controller settings and the available worker templates.'],['Job DSL','Defines the job, its description, parameters, and schedules.'],['Jenkinsfile','Defines the execution stages and calls the tools that perform the work.']]){const section=el('section');section.append(el('strong',name),el('p',body));grid.append(section);}block.append(grid);if(demoForJob(job)==='vm-provision')block.append(el('h3','Provisioning responsibilities'),el('p','Jenkins coordinates the request and records the result. Terraform manages the VM infrastructure. Operating-system configuration happens after creation. The Linux workflow uses Ansible for that configuration.'));block.append(el('p','This tab explains the source structure. It does not expose the private repository or an editable job configuration.','source-note'));return block;}
function workerDetails(job){
  const block=el('section',undefined,'job-description');
  block.append(el('h2','Kubernetes and build workers'));
  if(job.name===CENSORED){block.append(el('p','Worker details are withheld for this job.'));return block;}
  for(const profile of workerProfiles(job)){
    const card=el('section',undefined,'worker-profile');
    card.append(el('h3',profile.title));
    const facts=el('dl',undefined,'worker-facts');
    for(const [label,value] of [['Image',profile.image],['Runs on',profile.environment],['Tools included',profile.tools]]){
      const row=el('div');row.append(el('dt',label),el('dd',value));facts.append(row);
    }
    card.append(facts,el('p',profile.purpose),el('p',profile.lifecycle));block.append(card);
  }
  block.append(el('p','These are the worker environments declared in Git. Custom image names omit the private registry address; the running image version has not been independently verified.','source-note'));
  return block;
}
function historyPage(job=null){const root=el('section',undefined,'job-description');root.append(el('h2','Build History'),el('p',job?'Milestones from the captured build metadata.':'Latest completed build for each job in the captured inventory.'));const jobs=job?[job]:[...snapshot.jobs].sort((a,b)=>(b.last_finished_ms||0)-(a.last_finished_ms||0));const table=el('table');const th=el('tr');th.append(el('th',job?'Milestone':'Job'),el('th','Result'),el('th','Time'));table.append(th);if(job){for(const [label,result,ms]of[['Last completed',resultText[job.last_result]||'Never run',job.last_finished_ms],['Last successful','Success',job.last_success_ms],['Last failed','Failed',job.last_failure_ms]]){const row=el('tr');row.append(el('td',label),el('td',ms===null?'N/A':result),el('td',ms===null?'N/A':new Date(ms).toLocaleString()));table.append(row);}}else{for(const j of jobs){const row=el('tr'),name=el('td');name.append(jobLink(j));row.append(name,el('td',resultText[j.last_result]||'Never run'),el('td',age(j.last_finished_ms)));table.append(row);}}root.append(table,el('p','Console logs, artifacts, and build inputs are not included.','source-note'));return root;}
function demosView(){
  const root=el('section',undefined,'demo-dashboard');root.append(el('p','Build forms and pipeline stages for VM and user workflows. Builds in this view are simulations.','view-context'));
  const wrap=el('div',undefined,'table-scroll'),table=el('table',undefined,'project-table demo-table');
  const head=el('thead'),row=el('tr');for(const label of ['S','Name','Description','']){const th=el('th',label);th.scope='col';row.append(th);}head.append(row);table.append(head);
  const body=el('tbody');for(const d of DEMOS.filter(d=>d.title.toLowerCase().includes(searchQuery.toLowerCase()))){const tr=el('tr'),mark=el('td','▷','demo-mark'),name=el('td'),description=el('td',d.summary),action=el('td');name.append(link(d.title,'#/demo/'+d.id),el('span','Demo','job-id'));action.append(link('▷','#/demo/'+d.id,'build-now-icon'));tr.append(mark,name,description,action);body.append(tr);}table.append(body);wrap.append(table);wrap.classList.add('desktop-jobs-table');root.append(wrap,mobileDemoCards());return root;
}
function demoForm(definition){
  const root=el('section',undefined,'parameter-page');root.append(el('h1','Pipeline '+definition.title,'job-heading'),el('p','This build requires parameters:'),el('p','Simulation. Parameter names and choices follow the job definition; directory results are fictional.','simulation-note'));
  if(definition.id==='user-provision')root.append(el('p','Try a new sample account, or use demo-existing to see the reconcile gate. Search for demo to select a fictional manager.','parameter-help'));
  const form=el('form',undefined,'jenkins-parameters');const controls=new Map();
  const values=()=>Object.fromEntries(definition.fields.map(f=>[f.name,f.kind==='checkboxes'?[...controls.get(f.name).querySelectorAll('input:checked')].map(c=>c.value):f.kind==='boolean'?controls.get(f.name).checked:controls.get(f.name).value]));
  const refresh=()=>{const current=values();for(const f of definition.fields.filter(f=>f.kind==='cascade')){const c=controls.get(f.name),old=c.value;c.replaceChildren();for(const value of fieldChoices(f,current)){const o=el('option',value);o.value=value;c.append(o);}if([...c.options].some(o=>o.value===old))c.value=old;}};
  for(const f of definition.fields){
    const group=el('div',undefined,'parameter-row'),label=el('label',f.name),help=el('p',f.help,'parameter-help');let control;
    if(f.kind==='checkboxes'){control=el('div',undefined,'parameter-checkboxes');for(const value of f.values){const l=el('label'),input=el('input');input.type='checkbox';input.value=value;l.append(input,el('span',value));control.append(l);}}
    else if(f.values){control=el('select');for(const value of f.values){const option=el('option',value);option.value=value;control.append(option);}control.value=f.default;}
    else{control=el('input');control.type=f.kind==='boolean'?'checkbox':'text';if(f.kind==='boolean')control.checked=f.default;else{control.value=f.default;control.maxLength=100;control.autocomplete='off';}}
    control.id='parameter-'+f.name;control.name=f.name;label.htmlFor=control.id;help.id=control.id+'-help';control.setAttribute('aria-describedby',help.id);controls.set(f.name,control);
    group.append(label,help,control);form.append(group);
  }
  for(const name of ['DEPARTMENT','STORAGE','MANAGER_SEARCH'])controls.get(name)?.addEventListener('change',refresh);
  controls.get('MANAGER_SEARCH')?.addEventListener('input',refresh);
  controls.get('MANAGER_SEARCH')?.addEventListener('blur',refresh);
  const error=el('p');error.role='alert';
  const build=button('▷ Build',()=>{try{refresh();demo=createDemoRun(definition.id,values());consoleFollow=true;consoleScrollTop=0;location.hash='#/demo/'+definition.id+'/console';render();}catch(e){error.textContent=e.message;}},'primary-button');
  const actions=el('div',undefined,'parameter-actions');actions.append(build,link('Cancel','#/view/Demos','secondary-button'));form.append(error,actions);form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type==='text'){e.preventDefault();build.click();}});root.append(form);return root;
}
function demoPage(id,tab='parameters'){
  const d=getDemo(id);if(tab==='parameters')return demoForm(d);
  const root=el('section',undefined,'demo-build-page');root.append(el('h1',d.title+' #1','job-heading'),el('p','Demo build / simulation','simulation-note'));
  if(!demo||demo.id!==id){root.append(el('p',d.summary),link('Build with Parameters','#/demo/'+id,'primary-button'));return root;}
  const tabs=el('nav',undefined,'detail-tabs');tabs.append(link('Status','#/demo/'+id+'/status'),link('Console Output','#/demo/'+id+'/console'),link('Build with Parameters','#/demo/'+id));root.append(tabs);
  root.append(el('p',demo.state==='completed'?'Finished: SUCCESS':demo.state==='failed'?'Finished: FAILURE':demo.state==='aborted'?'Finished: ABORTED':demo.state==='paused'?'Paused for Input':'Build in progress','build-outcome '+demo.state));
  const emails=demoEmails(demo),latestEmail=emails.at(-1);
  if(latestEmail){
    const mail=el('section',undefined,'demo-email');mail.setAttribute('aria-label','Simulated email');
    mail.append(el('div','Email sent / simulation','email-label'),el('strong',latestEmail.subject),el('p','To: '+latestEmail.to));
    const detail=el('details');detail.append(el('summary','View email'),el('p',latestEmail.body));mail.append(detail);
    if(latestEmail.pending)mail.append(button('Review & approve',()=>{const gate=$('demo-approval');gate.scrollIntoView({block:'center',behavior:'smooth'});gate.focus({preventScroll:true});},'email-review'));
    root.append(mail);
  }
  if(tab==='console'){
    const tools=el('div',undefined,'console-tools'),label=el('label'),follow=el('input');follow.type='checkbox';follow.checked=consoleFollow;follow.addEventListener('change',()=>{consoleFollow=follow.checked;if(consoleFollow){const log=$('demo-console');log.scrollTop=log.scrollHeight;}});label.append(follow,el('span','Follow output'));tools.append(el('h2','Console Output'),label);root.append(tools);
    const output=el('pre',undefined,'console-output');output.id='demo-console';output.tabIndex=0;output.setAttribute('aria-label','Simplified Jenkins console output');
    for(const event of consoleEvents(demo)){const line=el('span',event.text+'\n','console-line log-'+event.kind);output.append(line);}
    root.append(output);
  }else{
    const wrap=el('div',undefined,'table-scroll stage-view'),table=el('table');const tr=el('tr'),states=el('tr');d.stages.forEach((stage,i)=>{tr.append(el('th',stage));const cls=demo.skipped.includes(i)?'skipped':i<demo.step?'success':i===demo.step?demo.state:'pending';states.append(el('td',cls==='success'?'✓':cls==='skipped'?'Skipped':cls==='paused'?'Input':cls==='running'?'In progress':cls==='pending'?'':cls,cls));});table.append(tr,states);wrap.append(table);root.append(el('h2','Stage View'),wrap);
    if(demo.state==='running')root.append(el('p',stageMessage(demo)));
    if(demo.error)root.append(el('p',demo.error,'notice'));
    if(['completed','failed','aborted'].includes(demo.state))root.append(el('p','This was a simulation. No real accounts or infrastructure changed.'));
  }
  if(demo.state==='paused'){
    const gate=approval(demo),box=el('section',undefined,'input-gate');box.id='demo-approval';box.tabIndex=-1;box.append(el('h2','Input requested'),el('p',gate.message));
    if(gate.secondOperator)box.append(el('p','Requester: demo.requester / Approver: demo.approver'));
    box.append(button(gate.label,()=>{demo=advanceDemo(demo,'approve');render();},'primary-button'),button('Abort',()=>{demo=advanceDemo(demo,'abort');render();}));root.append(box);
  }else if(demo.state==='running')root.append(button('Stop build',()=>{demo=advanceDemo(demo,'abort');render();}));
  return root;
}
function jobPage(route){const job=route.job,root=el('div');root.append(el('h1',title(job),'job-heading'),el('p','Pipeline / Public job '+job.id.slice(4,12).toUpperCase(),'job-subtitle'));const toolbar=el('div',undefined,'job-toolbar');toolbar.append(button('▷ Build Now',()=>showBlocked(job)));if(supportsDemo(job))toolbar.append(link('Try demo','#/demo/'+demoForJob(job),'primary-button'));root.append(toolbar);const tabs=el('nav',undefined,'detail-tabs');tabs.setAttribute('aria-label','Job details');for(const [tab,label]of[['status','Status'],['description','Description'],['code','Infrastructure as code'],['workers','Kubernetes / Workers'],['history','Build History'],...(supportsDemo(job)?[['demo','Demo']]:[])]){const a=link(label,jobRoute(route.view,job,tab));if(tab===route.tab)a.setAttribute('aria-current','page');tabs.append(a);}root.append(tabs);const panel=route.tab==='code'?codeDetails(job):route.tab==='workers'?workerDetails(job):route.tab==='history'?historyPage(job):route.tab==='demo'?demoPage(demoForJob(job)):description(job);root.append(panel);return root;}
function render(){if(!snapshot)return;const previousConsole=$('demo-console');if(previousConsole)consoleScrollTop=previousConsole.scrollTop;const route=resolveRoute(location.hash,snapshot);document.body.dataset.view=route.job||route.demoId?'job':route.view||'';document.body.classList.toggle('has-breadcrumbs',!!route.job||!!route.demoId||!!route.view&&route.view!=='All');$('mobile-view-edit').hidden=route.view!=='All'||!!route.job||!!route.demoId||!!route.history;const bc=$('breadcrumbs');bc.replaceChildren();if(route.view&&route.view!=='All')bc.append(el('span','/','slash'),link(route.view,'#/view/'+route.view));if(route.demoId)bc.append(el('span','/','slash'),el('span',getDemo(route.demoId).title));if(route.job)bc.append(el('span','/','slash'),el('span',title(route.job)));$('feed-state').textContent=preview?'Captured snapshot':failed||!isFresh(snapshot)?'Updates unavailable':'Feed current';$('feed-time').textContent=new Date(snapshot.generated_at_ms).toLocaleString()+(frozen()?' / times fixed at capture':' / refreshes every 15 sec');$('feed-notice').hidden=preview||(!failed&&isFresh(snapshot));$('feed-notice').textContent='Updates are unavailable. These are last-known states; running builds may have finished.';const viewIntro=$('view-intro');viewIntro.hidden=!!route.job||!!route.demoId||route.history||route.view==='All';$('view-description').textContent=route.view==='IAM'?'Jobs carrying the [IAM] display label; reconciled at controller startup.':route.view==='Demos'?'Parameter forms and pipeline stages for VM and user demonstrations.':route.view==='Private'?'Job names and operational details are withheld for this view.':'Jobs in the '+route.view+' view.';const tabs=$('view-tabs');tabs.hidden=!!route.job||!!route.demoId;tabs.replaceChildren();for(const view of ['AIOps','All','Demos',...PUBLIC_VIEWS.filter(v=>!['All','AIOps'].includes(v))]){const a=link(view,'#/view/'+view);if(route.view===view)a.setAttribute('aria-current','page');tabs.append(a);}sidebar(route);$('main-content').replaceChildren(route.missing?el('p','This public view or job is unavailable.','empty-state'):route.demoId?demoPage(route.demoId,route.tab):route.demos?demosView():route.job?jobPage(route):route.history?historyPage():dashboard(route));$('inventory-caption').textContent=snapshot.jobs.length+' jobs / '+snapshot.jobs.filter(j=>j.name===CENSORED).length+' names withheld';const consoleOutput=$('demo-console');if(consoleOutput)consoleOutput.scrollTop=consoleFollow?consoleOutput.scrollHeight:consoleScrollTop;}
export function displaySnapshot(value,options={}){snapshot=validateSnapshot(value);preview=options.captured===true||options.preview===true;failed=options.failed===true;render();}
window.addEventListener('hashchange',()=>{document.body.classList.remove('breadcrumbs-expanded');$('mobile-breadcrumbs').setAttribute('aria-expanded','false');render();window.scrollTo(0,0);$('main-panel').focus({preventScroll:true});});
async function update(url,options={}){try{const response=await fetch(url,{credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error();const reader=response.body.getReader(),chunks=[];let size=0;for(;;){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024){await reader.cancel();throw new Error();}chunks.push(value);}const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.byteLength;}const data=validateSnapshot(JSON.parse(new TextDecoder().decode(bytes)));if(snapshot&&data.generated_at_ms<snapshot.generated_at_ms)throw new Error();displaySnapshot(data,options);}catch{failed=true;if(snapshot)render();else{$('feed-state').textContent='Feed unavailable';}}}
const configured=document.querySelector('meta[name="activity-feed"]').content;
const captured=document.querySelector('meta[name="activity-snapshot"]')?.content;
if(configured){const url=new URL(configured,location.href);if(url.origin===location.origin||url.origin==='https://topology-feed.billgernert.com'){const poll=async()=>{await update(url);pollTimer=setTimeout(poll,15000);};poll();}}
else if(captured){const url=new URL(captured,location.href);if(url.origin===location.origin)update(url,{captured:true});}
setInterval(()=>{if(snapshot&&!preview&&!failed&&!isFresh(snapshot)){failed=true;render();}},1000);
window.addEventListener('pagehide',()=>clearTimeout(pollTimer));

setInterval(()=>{if(demo?.state==='running'){demo=advanceDemo(demo,'tick');const route=resolveRoute(location.hash,snapshot);if(route.demoId&&route.tab==='parameters')sidebar(route);else render();}},1800);

$('header-search').addEventListener('input',e=>{searchQuery=e.target.value;render();});
$('search-toggle').addEventListener('click',()=>{$('header-search').hidden=!$('header-search').hidden;if(!$('header-search').hidden)$('header-search').focus();});
$('manage-control').addEventListener('click',()=>blockedControl('Manage Jenkins'));
$('more-control').addEventListener('click',()=>blockedControl('More actions'));

$('view-edit').addEventListener('click',()=>blockedControl('Edit description'));

$('mobile-view-edit').addEventListener('click',()=>blockedControl('Edit description'));
$('mobile-breadcrumbs').addEventListener('click',()=>{
  const open=document.body.classList.toggle('breadcrumbs-expanded');
  $('mobile-breadcrumbs').setAttribute('aria-expanded',String(open));
});
for(const box of document.querySelectorAll('.side-box')){
  const heading=box.querySelector('h2'),content=heading.nextElementSibling;
  const label=heading.textContent.replace('⌄','').trim();
  const toggle=button('',()=>{
    content.hidden=!content.hidden;
    toggle.setAttribute('aria-expanded',String(!content.hidden));
  },'side-box-toggle');
  toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-controls',content.id);
  toggle.append(el('span',label),el('span','⌄','collapse-arrow'));heading.replaceChildren(toggle);
}
