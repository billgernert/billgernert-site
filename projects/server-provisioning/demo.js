(function () {
  'use strict';

  var supportedRoles = ['infra', 'control', 'ci'];
  var nfsDisks = [40, 60, 80, 100, 120, 160, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000];
  var nvmeDisks = [40, 60, 80, 100, 120, 160, 200, 250, 300, 400];
  var nfsDataDisks = [20, 40, 60, 80, 100, 120, 160, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000];
  var nvmeDataDisks = [20, 40, 60, 80, 100, 120, 160, 200, 250, 300, 400];

  function byId(id) {
    return document.getElementById(id);
  }

  function setSelectOptions(select, values, suffix, selected) {
    select.replaceChildren();
    values.forEach(function (value) {
      var option = document.createElement('option');
      option.value = String(value);
      option.textContent = String(value) + (suffix || '');
      if (String(value) === String(selected)) option.selected = true;
      select.appendChild(option);
    });
  }

  function setRunStatus(element, status) {
    element.className = 'run-status ' + status;
    element.textContent = status;
  }

  function appendConsoleLine(consoleElement, line) {
    var row = document.createElement('p');
    row.className = 'console-line';
    if (line.indexOf('SUCCESS') !== -1) row.classList.add('good');
    if (line.indexOf('ERROR') !== -1) row.classList.add('bad');
    if (line.indexOf('ABORTED') !== -1) row.classList.add('warn');
    row.setAttribute('data-line', String(consoleElement.children.length + 1).padStart(2, '0'));
    row.textContent = line;
    consoleElement.appendChild(row);
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }

  function checkedCount(container) {
    return container.querySelectorAll('input[type="checkbox"]:checked').length;
  }

  function initWindowsDemo() {
    var form = byId('windows-form');
    if (!form) return;

    var storage = byId('win-storage');
    var disk = byId('win-disk');
    var dataDisk = byId('win-data-disk');
    var consoleElement = byId('win-console');
    var status = byId('win-status');
    var email = byId('win-email');
    var approval = byId('win-approval');
    var reset = byId('reset-windows');
    var timers = [];

    function clearTimers() {
      timers.forEach(window.clearTimeout);
      timers = [];
    }

    function lockForm(locked) {
      form.querySelectorAll('input, select, button').forEach(function (control) {
        control.disabled = locked;
      });
    }

    function updateDisks() {
      var isNvme = storage.value === 'NVMe';
      var diskValues = isNvme ? nvmeDisks : nfsDisks;
      var dataValues = isNvme ? nvmeDataDisks : nfsDataDisks;
      var currentDisk = Number(disk.value || 40);
      var currentData = Number(dataDisk.value || 0);
      var max = diskValues[diskValues.length - 1];
      if (diskValues.indexOf(currentDisk) === -1) currentDisk = max;
      if (currentData && dataValues.indexOf(currentData) === -1) currentData = 0;
      setSelectOptions(disk, diskValues, ' GB', currentDisk);
      setSelectOptions(dataDisk, [0].concat(dataValues), ' GB', currentData);
      dataDisk.options[0].textContent = 'None';
      byId('win-disk-help').textContent = storage.value + ' OS disk choices. Maximum ' + max + ' GB.';
      byId('win-data-help').textContent = 'Optional second disk. ' + storage.value + ' maximum ' + max + ' GB.';
    }

    function populateEmail() {
      var name = byId('win-name').value.trim();
      var details = byId('email-details');
      var rows = [
        ['Role', byId('win-role').value],
        ['Resources', byId('win-cores').value + ' cores / ' + byId('win-memory').value + ' GB'],
        ['Template', 'Windows Server ' + byId('win-template').value],
        ['Storage', storage.value + ' / ' + disk.value + ' GB OS' + (dataDisk.value === '0' ? '' : ' / ' + dataDisk.value + ' GB data')],
        ['Plan', '1 to add, 0 to change, 0 to destroy']
      ];
      byId('email-title').textContent = 'Provision ' + name;
      details.replaceChildren();
      rows.forEach(function (pair) {
        var item = document.createElement('div');
        var term = document.createElement('dt');
        var description = document.createElement('dd');
        term.textContent = pair[0];
        description.textContent = pair[1];
        item.append(term, description);
        details.appendChild(item);
      });
    }

    function runSequence(lines, done, delay) {
      lines.forEach(function (line, index) {
        timers.push(window.setTimeout(function () {
          appendConsoleLine(consoleElement, line);
          if (index === lines.length - 1 && done) done();
        }, (delay || 330) * (index + 1)));
      });
    }

    storage.addEventListener('change', updateDisks);
    updateDisks();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearTimers();
      consoleElement.replaceChildren();
      email.classList.add('is-hidden');
      approval.classList.add('is-hidden');
      reset.classList.add('is-hidden');
      lockForm(true);
      setRunStatus(status, 'running');
      byId('win-run-title').textContent = 'Pipeline [VM] Provision Windows demo';

      var name = byId('win-name').value.trim();
      var role = byId('win-role').value;
      var features = byId('win-features');
      var hyperV = features.querySelector('input[value="Hyper-V"]').checked;
      var invalidName = !/^[a-z0-9][a-z0-9-]{0,14}$/i.test(name);
      var missingNested = hyperV && !byId('win-nested').checked;
      var unsupportedRole = supportedRoles.indexOf(role) === -1;
      var max = storage.value === 'NVMe' ? 400 : 2000;
      var summary = name + ' | Windows Server ' + byId('win-template').value + ' | ' + byId('win-cores').value + ' cores / ' + byId('win-memory').value + ' GB | ' + storage.value + ' ' + disk.value + ' GB | ' + checkedCount(byId('win-tools')) + ' tools | ' + checkedCount(features) + ' features';
      var lines = [
        '[Pipeline] Start of Pipeline',
        '[Validate] request=' + summary,
        '[Validate] hostname syntax and NetBIOS length',
        '[Validate] storage policy: ' + storage.value + ' allows OS and data disks up to ' + max + ' GB',
        '[Validate] tools matched the Windows allowlist',
        '[Validate] Windows feature constraints'
      ];
      if (invalidName) lines.push('ERROR: VM_NAME must be 1 to 15 letters, numbers, or hyphens.');
      else if (missingNested) lines.push('ERROR: Hyper-V requires nested virtualization.');
      else if (unsupportedRole) lines.push('ERROR: The selected role does not have a supported provisioning path.');
      else lines.push('[Safety] target path supported', '[Safety] collision sources returned clear', '[Plan] saved Terraform plan: 1 to add, 0 to change, 0 to destroy', '[Input] Approval required before Terraform apply');

      runSequence(lines, function () {
        if (invalidName || missingNested || unsupportedRole) {
          setRunStatus(status, 'failed');
          lockForm(false);
          reset.classList.remove('is-hidden');
          return;
        }
        setRunStatus(status, 'approval');
        populateEmail();
        email.classList.remove('is-hidden');
      }, 310);
    });

    byId('open-approval').addEventListener('click', function () {
      approval.classList.remove('is-hidden');
      approval.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    byId('approve-build').addEventListener('click', function () {
      email.classList.add('is-hidden');
      approval.classList.add('is-hidden');
      setRunStatus(status, 'running');
      runSequence([
        '[Input] Approved by operator',
        '[Apply] saved Terraform plan accepted',
        '[Create] VM creation boundary recorded',
        '[Configure] Ansible configured Windows Server',
        '[Protect] Active Directory join and Duo MFA for remote desktop complete',
        '[Protect] firewall and time-sync baseline applied',
        '[Monitor] host registration complete with a unique encrypted identity',
        '[Backup] nightly whole-VM coverage inherited from Proxmox',
        '[Record] host manifest ready',
        'SUCCESS: simulated provisioning completed.'
      ], function () {
        setRunStatus(status, 'passed');
        reset.classList.remove('is-hidden');
      }, 350);
    });

    byId('abort-build').addEventListener('click', function () {
      email.classList.add('is-hidden');
      approval.classList.add('is-hidden');
      appendConsoleLine(consoleElement, '[Input] Aborted by operator');
      appendConsoleLine(consoleElement, '[Cleanup] reserved address released; no VM was created');
      appendConsoleLine(consoleElement, 'ABORTED: simulated provisioning stopped at the approval gate.');
      setRunStatus(status, 'aborted');
      reset.classList.remove('is-hidden');
    });

    reset.addEventListener('click', function () {
      clearTimers();
      lockForm(false);
      setRunStatus(status, 'idle');
      byId('win-run-title').textContent = 'Waiting for a build';
      consoleElement.innerHTML = '<p class="console-muted">Choose parameters and select Build. The demo validates the request before it simulates provisioning.</p>';
      email.classList.add('is-hidden');
      approval.classList.add('is-hidden');
      reset.classList.add('is-hidden');
    });
  }

  function initLinuxDemo() {
    var form = byId('linux-form');
    if (!form) return;
    var consoleElement = byId('linux-console');
    var status = byId('linux-status');
    var timers = [];

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      timers.forEach(window.clearTimeout);
      timers = [];
      consoleElement.replaceChildren();
      setRunStatus(status, 'running');
      form.querySelectorAll('input, select, button').forEach(function (control) { control.disabled = true; });
      var name = byId('linux-name').value.trim();
      var role = byId('linux-role').value;
      var invalidName = !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);
      var unsupportedRole = supportedRoles.indexOf(role) === -1;
      var lines = [
        '[Pipeline] Start of Pipeline',
        '[Validate] ' + name + ' | ' + role + ' | Rocky Linux 9',
        '[Validate] hostname and requested size accepted',
        '[Validate] configuration profile: ' + byId('linux-profile').value
      ];
      if (invalidName) lines.push('ERROR: Use a lowercase hostname with letters, numbers, and single hyphens.');
      else if (unsupportedRole) lines.push('ERROR: The selected role does not have a supported provisioning path.');
      else lines.push('[Safety] target path supported', '[Safety] collision sources returned clear', '[Plan] base roles: firewall, time sync, monitoring, and log forwarding', '[Plan] nightly VM backup coverage detected', 'SUCCESS: request is ready for planning. Demo stopped here.');

      lines.forEach(function (line, index) {
        timers.push(window.setTimeout(function () {
          appendConsoleLine(consoleElement, line);
          if (index === lines.length - 1) {
            setRunStatus(status, invalidName || unsupportedRole ? 'failed' : 'passed');
            form.querySelectorAll('input, select, button').forEach(function (control) { control.disabled = false; });
          }
        }, 300 * (index + 1)));
      });
    });
  }

  function initBackstageDemo() {
    var demo = byId('backstage-demo');
    if (!demo) return;
    var os = byId('portal-os');
    var cores = byId('portal-cores');
    var memory = byId('portal-memory');
    var storage = byId('portal-storage');
    var disk = byId('portal-disk');

    function showScreen(name) {
      demo.querySelectorAll('[data-backstage-screen]').forEach(function (screen) {
        screen.classList.toggle('is-hidden', screen.getAttribute('data-backstage-screen') !== name);
      });
      if (name === 'review') updateReview();
      if (name === 'submitted') {
        byId('submitted-copy').textContent = 'The simulated pull request contains the reviewed server request. The validation workflow is ready to check it.';
      }
    }

    function updatePortalOptions() {
      var windows = os.value === 'windows';
      setSelectOptions(cores, windows ? [4, 6, 8] : [1, 2, 4, 6, 8], '', windows ? 4 : 2);
      setSelectOptions(memory, windows ? [4, 6, 8, 10, 12] : [1, 2, 4, 6, 8, 12], ' GB', windows ? 4 : 2);
      byId('portal-storage-field').classList.toggle('is-hidden', !windows);
      updatePortalDisks();
    }

    function updatePortalDisks() {
      var windows = os.value === 'windows';
      var values = windows ? (storage.value === 'NVMe' ? nvmeDisks : nfsDisks) : [20, 30, 40, 60, 80, 100, 160, 200];
      var selected = windows ? 40 : 20;
      setSelectOptions(disk, values, ' GB', selected);
      byId('portal-disk-help').textContent = windows ? storage.value + ' choices. Maximum ' + values[values.length - 1] + ' GB.' : 'Rocky Linux 9 expands to this size.';
    }

    function addReviewRow(list, label, value) {
      var item = document.createElement('div');
      var term = document.createElement('dt');
      var description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      item.append(term, description);
      list.appendChild(item);
    }

    function updateReview() {
      var windows = os.value === 'windows';
      var name = byId('portal-name').value.trim();
      var review = byId('portal-review');
      review.replaceChildren();
      addReviewRow(review, 'Operating system', windows ? 'Windows Server' : 'Linux, Rocky Linux 9');
      addReviewRow(review, 'Hostname', name);
      addReviewRow(review, 'Role', byId('portal-role').value);
      addReviewRow(review, 'Size', cores.value + ' cores / ' + memory.value);
      addReviewRow(review, windows ? 'Storage' : 'Root disk', windows ? storage.value + ' / ' + disk.value + ' GB' : disk.value + ' GB');
      addReviewRow(review, 'Control path', 'Pull request and Gitea Actions');
      byId('request-file').textContent = 'server-request.yaml';
      byId('request-code').textContent = 'hostname: ' + name + '\nos: ' + os.value + '\nrole: ' + byId('portal-role').value + '\ncores: ' + cores.value + '\nmemory_gb: ' + memory.value + '\ndisk_gb: ' + disk.value;
    }

    demo.querySelectorAll('[data-backstage-next]').forEach(function (button) {
      button.addEventListener('click', function () { showScreen(button.getAttribute('data-backstage-next')); });
    });
    byId('backstage-form').addEventListener('submit', function (event) {
      event.preventDefault();
      showScreen('review');
    });
    os.addEventListener('change', updatePortalOptions);
    storage.addEventListener('change', updatePortalDisks);
    updatePortalOptions();
  }

  function initActionsDemo() {
    var container = byId('action-steps');
    if (!container) return;
    var steps = [
      'Detect changed requests',
      'Install provisioning toolchain',
      'Validate request again',
      'Reserve address and select node',
      'Apply Terraform plan',
      'Register monitoring',
      'Configure guest with Ansible',
      'Attach inherited platform services',
      'Write host manifest'
    ];
    var active = 0;
    var paused = false;
    var timer;

    function render() {
      var complete = active >= steps.length;
      var percent = complete ? 100 : Math.round((active / steps.length) * 100);
      container.replaceChildren();
      steps.forEach(function (step, index) {
        var state = complete || index < active ? 'done' : index === active ? 'current' : 'queued';
        var row = document.createElement('div');
        var mark = document.createElement('span');
        var label = document.createElement('strong');
        var time = document.createElement('small');
        row.className = 'action-step ' + state;
        mark.textContent = state === 'done' ? '✓' : state === 'current' ? '•' : '';
        label.textContent = step;
        time.textContent = state === 'done' ? String(12 + index * 7) + 's' : state === 'current' ? 'running' : 'queued';
        row.append(mark, label, time);
        container.appendChild(row);
      });
      byId('actions-progress').style.width = String(percent) + '%';
      byId('actions-percent').textContent = String(percent) + '%';
      byId('actions-state').textContent = complete ? 'Completed' : paused ? 'Paused' : 'In progress';
      byId('actions-state').style.color = complete ? '#00ff96' : '#ffd166';
      byId('actions-log').textContent = complete ? 'Host manifest committed. Workflow finished successfully.' : paused ? 'Simulation paused. Resume to continue.' : 'Running: ' + steps[Math.min(active, steps.length - 1)];
    }

    function schedule() {
      window.clearTimeout(timer);
      if (paused) return;
      timer = window.setTimeout(function () {
        active = active >= steps.length ? 0 : active + 1;
        render();
        schedule();
      }, active >= steps.length ? 2800 : 920);
    }

    byId('actions-pause').addEventListener('click', function () {
      paused = !paused;
      byId('actions-pause').textContent = paused ? 'Resume' : 'Pause';
      render();
      schedule();
    });
    byId('actions-restart').addEventListener('click', function () {
      active = 0;
      paused = false;
      byId('actions-pause').textContent = 'Pause';
      render();
      schedule();
    });
    render();
    schedule();
  }

  initWindowsDemo();
  initLinuxDemo();
  initBackstageDemo();
  initActionsDemo();
}());
