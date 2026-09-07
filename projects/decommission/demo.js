(function () {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
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
    if (line.indexOf('ABORTED') !== -1 || line.indexOf('[Gate]') === 0) row.classList.add('warn');
    row.setAttribute('data-line', String(consoleElement.children.length + 1).padStart(2, '0'));
    row.textContent = line;
    consoleElement.appendChild(row);
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }

  var form = byId('decommission-form');
  if (!form) return;

  var nameInput = byId('decommission-name');
  var scenario = byId('decommission-scenario');
  var consoleElement = byId('decommission-console');
  var status = byId('decommission-status');
  var email = byId('decommission-email');
  var approval = byId('decommission-approval');
  var reset = byId('reset-decommission');
  var jobChoices = Array.from(document.querySelectorAll('[data-decommission-os]'));
  var operatingSystem = 'linux';
  var timers = [];

  function clearTimers() {
    timers.forEach(window.clearTimeout);
    timers = [];
  }

  function lockControls(locked) {
    form.querySelectorAll('input, select, button').forEach(function (control) {
      control.disabled = locked;
    });
    jobChoices.forEach(function (control) { control.disabled = locked; });
  }

  function runSequence(lines, done, delay) {
    lines.forEach(function (line, index) {
      timers.push(window.setTimeout(function () {
        appendConsoleLine(consoleElement, line);
        if (index === lines.length - 1 && done) done();
      }, (delay || 300) * (index + 1)));
    });
  }

  function jobLabel() {
    return operatingSystem === 'windows' ? 'Windows' : 'Linux';
  }

  function updateJob(next) {
    operatingSystem = next;
    jobChoices.forEach(function (button) {
      var selected = button.getAttribute('data-decommission-os') === next;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    byId('decommission-job-title').textContent = 'Pipeline [VM] Decommission ' + jobLabel();
    if (nameInput.value === 'runner-01' || nameInput.value === 'win-app-01') {
      nameInput.value = next === 'windows' ? 'win-app-01' : 'runner-01';
    }
  }

  function addEmailDetail(list, label, value) {
    var item = document.createElement('div');
    var term = document.createElement('dt');
    var description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    list.appendChild(item);
  }

  function populateApproval(name) {
    var details = byId('decommission-email-details');
    details.replaceChildren();
    byId('decommission-email-title').textContent = 'Destroy ' + name;
    addEmailDetail(details, 'Job', jobLabel() + ' decommission');
    addEmailDetail(details, 'Workspace', name);
    addEmailDetail(details, 'Plan evidence', '1 resource delete');
    addEmailDetail(details, 'Approval limit', '30 minutes');
    byId('decommission-approval-copy').textContent = 'Apply the saved destroy plan for ' + name + '. This removes the VM and starts the ' + jobLabel().toLowerCase() + ' cleanup path.';
  }

  function failureFor(selectedScenario, name) {
    if (!/^[a-zA-Z0-9-]+$/.test(name)) return 'ERROR: VM_NAME may contain only letters, numbers, and hyphens.';
    if (selectedScenario === 'missing') return 'ERROR: Terraform workspace does not exist. Refusing to plan or request approval.';
    if (selectedScenario === 'empty') return 'ERROR: Destroy plan contains no deletes. Refusing to report an empty teardown as success.';
    if (selectedScenario === 'unreadable') return 'ERROR: Destroy plan evidence is unreadable. Refusing to request approval.';
    return '';
  }

  jobChoices.forEach(function (button) {
    button.addEventListener('click', function () {
      updateJob(button.getAttribute('data-decommission-os'));
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearTimers();
    consoleElement.replaceChildren();
    email.classList.add('is-hidden');
    approval.classList.add('is-hidden');
    reset.classList.add('is-hidden');
    lockControls(true);
    setRunStatus(status, 'running');

    var name = nameInput.value.trim();
    var selectedScenario = scenario.value;
    var failure = failureFor(selectedScenario, name);
    byId('decommission-run-title').textContent = 'Pipeline [VM] Decommission ' + jobLabel() + ' demo';

    var lines = [
      '[Pipeline] Start of Pipeline',
      '[Validate] VM_NAME=' + (name || '(empty)'),
      '[Checkout] reviewed decommission automation loaded',
      '[Workspace] select isolated state for ' + (name || '(empty)')
    ];
    if (selectedScenario !== 'missing' && name) {
      lines.push('[State] recorded address recovered from Terraform output');
      lines.push('[Plan] saved destroy plan created');
    }
    if (!failure) {
      lines.push('[Plan] structured plan is readable');
      lines.push('[Gate] confirmed 1 delete action');
      lines.push('[Input] approval required before any record or VM is removed');
    } else {
      lines.push(failure);
    }

    runSequence(lines, function () {
      if (failure) {
        setRunStatus(status, 'failed');
        lockControls(false);
        reset.classList.remove('is-hidden');
        return;
      }
      populateApproval(name);
      setRunStatus(status, 'approval');
      email.classList.remove('is-hidden');
    }, 260);
  });

  byId('open-destroy-approval').addEventListener('click', function () {
    approval.classList.remove('is-hidden');
    approval.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  byId('approve-destroy').addEventListener('click', function () {
    var name = nameInput.value.trim();
    email.classList.add('is-hidden');
    approval.classList.add('is-hidden');
    setRunStatus(status, 'running');
    var lines = [
      '[Input] destruction approved by operator',
      '[Record] host manifest removal merged before resource reuse',
      '[Destroy] exact saved Terraform plan applied; VM removed',
      '[Address] recorded address released',
      '[Monitor] Zabbix host removed',
      '[Security] Wazuh agent identity removed'
    ];
    if (operatingSystem === 'windows') {
      lines.push('[Secret] monitoring key removed; restore administrator credential retained');
      lines.push('[Directory] Active Directory computer object removed');
      lines.push('[DNS] Windows forward and reverse records removed');
    } else {
      lines.push('[DNS] Linux forward and reverse records removed');
    }
    lines.push('[State] empty Terraform workspace removed');
    lines.push('SUCCESS: simulated ' + jobLabel().toLowerCase() + ' decommission completed for ' + name + '.');
    runSequence(lines, function () {
      setRunStatus(status, 'passed');
      reset.classList.remove('is-hidden');
    }, 290);
  });

  byId('abort-destroy').addEventListener('click', function () {
    email.classList.add('is-hidden');
    approval.classList.add('is-hidden');
    appendConsoleLine(consoleElement, '[Input] destroy request aborted by operator');
    appendConsoleLine(consoleElement, 'ABORTED: saved plan was not applied. The VM and its records remain.');
    setRunStatus(status, 'aborted');
    reset.classList.remove('is-hidden');
  });

  reset.addEventListener('click', function () {
    clearTimers();
    lockControls(false);
    setRunStatus(status, 'idle');
    byId('decommission-run-title').textContent = 'Waiting for a request';
    consoleElement.innerHTML = '<p class="console-muted">Choose a job and plan result, then select Build. The demo proves the destroy plan before it opens the approval gate.</p>';
    email.classList.add('is-hidden');
    approval.classList.add('is-hidden');
    reset.classList.add('is-hidden');
  });
}());
