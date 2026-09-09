// Parameter controls and ordered stage labels transcribed from the job definitions.
export const DEMOS = [
  {
    "id": "vm-provision",
    "job": "Provision Linux",
    "title": "[VM] Provision Linux",
    "group": "VM",
    "summary": "Creates a Linux server through a reviewed workflow. NetBox allocates its address, Terraform plans and creates the VM, and Ansible configures the operating system. Approval separates the plan from the change.",
    "fields": [
      {
        "name": "VM_NAME",
        "kind": "string",
        "help": "Hostname for the new VM (no domain)",
        "values": null,
        "default": ""
      },
      {
        "name": "ROLE",
        "kind": "choice",
        "help": "Role determines which VLAN/prefix the IP comes from",
        "values": [
          "infra",
          "control",
          "ci",
          "kubernetes",
          "identity",
          "clients"
        ],
        "default": "infra"
      },
      {
        "name": "CORES",
        "kind": "choice",
        "help": "CPU cores",
        "values": [
          "1",
          "2",
          "4",
          "6",
          "8"
        ],
        "default": "1"
      },
      {
        "name": "MEMORY_GB",
        "kind": "choice",
        "help": "Memory in GB",
        "values": [
          "1",
          "2",
          "4",
          "6",
          "8",
          "12"
        ],
        "default": "1"
      },
      {
        "name": "DISK_GB",
        "kind": "choice",
        "help": "OS/root disk size in GB. The root filesystem grows on first boot.",
        "values": [
          "20",
          "30",
          "40",
          "60",
          "80",
          "100",
          "160",
          "200"
        ],
        "default": "20"
      },
      {
        "name": "PUBLISH_DNS",
        "kind": "boolean",
        "help": "Also create a public DNS record for published services",
        "values": null,
        "default": false
      },
      {
        "name": "CONFIG_PROFILE",
        "kind": "choice",
        "help": "base configures the operating system; ci-runner also installs and registers a Gitea Actions runner.",
        "values": [
          "base",
          "ci-runner"
        ],
        "default": "base"
      }
    ],
    "stages": [
      "Validate input",
      "Checkout",
      "Validate provision target",
      "Name collision check",
      "Resolve existing VM",
      "Allocate IP from NetBox",
      "Select Node",
      "Terraform Plan",
      "Approval",
      "Terraform Apply",
      "Register Zabbix",
      "Configure (Ansible)",
      "Configure CI runner (Ansible)",
      "Initial security patch",
      "Operational readiness",
      "DNS Register",
      "Write host manifest"
    ]
  },
  {
    "id": "vm-provision-windows",
    "job": "Provision Windows",
    "title": "[VM] Provision Windows",
    "group": "VM",
    "summary": "Creates a Windows server from a selected template, with the requested resources and configuration. Jenkins coordinates infrastructure creation and the Windows setup steps.",
    "fields": [
      {
        "name": "VM_NAME",
        "kind": "string",
        "help": "Hostname for the new Windows VM (no domain)",
        "values": null,
        "default": ""
      },
      {
        "name": "ROLE",
        "kind": "choice",
        "help": "Role determines which VLAN/prefix the IP comes from",
        "values": [
          "infra",
          "control",
          "ci",
          "kubernetes",
          "identity",
          "clients"
        ],
        "default": "infra"
      },
      {
        "name": "CORES",
        "kind": "choice",
        "help": "CPU cores",
        "values": [
          "4",
          "6",
          "8"
        ],
        "default": "4"
      },
      {
        "name": "MEMORY_GB",
        "kind": "choice",
        "help": "Memory in GB",
        "values": [
          "4",
          "6",
          "8",
          "10",
          "12"
        ],
        "default": "4"
      },
      {
        "name": "TEMPLATE_OS",
        "kind": "choice",
        "help": "Windows Server version used to select the tagged template.",
        "values": [
          "2022",
          "2025"
        ],
        "default": "2022"
      },
      {
        "name": "STORAGE",
        "kind": "choice",
        "help": "Final disk location: NFS (shared) or NVMe (node-local).",
        "values": [
          "NFS",
          "NVMe"
        ],
        "default": "NFS"
      },
      {
        "name": "DISK_GB",
        "kind": "cascade",
        "help": "OS disk size in GB. NVMe maximum is 400.",
        "values": [
          "40",
          "60",
          "80",
          "100",
          "120",
          "160",
          "200",
          "250",
          "300",
          "400",
          "500",
          "750",
          "1000",
          "1500",
          "2000"
        ],
        "default": "40"
      },
      {
        "name": "DATA_DISK_GB",
        "kind": "cascade",
        "help": "Optional second data disk in GB. None means no second disk. NVMe maximum is 400.",
        "values": [
          "None",
          "20",
          "40",
          "60",
          "80",
          "100",
          "120",
          "160",
          "200",
          "250",
          "300",
          "400",
          "500",
          "750",
          "1000",
          "1500",
          "2000"
        ],
        "default": "None"
      },
      {
        "name": "TOOLS",
        "kind": "checkboxes",
        "help": "Optional user tools to install via Chocolatey.",
        "values": [
          "putty",
          "notepadplusplus",
          "7zip",
          "googlechrome",
          "firefox",
          "git",
          "vscode",
          "wireshark",
          "winscp",
          "sysinternals",
          "greenshot",
          "powershell-core"
        ],
        "default": []
      },
      {
        "name": "FEATURES",
        "kind": "checkboxes",
        "help": "Optional Windows roles/features to install.",
        "values": [
          "IIS Web Server",
          "DNS Server",
          "DHCP Server",
          "Active Directory Domain Services",
          "RSAT AD Tools",
          "Failover Clustering",
          "Hyper-V",
          "SNMP Service",
          "Telnet Client",
          ".NET Framework 3.5"
        ],
        "default": []
      },
      {
        "name": "NESTED_VIRT",
        "kind": "boolean",
        "help": "Enable nested virtualization. Required when Hyper-V is selected; host CPU mode restricts migration to compatible nodes.",
        "values": null,
        "default": false
      },
      {
        "name": "PUBLISH_DNS",
        "kind": "boolean",
        "help": "Also create a public DNS record for published services",
        "values": null,
        "default": false
      }
    ],
    "stages": [
      "Validate input",
      "Checkout",
      "Validate provision target",
      "Name collision check",
      "Resolve existing VM",
      "Allocate IP from NetBox",
      "Select Node",
      "Generate local-admin password",
      "Resolve Template",
      "Terraform Plan",
      "Approval",
      "Terraform Apply",
      "Register Zabbix",
      "Wait for WinRM",
      "Expand OS disk",
      "Move disk to NVMe",
      "Add data disk",
      "Configure (Ansible)",
      "Initial security patch",
      "Operational readiness",
      "DNS Register",
      "Write host manifest"
    ]
  },
  {
    "id": "vm-deprovision",
    "job": "Decommission Linux",
    "title": "[VM] Decommission Linux",
    "group": "VM",
    "summary": "Runs the Linux server retirement workflow, including the infrastructure and service records associated with the server.",
    "fields": [
      {
        "name": "VM_NAME",
        "kind": "string",
        "help": "Hostname of the VM to decommission (its Terraform workspace)",
        "values": null,
        "default": ""
      }
    ],
    "stages": [
      "Validate input",
      "Checkout",
      "Terraform Plan (destroy)",
      "Approval",
      "Remove host manifest",
      "Terraform Destroy",
      "Release IP from NetBox",
      "Deregister Zabbix",
      "Deregister Wazuh",
      "DNS Deregister",
      "Delete workspace"
    ]
  },
  {
    "id": "vm-deprovision-windows",
    "job": "Decommission Windows",
    "title": "[VM] Decommission Windows",
    "group": "VM",
    "summary": "Runs the Windows server retirement workflow and coordinates removal of its infrastructure and service records.",
    "fields": [
      {
        "name": "VM_NAME",
        "kind": "string",
        "help": "Hostname of the Windows VM to decommission (its Terraform workspace)",
        "values": null,
        "default": ""
      }
    ],
    "stages": [
      "Validate input",
      "Checkout",
      "Terraform Plan (destroy)",
      "Approval",
      "Remove host manifest",
      "Terraform Destroy",
      "Release IP from NetBox",
      "Deregister Zabbix",
      "Deregister Wazuh",
      "Purge per-host Vault secrets",
      "AD + DNS Deregister",
      "Delete workspace"
    ]
  },
  {
    "id": "user-provision",
    "job": "Provision User",
    "title": "[IAM] Provision User",
    "group": "IAM",
    "summary": "Creates or reconciles a directory user from the requested department, job title, and manager, then configures Entra access. An existing account or an unavailable directory check pauses at the name-collision gate before credentials or accounts change.",
    "fields": [
      {
        "name": "SAM",
        "kind": "string",
        "help": "sAMAccountName, e.g. jsmith",
        "values": null,
        "default": ""
      },
      {
        "name": "GIVEN_NAME",
        "kind": "string",
        "help": "First name",
        "values": null,
        "default": ""
      },
      {
        "name": "SURNAME",
        "kind": "string",
        "help": "Last name",
        "values": null,
        "default": ""
      },
      {
        "name": "DEPARTMENT",
        "kind": "choice",
        "help": "Department",
        "values": [
          "Service Desk",
          "SysAdmin",
          "Platform",
          "NetOps"
        ],
        "default": "Service Desk"
      },
      {
        "name": "TITLE",
        "kind": "cascade",
        "help": "Job title (filtered by department)",
        "values": [
          "Service Desk Analyst",
          "Senior Service Desk Analyst",
          "Service Desk Lead",
          "Service Desk Manager"
        ],
        "default": "Service Desk Analyst"
      },
      {
        "name": "MANAGER_SEARCH",
        "kind": "string",
        "help": "Type part of the manager name, then click elsewhere to refresh the MANAGER list",
        "values": null,
        "default": ""
      },
      {
        "name": "MANAGER",
        "kind": "cascade",
        "help": "Manager (directory lookup, filtered by MANAGER_SEARCH)",
        "values": [
          "-- type at least 2 characters in MANAGER_SEARCH --"
        ],
        "default": "-- type at least 2 characters in MANAGER_SEARCH --"
      }
    ],
    "stages": [
      "Validate SAM available",
      "Name collision gate",
      "Password -> Vault + wrap",
      "Load role",
      "AD user (Windows)",
      "Entra (Linux)"
    ]
  },
  {
    "id": "user-deprovision",
    "job": "Deprovision User",
    "title": "[IAM] Deprovision User",
    "group": "IAM",
    "summary": "Requires explicit confirmation and approval by a second authorized operator. It captures recovery information, disables the directory account, removes access, and hands retained files and mail to the manager. Account deletion is handled by the later sweep.",
    "fields": [
      {
        "name": "SAM",
        "kind": "string",
        "help": "sAMAccountName of the user to offboard",
        "values": null,
        "default": ""
      },
      {
        "name": "CONFIRM",
        "kind": "boolean",
        "help": "Tick to confirm you intend to offboard this user",
        "values": null,
        "default": false
      }
    ],
    "stages": [
      "Gate",
      "Lookup target (read-only)",
      "Four-eyes approval",
      "Snapshot offboard state",
      "Wrap homemove credential",
      "AD deprovision (Windows)",
      "Entra scrub (Linux)",
      "Mail handoff (Linux)"
    ]
  }
];
export const getDemo = id => DEMOS.find(d=>d.id===id);
