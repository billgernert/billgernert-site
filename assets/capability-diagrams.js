(function () {
  'use strict';

  var diagrams = {
    'ad-cs-pki.html': [
      ['Root of trust', 'Offline authority'],
      ['Templates', 'Approved profiles'],
      ['Issuance', 'Tracked certificates'],
      ['Revocation', 'Published status']
    ],
    'active-directory.html': [
      ['Provision', 'Create identity'],
      ['Synchronize', 'Publish downstream'],
      ['Disable now', 'Four-eyes gate'],
      ['Clean up later', 'Delayed removal']
    ],
    'argo-cd.html': [
      ['Git', 'Desired state'],
      ['Compare', 'Detect drift'],
      ['Review', 'Inspect the diff'],
      ['Synchronize', 'Reconcile cluster']
    ],
    'ansible.html': [
      ['Pipeline', 'Bounded request'],
      ['Automation user', 'Scoped access'],
      ['Ordered roles', 'Repeatable change'],
      ['Converged host', 'Verified result']
    ],
    'cloudflare.html': [
      ['Internet', 'Public request'],
      ['Access SSO', 'Identity gate'],
      ['Outbound tunnel', 'No inbound port'],
      ['Internal ingress', 'Route to service'],
      ['Application', 'Private origin']
    ],
    'duo-mfa.html': [
      ['Identity', 'Primary sign-in'],
      ['Second factor', 'Duo challenge'],
      ['Policy', 'Allow or deny'],
      ['Access', 'Audited session']
    ],
    'entra-id.html': [
      ['On-prem AD', 'Source identity'],
      ['Sync bridge', 'Controlled export'],
      ['Entra ID', 'Cloud identity'],
      ['Conditional Access', 'Session policy']
    ],
    'devsecops.html': [
      ['Pull request', 'Proposed change'],
      ['Static checks', 'Lint and secrets'],
      ['Image checks', 'Scan artifact'],
      ['Protection', 'Required gates'],
      ['Merge', 'Green only']
    ],
    'gitea.html': [
      ['Branch', 'Isolated work'],
      ['Pull request', 'Durable proposal'],
      ['Required checks', 'Test and review'],
      ['Protected main', 'Controlled merge'],
      ['Automation', 'CI and GitOps']
    ],
    'grafana.html': [
      ['Metrics', 'Prometheus series'],
      ['JSON feeds', 'Curated status'],
      ['Grafana', 'One visual layer'],
      ['Access boundary', 'Private or scrubbed public']
    ],
    'helm.html': [
      ['Chart', 'Reusable package'],
      ['Values', 'Shared plus release'],
      ['Render', 'Concrete manifests'],
      ['Release', 'Cluster state'],
      ['Reconcile', 'Git remains source']
    ],
    'incident-postmortem.html': [
      ['Detect', 'See the failure'],
      ['Mitigate', 'Restore service'],
      ['Timeline', 'Preserve facts'],
      ['Root cause', 'Explain the mechanism'],
      ['Prevent', 'Track durable work']
    ],
    'jenkins.html': [
      ['Request', 'Named operation'],
      ['Capture identity', 'Known requester'],
      ['Approval gate', 'Allowlisted operator'],
      ['Disable', 'Immediate control'],
      ['Cleanup', 'Delayed removal']
    ],
    'job-search-platform.html': [
      ['Collect', 'Scheduled sources'],
      ['Enrich', 'Normalize records'],
      ['Database', 'Durable state'],
      ['Migration gate', 'Schema first'],
      ['Application', 'Search and review']
    ],
    'kaniko.html': [
      ['Git context', 'Pinned source'],
      ['Kaniko pod', 'Daemonless build'],
      ['Registry', 'Push image'],
      ['Digest gate', 'Verify artifact'],
      ['Pipeline', 'Consume by digest']
    ],
    'kubernetes-k3s.html': [
      ['Control plane', 'Cluster decisions'],
      ['Worker nodes', 'Run workloads'],
      ['Reconciliation', 'Restore desired state'],
      ['Ingress', 'Route service traffic']
    ],
    'opnsense.html': [
      ['Role segments', 'Separate trust zones'],
      ['Default deny', 'Block by default'],
      ['Explicit allows', 'Named flows only'],
      ['Management', 'Protected control plane']
    ],
    'netbox-ipam.html': [
      ['Allocate', 'Choose free address'],
      ['Infrastructure code', 'Record intent'],
      ['Configure', 'Apply network identity'],
      ['Decommission', 'Release address']
    ],
    'prometheus.html': [
      ['Exporters', 'Expose measurements'],
      ['Scrape', 'Collect on schedule'],
      ['Time series', 'Retain history'],
      ['Rules', 'Derive signals'],
      ['Dashboards and alerts', 'Show and notify']
    ],
    'pipelines.html': [
      ['Private source', 'Full-fidelity content'],
      ['Build', 'Generate the site'],
      ['Fail-closed scrub', 'Enforce public boundary'],
      ['Public repository', 'Sanitized output'],
      ['Static host', 'Publish site']
    ],
    'zabbix.html': [
      ['Register', 'Known host'],
      ['Monitor', 'Collect health'],
      ['Trigger', 'Detect a condition'],
      ['Classify', 'Choose response'],
      ['Heal and record', 'Act with evidence']
    ],
    'split-horizon-dns.html': [
      ['Name query', 'Same service name'],
      ['View selection', 'Internal or public'],
      ['Resolver answer', 'Correct destination'],
      ['Service edge', 'Private ingress or public edge']
    ],
    'vlans.html': [
      ['Role segment', 'Identity, compute, or infra'],
      ['Default deny', 'No implicit crossing'],
      ['Explicit allow', 'Documented dependency'],
      ['Protected service', 'Least-access path']
    ],
    'terraform.html': [
      ['Allocate', 'One workspace per VM'],
      ['Plan', 'Review intended change'],
      ['Apply gate', 'Operator decision'],
      ['Provision', 'Create infrastructure'],
      ['Handoff', 'Configure and record']
    ],
    'python-tooling.html': [
      ['Scoped login', 'Short-lived identity'],
      ['One secret', 'Minimum read'],
      ['API action', 'Value stays in memory'],
      ['Exit', 'No secret on disk']
    ],
    'proxmox.html': [
      ['Terraform', 'Declared VM intent'],
      ['Provider', 'Authenticated API call'],
      ['Cluster API', 'Schedule the workload'],
      ['HA nodes', 'Quorum-backed compute'],
      ['Shared storage', 'Portable VM disks']
    ],
    'vault.html': [
      ['Workload identity', 'Known caller'],
      ['Bootstrap login', 'Short-lived token'],
      ['Scoped policy', 'Exact path only'],
      ['KV read', 'One secret'],
      ['Runtime use', 'Memory only']
    ]
  };

  function buildDiagram(frame, steps) {
    var flow = document.createElement('ol');
    flow.className = 'skill-flow';

    steps.forEach(function (step, index) {
      var item = document.createElement('li');
      item.className = 'skill-node';

      var number = document.createElement('span');
      number.className = 'skill-node-number';
      number.textContent = String(index + 1).padStart(2, '0');

      var title = document.createElement('strong');
      title.textContent = step[0];

      var detail = document.createElement('span');
      detail.className = 'skill-node-detail';
      detail.textContent = step[1];

      item.append(number, title, detail);
      flow.appendChild(item);

      if (index < steps.length - 1) {
        var arrow = document.createElement('li');
        arrow.className = 'skill-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '\u2192';
        flow.appendChild(arrow);
      }
    });

    var caption = frame.querySelector('.sub');
    var description = caption ? caption.textContent.trim() : '';
    frame.replaceChildren(flow);
    frame.classList.add('skill-diagram');
    frame.setAttribute('role', 'img');
    frame.setAttribute('aria-label', description || steps.map(function (step) { return step[0]; }).join(' to '));

    if (description) {
      var note = document.createElement('p');
      note.className = 'skill-diagram-note';
      note.textContent = description;
      frame.appendChild(note);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    var steps = diagrams[page];
    if (!steps) { return; }

    var placeholders = Array.prototype.filter.call(document.querySelectorAll('.frame .cap'), function (cap) {
      return cap.textContent.trim() === 'Architecture flow';
    });
    placeholders.forEach(function (cap) {
      buildDiagram(cap.closest('.frame'), steps);
    });
  });
}());
