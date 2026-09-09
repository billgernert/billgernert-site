// Authored, simplified output only. Never consumes Jenkins logs or sends mail.
import { getDemo, approval } from './jenkins-activity-demos.mjs';
function gateAt(run,index){return approval({...run,step:index});}
function recipient(run){return run.id.startsWith('user-')?'Identity operators (demo)':'Platform operators (demo)';}
export function demoEmails(run){
  const d=getDemo(run.id),messages=[];
  for(let i=0;i<d.stages.length&&i<=run.step;i++){
    if(run.skipped.includes(i))continue;
    const gate=gateAt(run,i);if(!gate)continue;
    // A gate is reached before its email is rendered. Failed prior stages never reach it.
    messages.push({id:'approval-'+i,stage:i,kind:'approval',to:recipient(run),
      subject:(run.id.startsWith('vm-deprovision')?'Approval required: destroy ':run.id==='user-deprovision'?'Approval required: offboard ':run.id==='user-provision'?'Reconcile existing user: ':'Approval required: provision ')+(run.params.VM_NAME||run.params.SAM),
      body:gate.message,pending:run.step===i&&run.state==='paused'});
  }
  const vm=run.id.startsWith('vm-');
  if(vm&&(['completed','failed'].includes(run.state)||(run.state==='aborted'&&run.id.startsWith('vm-provision')))){
    messages.push({id:'result',kind:'result',to:recipient(run),subject:(run.state==='completed'?(run.id.startsWith('vm-deprovision')?'VM Decommissioned: ':'VM Provisioned: '):'VM workflow '+run.state+': ')+run.params.VM_NAME,body:run.state==='completed'?'The workflow finished successfully. The build record contains the result.':'The workflow stopped. Review the build output before retrying.',pending:false});
  }
  return messages;
}
function ansible(run,playbook,play,tasks){
  const host=run.params.VM_NAME||'demo-server';
  const lines=[{kind:'command',text:'[Pipeline] sh'}, {kind:'command',text:'+ ansible-playbook '+playbook+' -i demo-inventory'}, {kind:'ansible',text:'PLAY ['+play+'] ********************************************************'}, {kind:'ansible',text:'TASK [Gathering Facts] ***************************************************'}, {kind:'ok',text:'ok: ['+host+']'}];
  for(const [task,result]of tasks)lines.push({kind:'ansible',text:'TASK ['+task+']'}, {kind:result,text:result+': ['+host+']'});
  const changed=tasks.filter(t=>t[1]==='changed').length;
  lines.push({kind:'ansible',text:'PLAY RECAP **************************************************************'}, {kind:'ok',text:host+' : ok='+(tasks.length+1)+' changed='+changed+' unreachable=0 failed=0 skipped=0 rescued=0 ignored=0'});
  return lines;
}
function stageOutput(run,stage){
  const p=run.params,win=run.id==='vm-provision-windows',name=p.VM_NAME||p.SAM;
  if(stage==='Configure (Ansible)')return ansible(run,win?'configure-host-windows.yml':'configure-host.yml',win?'Configure a freshly provisioned Windows host':'Configure a freshly provisioned host',win?[['Windows baseline and firewall','changed'],['Monitoring and security agents','changed'],...(p.TOOLS?.length?[['Install selected tools: '+p.TOOLS.join(', '),'changed']]:[]),...(p.FEATURES?.length?[['Enable selected Windows features: '+p.FEATURES.join(', '),'changed']]:[])]:[['OS baseline and firewall','changed'],['Monitoring and log forwarding','changed'],['Automatic patch policy','changed']]);
  if(stage==='Configure CI runner (Ansible)')return ansible(run,'configure-ci-runner.yml','Configure a Gitea Actions CI runner',[['Container runtime','changed'],['Install and register the CI runner','changed']]);
  if(stage==='Initial security patch')return ansible(run,win?'patch-new-host-windows.yml':'patch-new-host-linux.yml','Bring the new host to the current security baseline',[['Install available security updates','changed'],['Wait for the patched host','ok'],['Require a fully applied security baseline','ok']]);
  if(stage==='Operational readiness')return [...ansible(run,win?'verify-new-host-windows.yml':'verify-new-host-linux.yml',win?'Verify Windows operational readiness':'Verify Linux operational readiness',[['Gather required service state','ok'],['Check firewall and security settings','ok'],['Confirm no pending reboot','ok']]),{kind:'ok',text:'Readiness checks passed: management, security enrollment and backup coverage.'}];
  if(stage==='DNS Register')return ansible(run,'register-dns.yml','Register host DNS',[['Create forward record','changed'],['Check reverse record','ok'],...(p.PUBLISH_DNS?[['Create published record','changed']]:[])]);
  const lines={
    'Validate input':['Validating request for '+name+'.','Required parameters and name format accepted.'],
    'Checkout':['[Pipeline] checkout','Checking out the reviewed pipeline and infrastructure definitions.'],
    'Validate provision target':['Provisioning target accepted: '+p.ROLE+'.'],
    'Name collision check':['Checking the sample inventory and directory.','No conflicting object found for '+name+'.'],
    'Resolve existing VM':['Looking for an existing VM.','New VM request; no existing instance to reconcile.'],
    'Allocate IP from NetBox':['Reserving an address in the sample inventory.','Address reservation recorded.'],
    'Select Node':['Checking available compute capacity.','Selected an eligible virtualization node.'],
    'Generate local-admin password':['Preparing the Windows local administrator credential.','Secret output suppressed.'],
    'Resolve Template':['Resolved Windows Server '+p.TEMPLATE_OS+' template.'],
    'Terraform Plan':['[Pipeline] sh','+ terraform plan','Terraform will perform the following actions:','  + virtual_machine.'+name,'Plan: 1 to add, 0 to change, 0 to destroy.','Saved the plan for operator review.'],
    'Terraform Plan (destroy)':['[Pipeline] sh','+ terraform plan -destroy','Terraform will perform the following actions:','  - virtual_machine.'+name,'Plan: 0 to add, 0 to change, 1 to destroy.','The destroy plan targets the selected VM.'],
    'Terraform Apply':['[Pipeline] sh','+ terraform apply <approved-plan>','virtual_machine.'+name+': Creating...','virtual_machine.'+name+': Creation complete','Apply complete! Resources: 1 added, 0 changed, 0 destroyed.'],
    'Register Zabbix':['Registering '+name+' for monitoring.','Monitoring registration complete; credential output suppressed.'],
    'Wait for WinRM':['Waiting for Windows remote management.','WinRM is ready.'],
    'Expand OS disk':['Expanding the OS disk to '+p.DISK_GB+' GB.','Windows partition expanded.'],
    'Move disk to NVMe':['Moving the OS disk to the selected NVMe storage.','Disk migration complete.'],
    'Add data disk':['Attaching a '+p.DATA_DISK_GB+' GB data disk.','Data disk attached.'],
    'Write host manifest':['Recording the VM configuration and readiness checks in Git.','Opening the configuration record for review.','Record accepted in this simulation.'],
    'Remove host manifest':['Removing the managed host record before infrastructure deletion.','Host record removal completed.'],
    'Terraform Destroy':['[Pipeline] sh','+ terraform apply <approved-destroy-plan>','virtual_machine.'+name+': Destroying...','virtual_machine.'+name+': Destruction complete','Apply complete! Resources: 0 added, 0 changed, 1 destroyed.'],
    'Release IP from NetBox':['Releasing the address reservation after VM destruction.','Reservation released.'],
    'Deregister Zabbix':['Removing the retired host from monitoring.','Monitoring registration removed.'],
    'Deregister Wazuh':['Removing the retired security-agent registration.','Security-agent registration removed.'],
    'Purge per-host Vault secrets':['Removing credentials belonging to the retired host.','Credential values suppressed.'],
    'DNS Deregister':['Removing the retired host DNS records.','DNS cleanup complete.'],
    'AD + DNS Deregister':['Removing the retired Windows computer account and DNS records.','Directory and DNS cleanup complete.'],
    'Delete workspace':['Checking the Terraform workspace is empty.','Empty workspace deleted.'],
    'Validate SAM available':['[Pipeline] powershell','Checking account '+name+' in the fictional directory.',name==='demo-existing'?'Existing account found; reconciliation approval required.':'Account name is available.'],
    'Password -> Vault + wrap':['Preparing a temporary account credential and one-time handoff.','Credential and token values suppressed.'],
    'Load role':['Loading department role: '+p.DEPARTMENT+'.','Resolved directory and cloud access assignments.'],
    'AD user (Windows)':['[Pipeline] powershell',(name==='demo-existing'?'Reconciling existing':'Creating')+' directory account '+name+'.','Applying department, title, manager and group assignments.','Directory account configured.'],
    'Entra (Linux)':['[Pipeline] sh','Running the cloud identity provisioning helper.','Cloud identity and required access assignments reconciled.'],
    'Gate':['CONFIRM accepted.','Request recorded for '+name+' by demo.requester.'],
    'Lookup target (read-only)':['[Pipeline] powershell','Reading the target account and current memberships.','Account context ready for the second operator.'],
    'Snapshot offboard state':['Recording account state before removing access.','Recovery record saved.'],
    'Wrap homemove credential':['Preparing a short-lived credential for the retained-data handoff.','Credential and token values suppressed.'],
    'AD deprovision (Windows)':['[Pipeline] powershell','Disabling '+name+' and removing directory group access.','Retained files handed to the sample manager.','Account disabled; deletion waits for the retention sweep.'],
    'Entra scrub (Linux)':['[Pipeline] sh','Running the cloud access cleanup helper.','Cloud group and application access removed.'],
    'Mail handoff (Linux)':['[Pipeline] sh','Handing retained mail to the sample manager.','Manager mailbox access and automatic reply configured.']
  };
  return (lines[stage]||['Executing '+stage+'.']).map(text=>({kind:text.startsWith('+ ')?'command':text.startsWith('[Pipeline]')?'pipeline':'normal',text}));
}
export function consoleEvents(run){
  const d=getDemo(run.id),out=[{kind:'notice',text:'SIMULATION: authored example output. No commands execute and no email is sent.'},{kind:'normal',text:'Started by user demo.requester'},{kind:'pipeline',text:'[Pipeline] Start of Pipeline'}];
  const emails=demoEmails(run);
  for(let i=0;i<d.stages.length&&i<=run.step;i++){
    const stage=d.stages[i],complete=i<run.step;
    out.push({kind:'stage',text:'[Pipeline] { ('+stage+')'});
    if(run.skipped.includes(i)){out.push({kind:'muted',text:'Stage "'+stage+'" skipped due to when conditional'},{kind:'pipeline',text:'[Pipeline] }'});continue;}
    const gate=gateAt(run,i);
    if(gate){const email=emails.find(m=>m.stage===i);out.push({kind:'pipeline',text:'[Pipeline] emailext'},{kind:'email',text:'Email sent (simulated) to '+email.to+': '+email.subject},{kind:'pipeline',text:'[Pipeline] input'});if(complete)out.push({kind:'ok',text:'Approved by demo.approver: '+gate.label});else out.push({kind:'gate',text:run.state==='aborted'?'Input aborted by demo.requester.':'Paused for Input: '+gate.message});}
    else if(complete)out.push(...stageOutput(run,stage));
    else if(run.state==='failed')out.push({kind:'error',text:'ERROR: '+run.error});
    else if(run.state==='running')out.push({kind:'muted',text:'Running '+stage+'...'});
    if(complete)out.push({kind:'pipeline',text:'[Pipeline] }'});
  }
  if(['completed','failed','aborted'].includes(run.state)){
    if(run.state==='aborted')out.push({kind:'error',text:'Aborted by demo.requester. No later stages ran.'});
    const result=emails.find(m=>m.kind==='result');if(result)out.push({kind:'pipeline',text:'[Pipeline] emailext'},{kind:'email',text:'Email sent (simulated) to '+result.to+': '+result.subject});
    out.push({kind:'pipeline',text:'[Pipeline] End of Pipeline'},{kind:run.state==='completed'?'ok':'error',text:'Finished: '+({completed:'SUCCESS',failed:'FAILURE',aborted:'ABORTED'}[run.state])});
  }
  return out;
}
