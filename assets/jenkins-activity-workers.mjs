// Public summaries of the checked-in worker templates and Dockerfiles.
// Private registry locations, pod identities and runtime credentials are omitted.
export const WORKER_PROFILES = Object.freeze({
  provisioner: {
    title: 'Custom provisioning image',
    image: 'provisioner-agent',
    environment: 'Kubernetes pod',
    tools: 'Python, Ansible, Terraform, Vault CLI, kubectl, Git, SSH and Windows remote-management libraries.',
    purpose: 'I build this Debian-based image with the infrastructure tools already installed. The same worker can create a VM, configure its operating system and update service records without installing the toolchain for every build.',
    lifecycle: 'Jenkins requests the provisioner pod template for the build. The configured image is pinned by digest; job-specific pod definitions can also use that image.'
  },
  jobsearch: {
    title: 'Custom Python application image',
    image: 'jobsearch-agent',
    environment: 'Kubernetes pod',
    tools: 'Python, PostgreSQL client and server tools, Git, Vault CLI, document-rendering tools, and headless agent CLIs.',
    purpose: 'I extend the Jenkins inbound-agent image with the dependencies used by collection, scoring, digest and database-recovery jobs. Python handles the application scripts; the database and document tools support their specific stages.',
    lifecycle: 'Jenkins requests the jobsearch pod template. Each build gets a workspace in the worker environment.'
  },
  packer: {
    title: 'Custom template-building image',
    image: 'packer-agent',
    environment: 'Kubernetes pod per matrix build',
    tools: 'Packer with the Proxmox plugin, Python, Vault CLI, Git, SSH and jq.',
    purpose: 'I package the template build tools together so each Windows template build uses the same environment. Separate pods let the matrix build its selected versions concurrently.',
    lifecycle: 'The pipeline defines the Packer pod and creates a worker for each matrix branch.'
  },
  python: {
    title: 'Python test worker',
    image: 'python:3.11',
    environment: 'Kubernetes pod with Python and Jenkins agent containers',
    tools: 'Python 3.11. The pipeline installs the dependencies required by its checks.',
    purpose: 'The Python container runs the scripts while a separate Jenkins inbound-agent container maintains the controller connection. This uses the upstream Python image.',
    lifecycle: 'The pipeline selects the Python pod template. Pull-request validation separates execution of proposed code from publishing the check result.'
  },
  tools: {
    title: 'Kubernetes deployment tools',
    image: 'alpine/k8s:1.30.14',
    environment: 'Kubernetes pod with tools and Jenkins agent containers',
    tools: 'Kubernetes tooling; the certificate pipeline installs its additional deployment tools before use.',
    purpose: 'The certificate job uses the tools container to distribute the renewed certificate and verify the services that consume it.',
    lifecycle: 'Jenkins selects the linux-tools pod template. The tools container runs the deployment steps.'
  },
  helm: {
    title: 'Helm release worker',
    image: 'alpine/k8s:1.30.14',
    environment: 'Pipeline-defined Kubernetes pod',
    tools: 'Helm and kubectl, alongside a Jenkins inbound-agent container.',
    purpose: 'The release job needs the Kubernetes and Helm command-line tools to apply the checked-in release values. The worker performs those steps while Jenkins records the stages.',
    lifecycle: 'The Jenkinsfile defines the worker pod for the release operation.'
  },
  dashboard: {
    title: 'Dashboard validation and sync worker',
    image: 'provisioner-agent + alpine/k8s:1.30.14',
    environment: 'Pipeline-defined Kubernetes pod with multiple containers',
    tools: 'Python from the custom provisioner image and kubectl from the Kubernetes tools image.',
    purpose: 'The Python container validates dashboard data. The kubectl container updates the ConfigMaps that supply the dashboards to Grafana.',
    lifecycle: 'The pipeline defines separate Python and kubectl containers in one build pod, alongside the Jenkins inbound agent.'
  },
  zabbix: {
    title: 'Custom Python monitoring tools',
    image: 'zabbix-agent',
    environment: 'Kubernetes build container',
    tools: 'Python 3.14 with requests, pytz and the zabbix_utils API client.',
    purpose: 'This small custom image contains the Python libraries used to manage maintenance windows through the Zabbix API. It is a build tool image, not the monitoring agent installed on hosts.',
    lifecycle: 'The shared pipeline wrapper creates a Kubernetes pod with this tool image and a Jenkins agent container.'
  },
  linux: {
    title: 'Linux Jenkins worker',
    image: 'jenkins/inbound-agent',
    environment: 'Kubernetes pod from the Linux template',
    tools: 'Jenkins inbound-agent runtime. Job DSL is supplied by the controller plugin.',
    purpose: 'The seed pipeline uses the Linux worker for its checkout and invokes Job DSL to recreate the declared Jenkins jobs.',
    lifecycle: 'The checked-in Linux pod template selects a versioned upstream Jenkins inbound-agent image.'
  },
  windows: {
    title: 'Windows worker',
    image: 'Windows host, no container image',
    environment: 'Retained Windows Jenkins agent',
    tools: 'PowerShell and the Windows management tools required by the stage.',
    purpose: 'Directory and Windows-specific stages run on a Windows worker. Pipelines that also use Linux tools can switch workers between stages.',
    lifecycle: 'Jenkins assigns the stage to the Windows agent requested by the pipeline; Kubernetes does not create this Windows environment.'
  }
});
