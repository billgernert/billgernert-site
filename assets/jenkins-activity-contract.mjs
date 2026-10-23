export const CENSORED = "SENSORED for security";
export const PUBLIC_NAMES = Object.freeze([
  "AWS Access Key Rotation",
  "Automated recovery",
  "Back up application databases",
  "Backup digest",
  "Backup heartbeat",
  "Backup metrics",
  "Build Windows templates",
  "CIS compliance score",
  "Certificate sync",
  "Clear expired maintenance",
  "Cloudflare Access Entra SSO Credential Rotation",
  "Cloudflare Credential Rotation",
  "Collect Wazuh coverage",
  "Collect job postings",
  "Configuration drift check",
  "Container image scan",
  "Decommission Linux",
  "Decommission Windows",
  "Deprovision User",
  "Dispatch pull request checks",
  "Enrich job postings",
  "Enroll Windows Wazuh agents",
  "Entra Credential Exporter Rotation",
  "Entra Service Credential Rotation",
  "GPO Tools Prerequisite",
  "Generate documentation indexes",
  "Grafana Service Account Token Rotation",
  "Group Policy Drift",
  "Import Greenbone findings",
  "Import IaC findings",
  "Internal website scan",
  "Jenkins API Token Rotation",
  "Jenkins Vault AppRole SecretID Rotation",
  "Jenkins notifyCommit Token Rotation",
  "Jobsearch application restore",
  "Jobsearch digest",
  "Kubernetes Entra SSO Credential Rotation",
  "LiteLLM Virtual Key Rotation",
  "Monitoring maintenance",
  "Monitoring reconciliation",
  "Morning triage",
  "NetBox API Token Rotation",
  "NetBox Entra SSO Credential Rotation",
  "OPNsense API Key Rotation",
  "Provision Linux",
  "Provision User",
  "Provision Windows",
  "Proxmox Entra SSO Credential Rotation",
  "Proxmox and PBS API Token Rotation",
  "Public website scan",
  "Publish public repositories",
  "Publish website",
  "Pull request checks",
  "Restore verification",
  "Roundcube Entra Credential Rotation",
  "Sweep Disabled Users",
  "Sync Grafana dashboards",
  "Sync Jenkins job definitions",
  "Sync work items",
  "System patching",
  "Upgrade Jenkins",
  "Upgrade Loki",
  "Upgrade Prometheus",
  "Wazuh incident triage",
  "Windows update scan",
  "Zabbix API Token Rotation",
  "Zabbix Agent PSK Rotation"
]);
export const PUBLIC_VIEWS = Object.freeze(["All","AIOps","Assurance","CI","DR","IAM","Jobsearch","Monitoring","Operations","Ops","PKI","Platform","Publish","Security","VM","Private"]);
export const MAX_AGE_MS = 120000;
const fields = ["id","name","running","queued","disabled","running_since_ms","last_result","last_finished_ms","last_duration_ms","last_success_ms","last_failure_ms","health_score","views","last_completed_number","last_success_number","last_failure_number"];
const results = new Set(["SUCCESS","FAILURE","UNSTABLE","ABORTED","NOT_BUILT"]);
function exact(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value,k));
}
const integer = v => Number.isSafeInteger(v) && v >= 0;
export function validateSnapshot(value, now = Date.now()) {
  if (value?.version === 4) return validateLiveSnapshot(value, now);
  if (!exact(value, ["version","generated_at_ms","jobs"]) || value.version !== 3 ||
      !integer(value.generated_at_ms) || value.generated_at_ms > now + 30000 ||
      !Array.isArray(value.jobs) || value.jobs.length > 5000) throw new Error("Invalid snapshot");
  const seen = new Set();
  for (const j of value.jobs) {
    if (![j.last_completed_number,j.last_success_number,j.last_failure_number].every(v=>v===null||(integer(v)&&v>0)) || (j.name===CENSORED&&[j.last_completed_number,j.last_success_number,j.last_failure_number].some(v=>v!==null)) || (j.last_finished_ms===null&&j.last_completed_number!==null) || (j.last_success_ms===null&&j.last_success_number!==null) || (j.last_failure_ms===null&&j.last_failure_number!==null) || !exact(j,fields) || !/^job-[a-f0-9]{32}$/.test(j.id) || seen.has(j.id) ||
        !(PUBLIC_NAMES.includes(j.name) || j.name === CENSORED) ||
        !integer(j.running) || j.running > 1000 || typeof j.queued !== "boolean" ||
        typeof j.disabled !== "boolean" || (j.last_result !== null && !results.has(j.last_result)) ||
        !(j.health_score === null || (integer(j.health_score) && j.health_score <= 100)) ||
        !Array.isArray(j.views) || new Set(j.views).size !== j.views.length ||
        j.views.some(v=>!PUBLIC_VIEWS.includes(v) || v === "All") ||
        (j.name === CENSORED && (j.views.length !== 1 || j.views[0] !== "Private")) ||
        ![j.running_since_ms,j.last_finished_ms,j.last_duration_ms,j.last_success_ms,j.last_failure_ms].every(v => v === null || integer(v)) ||
        (j.running === 0) !== (j.running_since_ms === null) ||
        (j.last_result === null) !== (j.last_finished_ms === null) ||
        (j.last_result === null) !== (j.last_duration_ms === null) ||
        (j.running_since_ms !== null && j.running_since_ms > value.generated_at_ms + 30000) ||
        [j.last_finished_ms,j.last_success_ms,j.last_failure_ms].some(v=>v !== null && v > value.generated_at_ms + 30000)) throw new Error("Invalid job");
    seen.add(j.id);
  }
  return value;
}
export function isFresh(snapshot, now=Date.now()) {
  return now >= snapshot.generated_at_ms - 30000 && now - snapshot.generated_at_ms <= MAX_AGE_MS;
}
export function duration(ms) {
  const seconds = Math.max(0,Math.floor(ms / 1000));
  if (seconds < 60) return seconds + "s";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m " + seconds % 60 + "s";
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return hours + "h " + minutes % 60 + "m";
  return Math.floor(hours / 24) + "d " + hours % 24 + "h";
}


