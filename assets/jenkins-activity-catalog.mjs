export const JOB_CATALOG = Object.freeze({
  "Backup digest": {
    "title": "[Ops] Backup Digest",
    "description": "Collects backup results and sends the backup digest so I can check coverage and failures together.",
    "why": "I use one digest to see whether scheduled backups completed and where I need to investigate, without opening each backup system.",
    "workers": [
      "provisioner"
    ]
  },
  "Build Windows templates": {
    "title": "[VM] Build Windows Templates",
    "description": "Builds Windows Server templates with Packer. Separate Kubernetes workers run the template builds in parallel.",
    "stages": [
      [
        "Checkout",
        "Read the reviewed template definitions."
      ],
      [
        "Create build workers",
        "Kubernetes creates a separate Packer worker for each template build."
      ],
      [
        "Build templates",
        "The Windows versions build in parallel."
      ],
      [
        "Record result",
        "Jenkins records each build outcome."
      ]
    ],
    "why": "A maintained template gives new Windows VMs a repeatable starting point and avoids rebuilding the operating system by hand for each request.",
    "workers": [
      "packer"
    ]
  },
  "Certificate sync": {
    "title": "[PKI] Certificate Sync",
    "description": "Distributes the renewed certificate to the services that need it and checks the certificates they serve afterward.",
    "why": "Renewing a certificate is only part of the work. I also need the services that use it to receive the replacement and actually serve it.",
    "workers": [
      "tools"
    ]
  },
  "Decommission Linux": {
    "title": "[VM] Decommission Linux",
    "description": "Validates the Linux retirement request and prepares a Terraform destroy plan. After approval it removes the VM and coordinates cleanup of the host manifest, address allocation, monitoring and DNS records.",
    "stages": [
      [
        "Validate input",
        ""
      ],
      [
        "Checkout",
        ""
      ],
      [
        "Terraform Plan (destroy)",
        ""
      ],
      [
        "Approval",
        ""
      ],
      [
        "Remove host manifest",
        ""
      ],
      [
        "Terraform Destroy",
        ""
      ],
      [
        "Release IP from NetBox",
        ""
      ],
      [
        "Deregister Zabbix",
        ""
      ],
      [
        "Deregister Wazuh",
        ""
      ],
      [
        "DNS Deregister",
        ""
      ],
      [
        "Delete workspace",
        ""
      ]
    ],
    "schedule": "On demand through Build with Parameters.",
    "why": "Deleting a VM can leave stale addresses, DNS entries and monitoring records. This job puts the retirement steps behind a reviewed destroy plan and approval.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Decommission Windows": {
    "title": "[VM] Decommission Windows",
    "description": "Validates the Windows retirement request and prepares a Terraform destroy plan. After approval it removes the VM and coordinates cleanup of inventory, monitoring, per-host credentials, directory and DNS records.",
    "stages": [
      [
        "Validate input",
        ""
      ],
      [
        "Checkout",
        ""
      ],
      [
        "Terraform Plan (destroy)",
        ""
      ],
      [
        "Approval",
        ""
      ],
      [
        "Remove host manifest",
        ""
      ],
      [
        "Terraform Destroy",
        ""
      ],
      [
        "Release IP from NetBox",
        ""
      ],
      [
        "Deregister Zabbix",
        ""
      ],
      [
        "Deregister Wazuh",
        ""
      ],
      [
        "Purge per-host Vault secrets",
        ""
      ],
      [
        "AD + DNS Deregister",
        ""
      ],
      [
        "Delete workspace",
        ""
      ]
    ],
    "schedule": "On demand through Build with Parameters.",
    "why": "Windows retirement also leaves directory and per-host credential records to clean up. I keep those steps with the VM destroy workflow so the removal can be traced.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Backup heartbeat": {
    "title": "[Monitoring] Digest dead-man switch heartbeat",
    "description": "Checks in for the backup digest so a missing report can be detected independently of the report itself.",
    "why": "A missing backup email can mean the reporting job failed. An independent heartbeat lets monitoring detect silence as well as a reported backup failure.",
    "workers": [
      "jobsearch"
    ]
  },
  "Restore verification": {
    "title": "[DR] Weekly Restore-Verify",
    "description": "Restores a protected system into an isolated test environment, verifies the result, then removes the test copy.",
    "why": "A successful backup does not tell me whether I can recover the system. This job exercises the restore and records the checks against the recovered copy.",
    "workers": [
      "provisioner"
    ]
  },
  "Configuration drift check": {
    "title": "[Assurance] Estate-wide Drift and Source Assurance",
    "description": "Reconciles inventory with observed sources, checks Ansible-managed configuration and plans Terraform workspaces. Publishes an assurance report showing differences that need review.",
    "why": "Manual changes can leave running systems different from Git. This report helps me decide whether to correct the system or update the declared configuration.",
    "workers": [
      "provisioner"
    ]
  },
  "Container image scan": {
    "title": "[Security] Estate image scan",
    "description": "Scans container images used by the estate, triages critical findings and files actionable findings for review. The scan results feed the ongoing security work.",
    "why": "Container images can acquire new vulnerability findings after deployment. I need a recurring check of what the estate is using, with findings I can review.",
    "workers": [
      "provisioner"
    ]
  },
  "Windows update scan": {
    "title": "[Security] Estate Windows KB scan",
    "description": "Checks Windows update coverage across the estate.",
    "why": "I use this to find missing Windows updates and distinguish coverage gaps from a patch job that simply reported success.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Publish public repositories": {
    "title": "[Publish] Export public repositories",
    "description": "Prepares the selected source for the public repositories and applies the publication checks before pushing the accepted output.",
    "why": "I want useful examples to be inspectable outside the lab without copying private configuration into the public repositories.",
    "workers": [
      "provisioner"
    ]
  },
  "Monitoring reconciliation": {
    "title": "[Monitoring] NOC overview reconcile",
    "description": "Reconciles the monitoring overview with the information that feeds it.",
    "why": "Dashboard definitions and the monitoring overview can drift apart. This comparison catches missing or mismatched monitoring content before I rely on it.",
    "workers": [
      "provisioner"
    ]
  },
  "System patching": {
    "title": "[Operations] Rolling Estate Patch",
    "description": "Coordinates rolling patches across the estate, with the pipeline handling the maintenance sequence and checks around each part of the work.",
    "why": "Updating the whole estate together can interrupt dependent services. I coordinate the sequence and verify progress through a single recorded workflow.",
    "workers": [
      "provisioner"
    ]
  },
  "Backup metrics": {
    "title": "[Monitoring] PBS facts collector",
    "description": "Collects backup facts for monitoring and reporting.",
    "why": "Backup facts need to be available to monitoring and reporting, so I can track coverage and freshness without manually inspecting the backup interface.",
    "workers": [
      "provisioner"
    ]
  },
  "Pull request checks": {
    "title": "[CI] Pull request merge preview",
    "description": "Tests the proposed merge while keeping the proposed code separate from the credentials used to report its result.",
    "why": "A branch can pass on its own and still break when merged. I test the proposed merge while keeping untrusted changes away from the credentials that publish the result.",
    "workers": [
      "python"
    ]
  },
  "Dispatch pull request checks": {
    "title": "[CI] Pull request dispatcher",
    "description": "Dispatches pull-request checks and limits duplicate or concurrent work.",
    "why": "Frequent branch updates can otherwise queue duplicate tests. The dispatcher keeps checks tied to the requested commit and limits overlapping work.",
    "workers": [
      "python"
    ]
  },
  "Provision Linux": {
    "title": "[VM] Provision Linux",
    "description": "Creates a Linux server through a reviewed workflow. NetBox allocates its address, Terraform plans and creates the VM, and Ansible configures the operating system. Approval separates the plan from the change.",
    "stages": [
      [
        "Validate input",
        ""
      ],
      [
        "Checkout",
        ""
      ],
      [
        "Validate provision target",
        ""
      ],
      [
        "Name collision check",
        ""
      ],
      [
        "Resolve existing VM",
        ""
      ],
      [
        "Allocate IP from NetBox",
        ""
      ],
      [
        "Select Node",
        ""
      ],
      [
        "Terraform Plan",
        ""
      ],
      [
        "Approval",
        ""
      ],
      [
        "Terraform Apply",
        ""
      ],
      [
        "Register Zabbix",
        ""
      ],
      [
        "Configure (Ansible)",
        ""
      ],
      [
        "Configure CI runner (Ansible)",
        ""
      ],
      [
        "Initial security patch",
        ""
      ],
      [
        "Operational readiness",
        ""
      ],
      [
        "DNS Register",
        ""
      ],
      [
        "Write host manifest",
        ""
      ]
    ],
    "schedule": "On demand through Build with Parameters.",
    "why": "I use the same reviewed path for repeatable Linux builds. The address reservation, VM definition and operating-system setup stay connected to the original request.",
    "workers": [
      "provisioner"
    ]
  },
  "Provision Windows": {
    "title": "[VM] Provision Windows",
    "description": "Creates a Windows server from a selected template, with the requested resources and configuration. Jenkins coordinates infrastructure creation and the Windows setup steps.",
    "stages": [
      [
        "Validate input",
        ""
      ],
      [
        "Checkout",
        ""
      ],
      [
        "Validate provision target",
        ""
      ],
      [
        "Name collision check",
        ""
      ],
      [
        "Resolve existing VM",
        ""
      ],
      [
        "Allocate IP from NetBox",
        ""
      ],
      [
        "Select Node",
        ""
      ],
      [
        "Generate local-admin password",
        ""
      ],
      [
        "Resolve Template",
        ""
      ],
      [
        "Terraform Plan",
        ""
      ],
      [
        "Approval",
        ""
      ],
      [
        "Terraform Apply",
        ""
      ],
      [
        "Register Zabbix",
        ""
      ],
      [
        "Wait for WinRM",
        ""
      ],
      [
        "Expand OS disk",
        ""
      ],
      [
        "Move disk to NVMe",
        ""
      ],
      [
        "Add data disk",
        ""
      ],
      [
        "Configure (Ansible)",
        ""
      ],
      [
        "Initial security patch",
        ""
      ],
      [
        "Operational readiness",
        ""
      ],
      [
        "DNS Register",
        ""
      ],
      [
        "Write host manifest",
        ""
      ]
    ],
    "schedule": "On demand through Build with Parameters.",
    "why": "The VM resources and Windows configuration should come from one request. This makes builds repeatable and leaves a record of the plan, approval and setup result.",
    "workers": [
      "provisioner"
    ]
  },
  "Generate documentation indexes": {
    "title": "[Platform] Regenerate derived indexes",
    "description": "Runs the documentation generators, checks for changed output and commits regenerated indexes back to the source repository.",
    "why": "Indexes should reflect their source records. Generating them avoids having to maintain the same list or count in several places.",
    "workers": [
      "provisioner"
    ]
  },
  "Sync Jenkins job definitions": {
    "title": "[Platform] Seed jobs (jobs-as-code)",
    "description": "Recreates Jenkins jobs from Job DSL in Git, including their descriptions, parameters, and schedules.",
    "why": "I need to recreate the job catalog after a controller recovery and review job changes in Git instead of relying on edits made only in Jenkins.",
    "workers": [
      "linux"
    ]
  },
  "Sync work items": {
    "title": "[Ops] Sync Backlog Issues",
    "description": "Synchronizes the backlog records with their issue-tracker representation so the work descriptions and tracking state can be kept together.",
    "why": "The written backlog and issue tracker serve different views of the same work. Synchronizing them reduces duplicate updates and mismatched status.",
    "workers": [
      "provisioner"
    ]
  },
  "Sync Grafana dashboards": {
    "title": "[Platform] Sync Grafana dashboards",
    "description": "Loads the dashboard definitions committed in Git and updates the Kubernetes ConfigMaps used to supply them to Grafana.",
    "why": "Versioned dashboards make monitoring changes reviewable and repeatable. The sync job turns the committed definitions into the dashboards Grafana loads.",
    "workers": [
      "dashboard"
    ]
  },
  "Publish website": {
    "title": "[Ops] Sync Public Site",
    "description": "Stages the public site, checks it for private information, and publishes the accepted output to the public repository.",
    "stages": [
      [
        "Checkout",
        "Read the reviewed site source."
      ],
      [
        "Stage",
        "Prepare the files selected for publication."
      ],
      [
        "Privacy check",
        "Check the staged output for private information. Rejected output is not published."
      ],
      [
        "Publish",
        "Synchronize the accepted output to the public repository."
      ]
    ],
    "why": "The public site is published from a private operations repository. The publication checks are the boundary that keeps private details out of the public copy.",
    "workers": [
      "provisioner"
    ]
  },
  "Upgrade Jenkins": {
    "title": "[Platform] Upgrade Jenkins",
    "description": "Checks that the controller values are present and runs the Helm re-apply for Jenkins using the declared release configuration.",
    "why": "I keep the controller release tied to checked-in Helm values so an upgrade or recovery uses the declared configuration.",
    "workers": [
      "helm"
    ]
  },
  "Upgrade Loki": {
    "title": "[Platform] Upgrade Loki",
    "description": "Validates the pinned chart version and values, previews the release change, pauses for upgrade approval and applies the Helm release. Checks the rollout afterward.",
    "why": "Logging is part of incident investigation. I preview the release change, require approval for the upgrade and check the rollout before treating it as complete.",
    "workers": [
      "helm"
    ]
  },
  "Upgrade Prometheus": {
    "title": "[Platform] Upgrade Prometheus",
    "description": "Validates the pinned chart version and values, previews the release change, pauses for upgrade approval and applies the Helm release. Updates the managed monitoring resources and checks the rollout afterward.",
    "why": "Monitoring needs to survive its own maintenance. The job makes the chart change and approval visible, then checks the resulting rollout.",
    "workers": [
      "helm"
    ]
  },
  "Clear expired maintenance": {
    "title": "[Ops] Zabbix Maintenance Cleanup",
    "description": "Removes expired monitoring maintenance windows.",
    "why": "Expired maintenance objects accumulate after planned work. This job removes them so old windows do not obscure the current maintenance state.",
    "workers": [
      "zabbix"
    ]
  },
  "Monitoring maintenance": {
    "title": "[Ops] Zabbix Maintenance Windows",
    "description": "Creates monitoring maintenance windows for planned work.",
    "why": "Planned work can generate expected alerts. A bounded maintenance window gives monitoring that context without permanently disabling the checks.",
    "workers": [
      "zabbix"
    ]
  },
  "Automated recovery": {
    "title": "[Ops] Self-heal",
    "description": "Coordinates the self-heal workflow, including checks and approval where the operation requires it.",
    "why": "Some detected faults have known recovery steps. I coordinate detection, any required approval and the selected repair while preserving a record of the attempt.",
    "workers": [
      "provisioner"
    ]
  },
  "AWS Access Key Rotation": {
    "title": "[IAM] AWS Access Key Rotation",
    "description": "Checks the rotation policy for AWS Access Key and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 16:00 to 16:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 16 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate AWS access key",
        ""
      ]
    ],
    "why": "AWS automation should not depend on an access key that never changes. This gives key replacement a scheduled policy and a recorded outcome.",
    "workers": [
      "provisioner"
    ]
  },
  "Sweep Disabled Users": {
    "title": "[IAM] Sweep Disabled Users",
    "description": "Checks disabled accounts against the retention period, deletes those eligible for removal, and reports actions or anomalies. The default grace period is 30 days.",
    "schedule": "Daily during 6:00 to 6:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 6 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Wrap vault token for AD stage",
        ""
      ],
      [
        "Sweep (Windows)",
        ""
      ],
      [
        "Notify (Linux)",
        ""
      ]
    ],
    "why": "Offboarding starts with reversible access removal. A later sweep enforces the retention period before deleting accounts that are eligible for cleanup.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Cloudflare Access Entra SSO Credential Rotation": {
    "title": "[IAM] Cloudflare Access Entra SSO Credential Rotation",
    "description": "Checks the rotation policy for Cloudflare Access Entra SSO Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 18:00 to 18:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 18 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Cloudflare Access Entra credential",
        ""
      ]
    ],
    "why": "The Cloudflare Access sign-in integration relies on an Entra application credential. I need to maintain that dependency before expiry interrupts sign-in.",
    "workers": [
      "provisioner"
    ]
  },
  "Cloudflare Credential Rotation": {
    "title": "[IAM] Cloudflare Credential Rotation",
    "description": "Checks the rotation policy for Cloudflare Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 13:00 to 13:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 13 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate and inventory Cloudflare credentials",
        ""
      ]
    ],
    "why": "Cloudflare automation manages several kinds of credential and consumer. I keep their renewal and access audit in a controlled workflow instead of tracking replacements manually.",
    "workers": [
      "provisioner"
    ]
  },
  "Deprovision User": {
    "title": "[IAM] Deprovision User",
    "description": "Requires explicit confirmation and approval by a second authorized operator. It captures recovery information, disables the directory account, removes access, and hands retained files and mail to the manager. Account deletion is handled by the later sweep.",
    "schedule": "On demand. No timer is declared for this job.",
    "cron": null,
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Gate",
        ""
      ],
      [
        "Lookup target (read-only)",
        ""
      ],
      [
        "Four-eyes approval",
        ""
      ],
      [
        "Snapshot offboard state",
        ""
      ],
      [
        "Wrap homemove credential",
        ""
      ],
      [
        "AD deprovision (Windows)",
        ""
      ],
      [
        "Entra scrub (Linux)",
        ""
      ],
      [
        "Mail handoff (Linux)",
        ""
      ]
    ],
    "why": "Removing access touches the directory, cloud identity and mail. I require a separate approver and preserve the offboarding state so a sensitive change has an audit trail.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Entra Credential Exporter Rotation": {
    "title": "[IAM] Entra Credential Exporter Rotation",
    "description": "Checks the rotation policy for Entra Credential Exporter and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 6:00 to 6:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 6 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Entra credential inventory identity",
        ""
      ]
    ],
    "why": "The credential exporter must keep authenticating to report credential health. Maintaining its own credential prevents the monitoring path from silently expiring.",
    "workers": [
      "provisioner"
    ]
  },
  "Kubernetes Entra SSO Credential Rotation": {
    "title": "[IAM] Kubernetes Entra SSO Credential Rotation",
    "description": "Checks the rotation policy for Kubernetes Entra SSO Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 8:00 to 8:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 8 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Kubernetes Entra SSO credentials",
        ""
      ]
    ],
    "why": "The Kubernetes sign-in integration depends on its Entra credential. Scheduled evaluation helps avoid an expiry turning into an access outage.",
    "workers": [
      "provisioner"
    ]
  },
  "Roundcube Entra Credential Rotation": {
    "title": "[IAM] Roundcube Entra Credential Rotation",
    "description": "Checks the rotation policy for Roundcube Entra Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 4:00 to 4:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 4 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Roundcube Entra credential",
        ""
      ]
    ],
    "why": "The mail sign-in integration needs a valid Entra credential. I maintain that credential through a job with a visible result rather than waiting for sign-in to fail.",
    "workers": [
      "provisioner"
    ]
  },
  "Entra Service Credential Rotation": {
    "title": "[IAM] Entra Service Credential Rotation",
    "description": "Checks the rotation policy for Entra Service Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 5:00 to 5:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 5 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate per-run Entra service credential",
        ""
      ]
    ],
    "why": "Several automation consumers rely on Entra application credentials. A shared renewal workflow keeps their lifecycle policy consistent.",
    "workers": [
      "provisioner"
    ]
  },
  "Group Policy Drift": {
    "title": "[IAM] Group Policy Drift",
    "description": "Exports Group Policy state and compares it with the declared baseline to report drift. This job does not apply policy changes.",
    "schedule": "Daily during 7:00 to 7:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 7 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Compare live GPO state with git",
        ""
      ]
    ],
    "why": "A policy edited directly in the directory can differ from its baseline in Git. I want to see that drift before making a decision about remediation.",
    "workers": [
      "windows"
    ]
  },
  "GPO Tools Prerequisite": {
    "title": "[IAM] GPO Tools Prerequisite",
    "description": "Checks or installs the Group Policy management tools on a selected Windows worker. Check-only is the default; installation is an attended operation.",
    "schedule": "On demand. No timer is declared for this job.",
    "cron": null,
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [],
    "why": "Policy automation depends on Windows management tools being present. This job makes that prerequisite check explicit and separates checking from attended installation.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Grafana Service Account Token Rotation": {
    "title": "[IAM] Grafana Service Account Token Rotation",
    "description": "Checks the rotation policy for Grafana Service Account Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 9:00 to 9:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 9 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Grafana service-account tokens",
        ""
      ]
    ],
    "why": "Dashboard automation needs a working Grafana API token. This job makes token renewal visible and repeatable instead of leaving a long-lived token unmanaged.",
    "workers": [
      "provisioner"
    ]
  },
  "Jenkins API Token Rotation": {
    "title": "[IAM] Jenkins API Token Rotation",
    "description": "Checks the rotation policy for Jenkins API Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 11:00 to 11:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 11 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Jenkins API token",
        ""
      ]
    ],
    "why": "Automation callers need to authenticate to Jenkins. I maintain their registered API token through a recorded workflow so renewal does not depend on a manual reminder.",
    "workers": [
      "provisioner"
    ]
  },
  "Jenkins notifyCommit Token Rotation": {
    "title": "[IAM] Jenkins notifyCommit Token Rotation",
    "description": "Checks the rotation policy for Jenkins notifyCommit Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 12:00 to 12:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 12 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Jenkins notifyCommit token",
        ""
      ]
    ],
    "why": "Source-change notifications need their own valid Jenkins token. I track its lifecycle separately from ordinary API access because it is part of the build-trigger path.",
    "workers": [
      "provisioner"
    ]
  },
  "LiteLLM Virtual Key Rotation": {
    "title": "[IAM] LiteLLM Virtual Key Rotation",
    "description": "Checks the rotation policy for LiteLLM Virtual Key and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 17:00 to 17:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 17 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate LiteLLM virtual keys",
        ""
      ]
    ],
    "why": "Applications use virtual keys to reach the model gateway. I maintain those consumer keys through policy so they do not remain unchanged indefinitely.",
    "workers": [
      "provisioner"
    ]
  },
  "NetBox API Token Rotation": {
    "title": "[IAM] NetBox API Token Rotation",
    "description": "Checks the rotation policy for NetBox API Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 14:00 to 14:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 14 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate NetBox API token",
        ""
      ]
    ],
    "why": "Provisioning and inventory automation depend on NetBox API access. This job keeps the token lifecycle part of the operating workflow.",
    "workers": [
      "provisioner"
    ]
  },
  "NetBox Entra SSO Credential Rotation": {
    "title": "[IAM] NetBox Entra SSO Credential Rotation",
    "description": "Checks the rotation policy for NetBox Entra SSO Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 16:00 to 16:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 16 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate NetBox Entra credential",
        ""
      ]
    ],
    "why": "NetBox sign-in depends on an Entra application credential. I renew it through a recorded job to keep expiry from becoming a login incident.",
    "workers": [
      "provisioner"
    ]
  },
  "OPNsense API Key Rotation": {
    "title": "[IAM] OPNsense API Key Rotation",
    "description": "Checks the rotation policy for OPNsense API Key and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 15:00 to 15:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 15 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Reconcile OPNsense API key pair",
        ""
      ]
    ],
    "why": "Firewall automation uses API credentials with a separate lifecycle from interactive sign-in. I maintain that dependency through an explicit credential workflow.",
    "workers": [
      "provisioner"
    ]
  },
  "Provision User": {
    "title": "[IAM] Provision User",
    "description": "Creates or reconciles a directory user from the requested department, job title, and manager, then configures Entra access. An existing account or an unavailable directory check pauses at the name-collision gate before credentials or accounts change.",
    "schedule": "On demand. No timer is declared for this job.",
    "cron": null,
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Validate SAM available",
        ""
      ],
      [
        "Name collision gate",
        ""
      ],
      [
        "Password -> Vault + wrap",
        ""
      ],
      [
        "Load role",
        ""
      ],
      [
        "AD user (Windows)",
        ""
      ],
      [
        "Entra (Linux)",
        ""
      ]
    ],
    "why": "A new user needs consistent identity and access setup. The collision check prevents an existing account from being silently overwritten by a new request.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Proxmox Entra SSO Credential Rotation": {
    "title": "[IAM] Proxmox Entra SSO Credential Rotation",
    "description": "Checks the rotation policy for Proxmox Entra SSO Credential and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 17:00 to 17:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 17 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Proxmox Entra credential",
        ""
      ]
    ],
    "why": "The virtualization platform uses an Entra credential for sign-in. Its renewal belongs in scheduled maintenance instead of an expiry-driven repair.",
    "workers": [
      "provisioner"
    ]
  },
  "Proxmox and PBS API Token Rotation": {
    "title": "[IAM] Proxmox and PBS API Token Rotation",
    "description": "Checks the rotation policy for Proxmox and PBS API Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 12:00 to 12:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 12 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Proxmox/PBS API tokens",
        ""
      ]
    ],
    "why": "VM and backup automation depend on API tokens. Their renewal needs a recorded outcome because a broken token can interrupt provisioning or backup operations.",
    "workers": [
      "provisioner"
    ]
  },
  "Jenkins Vault AppRole SecretID Rotation": {
    "title": "[IAM] Jenkins Vault AppRole SecretID Rotation",
    "description": "Checks the rotation policy for Jenkins Vault AppRole SecretID and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 7:00 to 7:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 7 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Jenkins Vault AppRole SecretID",
        ""
      ]
    ],
    "why": "Jenkins needs a working AppRole credential to obtain runtime secrets. I maintain that bootstrap dependency as part of the platform rather than leaving it unchanged indefinitely.",
    "workers": [
      "provisioner"
    ]
  },
  "Zabbix API Token Rotation": {
    "title": "[IAM] Zabbix API Token Rotation",
    "description": "Checks the rotation policy for Zabbix API Token and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 10:00 to 10:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 10 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Rotate Zabbix API token",
        ""
      ]
    ],
    "why": "Monitoring automation calls the Zabbix API. I keep its token renewal visible so a credential problem is distinguishable from a monitoring failure.",
    "workers": [
      "provisioner"
    ]
  },
  "Zabbix Agent PSK Rotation": {
    "title": "[IAM] Zabbix Agent PSK Rotation",
    "description": "Checks the rotation policy for Zabbix Agent PSK and rotates credentials when the policy requires it. Jenkins records the result and reports failures.",
    "schedule": "Daily during 14:00 to 14:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "cron": "H 14 * * *",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": [
      [
        "Evaluate registered Linux PSKs",
        ""
      ]
    ],
    "why": "Agent connections use pre-shared keys for authentication. This job manages their lifecycle across registered Linux agents instead of leaving the original keys in place.",
    "workers": [
      "provisioner"
    ]
  },
  "Morning triage": {
    "title": "[AIOps] Morning Triage",
    "description": "Collects operational signals, runs triage, and sends a morning digest. If a collector fails, the digest identifies the missing source.",
    "schedule": "Daily during 06:00 to 06:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 6 * * *",
    "why": "I want a morning view of operational issues and missing signals, so I can decide what needs attention without reading each collector independently.",
    "workers": [
      "jobsearch"
    ]
  },
  "Jobsearch application restore": {
    "title": "[DR] Jobsearch Application Restore",
    "description": "Restores the latest job-search database backup into a temporary PostgreSQL instance, checks its schema and data, and removes the temporary instance. This tests recovery without replacing the production database.",
    "schedule": "Mondays during 05:00 to 05:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 5 * * 1",
    "why": "Database backups need an application-level recovery check. Restoring into a temporary instance tests whether the data and schema can be used without replacing production.",
    "workers": [
      "jobsearch"
    ]
  },
  "CIS compliance score": {
    "title": "[Security] CIS Compliance Score",
    "description": "Combines Wazuh configuration assessments for Linux and Windows with kube-bench checks for Kubernetes. Stores the compliance result and files regressions for human review.",
    "schedule": "Sundays during 06:00 to 06:59 in America/Denver. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "TZ=America/Denver\nH 6 * * 0",
    "why": "A score is useful only if I can see what regressed. This job tracks configuration checks over time and turns regressions into work for human review.",
    "workers": [
      "provisioner"
    ]
  },
  "Internal website scan": {
    "title": "[Security] Internal Website Scan",
    "description": "Checks approved internal web pages for unintended anonymous access and produces a private report. The checks use anonymous GET requests within a defined scope.",
    "schedule": "Saturdays during 07:00 to 07:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 7 * * 6",
    "why": "Internal applications can accidentally expose content before sign-in. I check a defined set of anonymous entry points and keep the resulting report private.",
    "workers": [
      "provisioner"
    ]
  },
  "Collect job postings": {
    "title": "[Jobsearch] Collect",
    "description": "Collects job postings from configured job boards and email alerts, retrieves posting details, and records new listings. Checks source activity and identifies reposts.",
    "schedule": "Daily during 06:00 to 06:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 6 * * *",
    "why": "Postings arrive through several boards and email sources. I collect them into one store so later scoring and review do not depend on manually copying each listing.",
    "workers": [
      "jobsearch"
    ]
  },
  "Back up application databases": {
    "title": "[Jobsearch] DB Backup",
    "description": "Dumps the job-search and automated-recovery databases, compresses the backups, and copies them to backup storage. Removes expired backups and reports failures.",
    "schedule": "Daily during 02:00 to 02:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 2 * * *",
    "why": "The application databases contain accumulated records and recovery history. Their backup needs its own retention and failure reporting, separate from whether the apps are running.",
    "workers": [
      "jobsearch"
    ]
  },
  "Jobsearch digest": {
    "title": "[Jobsearch] Digest",
    "description": "Emails a digest of matching job postings and mailbox items that need review. A preview option renders the digest without sending mail.",
    "schedule": "Daily during 13:00 to 13:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 13 * * *",
    "why": "I use a digest to review relevant postings together and notice mailbox items that still need filing. Preview mode lets me inspect the email before sending.",
    "workers": [
      "jobsearch"
    ]
  },
  "Enrich job postings": {
    "title": "[Jobsearch] Enrich",
    "description": "Extracts skills and relevance with Ollama, parses salary and deadline details, and uses quota-routed agents to score postings and research companies. Updates the stored records for later review.",
    "schedule": "Daily during 07:00 to 07:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 7 * * *",
    "why": "Collected listings need structure before they are useful for review. Extraction and scoring help me compare skills, pay, deadlines and relevance across sources.",
    "workers": [
      "jobsearch"
    ]
  },
  "Import Greenbone findings": {
    "title": "[Security] Greenbone Findings Import",
    "description": "Reconciles the approved Greenbone scan task and imports its latest completed vulnerability report into the security findings store. Starting a scan immediately requires an explicit operator option.",
    "schedule": "Daily during 05:00 to 05:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 5 * * *",
    "why": "The scanner and the security dashboard have different responsibilities. This job brings completed scan evidence into the store used for tracking findings.",
    "workers": [
      "provisioner"
    ]
  },
  "Import IaC findings": {
    "title": "[Security] IaC Findings Import",
    "description": "Imports the latest retained Trivy infrastructure-as-code scan from the main branch into the security findings store. Reports a failure if the required scan artifact is unavailable.",
    "schedule": "Daily during 05:00 to 05:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 5 * * *",
    "why": "CI produces scan artifacts, but the security view needs findings tied to the main branch. This import connects those two without treating an unmerged proposal as current posture.",
    "workers": [
      "provisioner"
    ]
  },
  "Enroll Windows Wazuh agents": {
    "title": "[Security] Wazuh Windows Agent Enrollment",
    "description": "Uses Ansible to install and enroll the Wazuh security agent on an approved Windows target. Any temporary remote-management access created for enrollment is removed afterward.",
    "schedule": "On demand through Build with Parameters. No recurring timer is declared.",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "why": "Windows systems need to enroll with security monitoring before their coverage is meaningful. This job makes enrollment repeatable and cleans up temporary management access.",
    "workers": [
      "provisioner",
      "windows"
    ]
  },
  "Collect Wazuh coverage": {
    "title": "[Security] Wazuh Agent Coverage",
    "description": "Collects a daily snapshot of Wazuh agent coverage for monitoring. Continuous alert collection runs separately from this Jenkins job.",
    "schedule": "Daily during 08:00 to 08:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 8 * * *",
    "why": "An alert feed alone does not prove that agents are enrolled and reporting. I collect coverage separately so missing monitoring can be investigated.",
    "workers": [
      "provisioner"
    ]
  },
  "Wazuh incident triage": {
    "title": "[Security] Wazuh Headless Triage",
    "description": "Uses headless agents to draft incident narratives from Wazuh findings for operator review. Jenkins runs this optional analysis on demand.",
    "schedule": "On demand. No recurring timer is declared.",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "why": "Some incidents need an explanation beyond rule-based classification. I run this optional narrative step when I want an agent-assisted account to review.",
    "workers": [
      "jobsearch"
    ]
  },
  "Public website scan": {
    "title": "[Security] Public Website Scan",
    "description": "Assesses the approved public website scope with deterministic checks and signed Nuclei templates, then produces a report. AI research provides context without executing changes.",
    "schedule": "Saturdays during 06:00 to 06:59 in the Jenkins controller time zone. Jenkins chooses a stable minute (H).",
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "cron": "H 6 * * 6",
    "why": "The public site changes over time, as do scanner checks. I use a recurring scoped assessment to find issues and produce evidence for review without automatic remediation.",
    "workers": [
      "provisioner"
    ]
  }
});
