export const JOB_CATALOG = Object.freeze({
  "Backup digest": {
    "title": "[Ops] Backup Digest",
    "description": "Collects backup results and sends the backup digest so I can check coverage and failures together."
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
    ]
  },
  "Certificate sync": {
    "title": "[PKI] Certificate Sync",
    "description": "Distributes the renewed certificate to the services that need it and checks the certificates they serve afterward."
  },
  "Decommission Linux": {
    "title": "[VM] Decommission Linux",
    "description": "Runs the Linux server retirement workflow, including the infrastructure and service records associated with the server.",
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
    "schedule": "On demand through Build with Parameters."
  },
  "Decommission Windows": {
    "title": "[VM] Decommission Windows",
    "description": "Runs the Windows server retirement workflow and coordinates removal of its infrastructure and service records.",
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
    "schedule": "On demand through Build with Parameters."
  },
  "Backup heartbeat": {
    "title": "[Monitoring] Digest dead-man switch heartbeat",
    "description": "Checks in for the backup digest so a missing report can be detected independently of the report itself."
  },
  "Restore verification": {
    "title": "[DR] Weekly Restore-Verify",
    "description": "Restores a protected system into an isolated test environment, verifies the result, then removes the test copy."
  },
  "Configuration drift check": {
    "title": "[Assurance] Estate-wide Drift and Source Assurance",
    "description": "Checks the estate for differences between declared configuration and observed state."
  },
  "Container image scan": {
    "title": "[Security] Estate image scan",
    "description": "Scans container images used in the estate for vulnerability findings."
  },
  "Windows update scan": {
    "title": "[Security] Estate Windows KB scan",
    "description": "Checks Windows update coverage across the estate."
  },
  "Publish public repositories": {
    "title": "[Publish] Export public repositories",
    "description": "Prepares reviewed source for publication to the public repositories."
  },
  "Monitoring reconciliation": {
    "title": "[Monitoring] NOC overview reconcile",
    "description": "Reconciles the monitoring overview with the information that feeds it."
  },
  "System patching": {
    "title": "[Operations] Rolling Estate Patch",
    "description": "Coordinates rolling system patching across the estate."
  },
  "Backup metrics": {
    "title": "[Monitoring] PBS facts collector",
    "description": "Collects backup facts for monitoring and reporting."
  },
  "Pull request checks": {
    "title": "[CI] Pull request merge preview",
    "description": "Tests the proposed merge while keeping the proposed code separate from the credentials used to report its result."
  },
  "Dispatch pull request checks": {
    "title": "[CI] Pull request dispatcher",
    "description": "Dispatches pull-request checks and limits duplicate or concurrent work."
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
    "schedule": "On demand through Build with Parameters."
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
    "schedule": "On demand through Build with Parameters."
  },
  "Generate documentation indexes": {
    "title": "[Platform] Regenerate derived indexes",
    "description": "Regenerates documentation indexes from their source files."
  },
  "Sync Jenkins job definitions": {
    "title": "[Platform] Seed jobs (jobs-as-code)",
    "description": "Recreates Jenkins jobs from Job DSL in Git, including their descriptions, parameters, and schedules."
  },
  "Sync work items": {
    "title": "[Ops] Sync Backlog Issues",
    "description": "Synchronizes the work-item records used by the lab."
  },
  "Sync Grafana dashboards": {
    "title": "[Platform] Sync Grafana dashboards",
    "description": "Synchronizes the dashboard definitions committed in Git with Grafana."
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
    ]
  },
  "Upgrade Jenkins": {
    "title": "[Platform] Upgrade Jenkins",
    "description": "Runs the Jenkins upgrade pipeline."
  },
  "Upgrade Loki": {
    "title": "[Platform] Upgrade Loki",
    "description": "Runs the Loki upgrade pipeline."
  },
  "Upgrade Prometheus": {
    "title": "[Platform] Upgrade Prometheus",
    "description": "Runs the Prometheus upgrade pipeline."
  },
  "Clear expired maintenance": {
    "title": "[Ops] Zabbix Maintenance Cleanup",
    "description": "Removes expired monitoring maintenance windows."
  },
  "Monitoring maintenance": {
    "title": "[Ops] Zabbix Maintenance Windows",
    "description": "Creates monitoring maintenance windows for planned work."
  },
  "Automated recovery": {
    "title": "[Ops] Self-heal",
    "description": "Coordinates the self-heal workflow, including checks and approval where the operation requires it."
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
    ]
  },
  "GPO Tools Prerequisite": {
    "title": "[IAM] GPO Tools Prerequisite",
    "description": "Checks or installs the Group Policy management tools on a selected Windows worker. Check-only is the default; installation is an attended operation.",
    "schedule": "On demand. No timer is declared for this job.",
    "cron": null,
    "scheduleSource": "Declared in the job definition. Exact live timer settings have not been independently verified.",
    "stages": []
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
    ]
  }
});