const liveFields = [...fields, 'display_name', 'catalog_name', 'description', 'builds'];
const text = (v, max) => typeof v === 'string' && v.length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
export function snapshotViews(value) {
  return value?.version === 4 ? ['All', ...new Set(value.jobs.flatMap(j => j.views))].sort((a,b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)) : PUBLIC_VIEWS;
}
function validateLiveSnapshot(value, now) {
  const fail = () => { throw new Error('Invalid live snapshot'); };
  if (!exact(value, ['version','generated_at_ms','jobs','agents']) || !integer(value.generated_at_ms) || value.generated_at_ms > now + 30000 ||
      !Array.isArray(value.jobs) || value.jobs.length > 5000 || !Array.isArray(value.agents) || value.agents.length > 2000) fail();
  const ids = new Set(), agentIds = new Set();
  for (const j of value.jobs) {
    if (!exact(j, liveFields) || !text(j.name,240) || !j.name || !text(j.display_name,240) || !j.display_name ||
        !(j.catalog_name === null || PUBLIC_NAMES.includes(j.catalog_name)) || !text(j.description,24000) ||
        !Array.isArray(j.views) || j.views.length > 100 || new Set(j.views).size !== j.views.length ||
        j.views.some(v => !text(v,160) || !v || ['All','Demos','Agents'].includes(v)) ||
        !Array.isArray(j.builds) || j.builds.length > 1020) fail();
    // The established v3 validator owns shared status and timestamp invariants.
    const legacy = Object.fromEntries(fields.map(k => [k,j[k]]));
    legacy.name = 'Provision Linux'; legacy.views = [];
    validateSnapshot({version:3,generated_at_ms:value.generated_at_ms,jobs:[legacy]},now);
    if (ids.has(j.id)) fail(); ids.add(j.id);
    const builds = new Set(); let running = 0, completed = 0;
    for (const b of j.builds) {
      if (!exact(b,['number','building','result','timestamp_ms','duration_ms','estimated_duration_ms']) ||
          !integer(b.number) || !b.number || builds.has(b.number) || typeof b.building !== 'boolean' ||
          (b.building ? b.result !== null : !results.has(b.result)) ||
          ![b.timestamp_ms,b.duration_ms,b.estimated_duration_ms].every(integer) || b.timestamp_ms > value.generated_at_ms + 30000 ||
          (!b.building && b.timestamp_ms + b.duration_ms > value.generated_at_ms + 30000)) fail();
      builds.add(b.number); if(b.building) running++; else completed++;
    }
    if (running !== j.running || completed > 20 || (running && Math.min(...j.builds.filter(b=>b.building).map(b=>b.timestamp_ms)) !== j.running_since_ms)) fail();
  }
  for (const a of value.agents) {
    if (!exact(a,['id','name','offline','temporarily_offline','executors','slots']) || !/^agent-[a-f0-9]{32}$/.test(a.id) ||
        agentIds.has(a.id) || !text(a.name,240) || !a.name || typeof a.offline !== 'boolean' || typeof a.temporarily_offline !== 'boolean' ||
        !integer(a.executors) || a.executors > 1000 || !Array.isArray(a.slots) || a.slots.length > 2000) fail();
    agentIds.add(a.id); const slots = new Set();
    for (const e of a.slots) {
      const key = e.kind + ':' + e.slot;
      if (!exact(e,['slot','kind','idle','job_id','build_number']) || !integer(e.slot) || !['executor','one-off'].includes(e.kind) ||
          typeof e.idle !== 'boolean' || slots.has(key) || (e.job_id !== null && !ids.has(e.job_id)) ||
          !(e.build_number === null || (integer(e.build_number) && e.build_number > 0)) ||
          (e.job_id === null) !== (e.build_number === null) || (e.idle && e.job_id !== null)) fail();
      slots.add(key);
    }
  }
  return value;
}
