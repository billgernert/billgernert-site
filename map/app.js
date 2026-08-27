(() => {
  "use strict";
  const svg = document.getElementById("map");
  const viewport = document.getElementById("viewport");
  const endpointMeta = document.querySelector('meta[name="topology-endpoint"]');
  const publicView = document.documentElement.dataset.topologyView === "public" ||
    new URLSearchParams(window.location.search).get("view") === "public";
  const topologyEndpoint = endpointMeta?.content ||
    (publicView ? "/api/v1/public-topology" : "/api/v1/topology");
  const snapshotCacheKey = publicView ? "automation-lab-public-topology-v1" : null;
  const state = { snapshot: null, byId: new Map(), focus: null, path: [], selected: null, scale: 1, x: 0, y: 0, dragging: false, routeLive: false };
  const NS = "http://www.w3.org/2000/svg";
  const ICONS = {
    lab: "brand", "automation-lab": "brand", network: "network", compute: "proxmox", kubernetes: "kubernetes",
    platform: "delivery", identity: "identity", security: "shield", certificates: "certificate",
    backup: "pbs", edge: "mail", "ai-operations": "ai", "kube-control": "kubernetes",
    "worker-a": "server", "worker-b": "server", jenkins: "jenkins", argocd: "argocd",
    prometheus: "prometheus", "jenkins-controller": "jenkins", "jenkins-queue": "queue",
    "jenkins-agents": "metrics", "gitea-trigger": "gitea", "vault-creds": "vault",
    registry: "registry", "queue-depth": "queue", "queue-oldest": "clock",
    "agent-capacity": "capacity", "queue-triggers": "gitea", "queue-credentials": "vault",
    "worker-capacity": "server", "active-directory": "directory", "ad-ldaps": "lock",
    "entra-id": "microsoft", "entra-inventory": "metrics", "entra-credentials": "certificate",
    "vault-service": "vault", "credential-lifecycle": "cycle", "rotation-overdue": "clock",
    "lifecycle-classification": "catalog", "rotation-automation": "automation"
  };
  const ICON_RULES = [
    [/^network\b/i, "network"],
    [/^infrastructure\b/i, "proxmox"],
    [/^mail\b/i, "mail"],
    [/^ai operations?\b/i, "ai"],
    [/\bdelivery pipelines?\b|\bsoftware delivery\b/i, "delivery"],
    [/\bidentity\s*(?:&|and)\s*pki\b/i, "identity"],
    [/proxmox backup server|\bpbs\b/i, "pbs"],
    [/\bproxmox\b/i, "proxmox"],
    [/\bkubernetes\b|\bk3s\b/i, "kubernetes"],
    [/\bjenkins\b|\bci controller\b/i, "jenkins"],
    [/\bwazuh\b|\bsiem\b/i, "wazuh"],
    [/\bnetbox\b|\bipam\b/i, "netbox"],
    [/\bgrafana\b|\bdashboard service\b/i, "grafana"],
    [/\bgitea\b/i, "gitea"],
    [/hashicorp vault|\bvault\b/i, "vault"],
    [/\bopnsense\b/i, "opnsense"],
    [/\bzabbix\b/i, "zabbix"],
    [/\bargo\s*cd\b|\bdeployment console\b/i, "argocd"],
    [/\bprometheus\b/i, "prometheus"],
    [/\bmicrosoft entra\b|\bentra id\b/i, "microsoft"],
    [/\bactive directory\b|\bwindows identity platform\b/i, "directory"],
    [/\bcloudflare\b/i, "cloudflare"],
    [/\bgithub\b/i, "github"],
    [/\bpostgres(?:ql)?\b/i, "postgresql"],
    [/let'?s encrypt|\bacme\b/i, "letsencrypt"],
    [/\bansible\b/i, "ansible"],
    [/\bterraform\b/i, "terraform"],
    [/^control plane\b/i, "kubernetes"],
    [/^worker(?:-|\s)|\bworker capacity\b/i, "server"],
    [/^controller\b/i, "jenkins"],
    [/\bbuild queue\b|\bwaiting builds\b/i, "queue"],
    [/\boldest wait\b|\boverdue rotations?\b/i, "clock"],
    [/\b(?:agent|k3s) capacity\b/i, "capacity"],
    [/\bci metrics\b|\bcredential inventory\b/i, "metrics"],
    [/\btrigger intake\b/i, "gitea"],
    [/\bcredential lookup\b/i, "vault"],
    [/\bcredential expiry\b/i, "certificate"],
    [/\bldaps\b/i, "lock"],
    [/\bclassification gaps?\b/i, "catalog"],
    [/\brotation automation\b/i, "automation"]
  ];

  if (publicView) {
    if (!endpointMeta) document.title = "AutomationLab platform map";
    const eyebrow = document.getElementById("map-eyebrow"); if (eyebrow) eyebrow.textContent = "PUBLIC LIVE TOPOLOGY";
    const heading = document.getElementById("map-heading"); if (heading) heading.textContent = "AutomationLab platform map";
    const source = document.getElementById("legend-source"); if (source) source.textContent = "Live telemetry · sanitized public projection";
    const detailAction = document.querySelector(".detail-action"); if (detailAction) detailAction.hidden = true;
  }
  Array.from(document.querySelectorAll("[data-interaction-cue]")).forEach(cue => {
    if (window.matchMedia?.("(pointer: coarse)").matches) cue.textContent = cue.dataset.touchText;
  });

  function iconForNode(node) {
    if (ICONS[node.id]) return ICONS[node.id];
    const name = String(node.name || "");
    const kind = String(node.details?.kind || "").toLowerCase();
    const identity = `${name} ${kind}`;
    const vendor = ICON_RULES.find(([pattern]) => pattern.test(identity));
    if (vendor) return vendor[1];
    if (/\bidentity\b|\bpki\b/i.test(identity)) return "identity";
    if (/\bcertificates?\b/i.test(identity)) return "certificate";
    if (/\bbackups?\b|\brestore\b/i.test(identity)) return "backup";
    if (/\bsecurity\b|\bcredentials?\b/i.test(identity)) return "shield";
    if (kind === "lab" || kind.includes("automationlab")) return "brand";
    if (kind.includes("namespace")) return "folder";
    if (kind.includes("deployment") || kind.includes("statefulset") || kind.includes("daemonset") || kind.includes("controller")) return "workload";
    if (kind.includes("replicaset")) return "layers";
    if (kind === "pod" || kind.includes("pods")) return "pod";
    if (kind.includes("container")) return "container";
    if (kind.includes("service")) return "network";
    if (kind.includes("ingress")) return "route";
    if (kind.includes("volume") || kind.includes("storage")) return "storage";
    if (kind.includes("firewall")) return "shield";
    if (kind.includes("dns") || kind.includes("segment") || kind.includes("network")) return "network";
    if (kind.includes("ipam") || kind.includes("source of truth")) return "netbox";
    if (kind.includes("source control")) return "gitea";
    if (kind.includes("deployment console")) return "argocd";
    if (kind.includes("jenkins")) return "jenkins";
    if (kind.includes("pipeline")) return "delivery";
    if (kind.includes("entra application credential")) return "certificate";
    if (kind.includes("entra application")) return "microsoft";
    if (kind.includes("domain controller") || kind.includes("directory")) return "directory";
    if (kind.includes("vault")) return "vault";
    if (kind.includes("siem")) return "wazuh";
    if (kind.includes("certificate")) return "certificate";
    if (kind.includes("backup") || kind.includes("datastore")) return "backup";
    if (kind.includes("mail") || kind.includes("messaging") || kind.includes("notification")) return "mail";
    if (kind.includes("ai ") || kind.includes("ai-") || kind.includes("litellm")) return "ai";
    if (kind.includes("budget")) return "capacity";
    if (kind.includes("template")) return "layers";
    if (kind.includes("virtual machine") || kind.includes("hypervisor") || kind.includes("guest")) return "server";
    if (kind.includes("node")) return "server";
    if (kind.includes("job")) return "job";
    return "generic";
  }

  function element(name, attributes = {}) {
    const node = document.createElementNS(NS, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }
  function nodeById(id) { return state.byId.get(id); }
  function setTransform() { viewport.setAttribute("transform", `translate(${state.x} ${state.y}) scale(${state.scale})`); }
  function resetView() {
    const box = svg.getBoundingClientRect(); state.scale = 1; state.x = box.width / 2; state.y = (box.height - 70) / 2; setTransform();
  }
  function serviceIcon(node, size) {
    const icon = iconForNode(node);
    const group = element("g", {class: `service-icon icon-${icon}`, transform: `scale(${size / 24})`});
    const add = (name, attrs) => { const child = element(name, attrs); group.appendChild(child); return child; };
    const path = (d, attrs = {}) => add("path", {d, ...attrs});
    const disc = (fill, stroke = fill) => add("circle", {class: "brand-disc", r: 10.5, fill, stroke});
    const logoStroke = (d, color = "#fff", width = 1.7) => path(d, {class: "logo-stroke", fill: "none", stroke: color, "stroke-width": width});
    const brandText = (value, attrs = {}) => {
      const text = add("text", {class: "brand-letter", y: 4.5, fill: "#fff", "text-anchor": "middle", ...attrs});
      text.textContent = value; return text;
    };
    if (icon === "brand") {
      add("polygon", {class: "brand-outline", points: "0,-11 9.5,-5.5 9.5,5.5 0,11 -9.5,5.5 -9.5,-5.5"});
      add("polygon", {class: "brand-inner", points: "0,-7 6,-3.5 6,3.5 0,7 -6,3.5 -6,-3.5"});
      [[0,-7],[6,-3.5],[6,3.5],[0,7],[-6,3.5],[-6,-3.5]].forEach(([x,y], index) => {
        add("line", {class: index % 2 ? "brand-green" : "brand-cyan", x1: 0, y1: 0, x2: x, y2: y});
        add("circle", {class: index % 2 ? "brand-green-node" : "brand-cyan-node", cx: x, cy: y, r: 1.1});
      });
      add("circle", {class: "brand-core", r: 2.1});
    } else if (icon === "kubernetes") {
      add("polygon", {points: "0,-11 9.5,-5.5 9.5,5.5 0,11 -9.5,5.5 -9.5,-5.5", fill: "#326ce5", stroke: "#9fc0ff"});
      add("circle", {r: 6.6, fill: "none", stroke: "#fff", "stroke-width": 1.55});
      add("circle", {r: 1.7, fill: "#fff", stroke: "none"});
      for (let angle = 0; angle < 360; angle += 60) add("line", {x1: 0, y1: -2.2, x2: 0, y2: -6.8, stroke: "#fff", "stroke-width": 1.35, transform: `rotate(${angle})`});
    } else if (icon === "jenkins") {
      disc("#f4e6d2", "#d24939");
      add("circle", {cx: 0, cy: -1.5, r: 5.4, fill: "#d9b894", stroke: "#70483a"});
      brandText("J", {y: 2.5, fill: "#3a2924", "font-size": 11});
      add("polygon", {points: "-1,6 -7,3 -7,9 -1,7.3", fill: "#d24939", stroke: "none"});
      add("polygon", {points: "1,6 7,3 7,9 1,7.3", fill: "#d24939", stroke: "none"});
      add("circle", {cy: 6.6, r: 1.7, fill: "#7c2f28", stroke: "none"});
    } else if (icon === "prometheus") {
      disc("#e6522c", "#ff9b79");
      path("M0,-8 C4,-4 5,-1 3,2 C2,0 1,-1 1,-2 C1,2 -1,4 -4,2 C-6,0 -4,-4 0,-8 Z", {fill: "#fff", stroke: "none"});
      logoStroke("M-6,5 H6 M-4,8 H4", "#fff", 1.5);
    } else if (icon === "argocd") {
      disc("#ef7b4d", "#ffc0a7");
      path("M0,-7 L4,0 L0,7 L-4,0 Z", {fill: "#fff", stroke: "none"});
      add("circle", {cx: -1.2, cy: -1, r: .8, fill: "#1f5061", stroke: "none"});
      add("circle", {cx: 1.2, cy: -1, r: .8, fill: "#1f5061", stroke: "none"});
      logoStroke("M-2,2 Q0,4 2,2", "#1f5061", 1);
    } else if (icon === "gitea") {
      disc("#609926", "#a6d47a");
      logoStroke("M-6,-7 V3 C-6,7 -1,8 2,5 L6,1 M-6,-1 L0,-2", "#fff", 1.8);
      [[-6,-7],[6,1],[0,-2]].forEach(([cx, cy]) => add("circle", {cx, cy, r: 2, fill: "#dff2ca", stroke: "#fff"}));
    } else if (icon === "vault") {
      disc("#ffd814", "#fff0a0");
      add("polygon", {points: "0,-8 8,-3 5,7 -5,7 -8,-3", fill: "#1f242a", stroke: "none"});
      logoStroke("M-4,-3 L0,4 L4,-3", "#fff", 1.7);
    } else if (icon === "proxmox") {
      disc("#2b211b", "#e57000");
      path("M-10,-7 L-6,-10 L0,-3 L6,-10 L10,-7 L3,0 L10,7 L6,10 L0,3 L-6,10 L-10,7 L-3,0 Z", {fill: "#e57000", stroke: "none"});
      add("circle", {r: 2.3, fill: "#fff", stroke: "none"});
    } else if (icon === "pbs") {
      disc("#241f1a", "#e57000");
      path("M-9,-7 L-6,-9 L-1,-4 L4,-9 L7,-7 L1,-1 L-5,-1 Z", {fill: "#e57000", stroke: "none"});
      add("ellipse", {cx: 3, cy: 2, rx: 6, ry: 2.2, fill: "#33c3b8", stroke: "#bdfaf5"});
      path("M-3,2 V7 C-3,10 9,10 9,7 V2 M-3,5 C-3,8 9,8 9,5", {fill: "#126b67", stroke: "#bdfaf5", "stroke-width": 1.15});
    } else if (icon === "wazuh") {
      disc("#1686f0", "#8dc7ff");
      add("path", {d: "M-8,-5 L-4,7 L0,1 L4,7 L8,-5 L4,-7 L0,-1 L-4,-7 Z", fill: "#fff", stroke: "none"});
      add("path", {d: "M-4,-7 L0,5 L4,-7 L0,-2 Z", fill: "#82d7ff", stroke: "none"});
    } else if (icon === "netbox") {
      disc("#00a6a6", "#81eeee");
      [[-4,-5],[4,-1],[-4,4]].forEach(([x, y], index) => {
        const fill = ["#fff", "#b8ffff", "#63e1df"][index];
        add("rect", {x: x - 3.5, y: y - 3, width: 7, height: 6, rx: 1, fill, stroke: "#075f62", "stroke-width": .7});
      });
      logoStroke("M-1,-5 H1 M0,-4 V-1 M0,2 V4", "#fff", 1);
    } else if (icon === "grafana") {
      disc("#f46800", "#ffb15f");
      logoStroke("M-7,4 C-8,-3 -2,-8 4,-6 C9,-4 9,3 5,6 C2,8 -2,7 -3,4 C-4,1 -1,-2 2,-1 C5,0 5,4 2,5", "#fff", 1.8);
      add("circle", {cx: 2, cy: 5, r: 1.3, fill: "#ffd166", stroke: "none"});
    } else if (icon === "opnsense") {
      disc("#e44a20", "#ff9c7d");
      path("M-8,-8 H2 L8,-2 V2 H3 V-3 H-3 V3 H3 V8 H-2 L-8,2 Z", {fill: "#fff", stroke: "none"});
    } else if (icon === "zabbix") {
      add("rect", {x: -10, y: -8, width: 20, height: 16, rx: 4, fill: "#d40000", stroke: "#ff8a8a"});
      brandText("Z", {y: 5.2, "font-size": 15, "font-weight": 900});
    } else if (icon === "delivery") {
      logoStroke("M-7,-6 C-1,-6 -1,0 5,0 M5,0 C-1,0 -1,7 -7,7", "#dbe7f5", 1.5);
      [[-8,-6,"#609926"],[7,0,"#d24939"],[-8,7,"#ef7b4d"]].forEach(([cx, cy, fill]) => add("circle", {cx, cy, r: 3, fill, stroke: "#fff", "stroke-width": .8}));
    } else if (icon === "identity") {
      [[-8,-8,"#f25022"],[-3,-8,"#7fba00"],[-8,-3,"#00a4ef"],[-3,-3,"#ffb900"]].forEach(([x, y, fill]) => add("rect", {x, y, width: 4, height: 4, fill, stroke: "none"}));
      add("circle", {cx: 3, cy: 2, r: 4.2, fill: "none", stroke: "#ffd45a", "stroke-width": 2});
      logoStroke("M6,5 L10,9 M8,7 L10,5", "#ffd45a", 2);
    } else if (icon === "cloudflare") {
      disc("#f38020", "#ffc078");
      path("M-9,4 C-9,0 -6,-2 -3,-1 C-2,-5 2,-7 6,-5 C8,-4 9,-2 9,1 C11,1 12,3 11,5 H-9 Z", {fill: "#fff", stroke: "none"});
      path("M-9,5 H11", {stroke: "#ffd04a", "stroke-width": 2});
    } else if (icon === "github") {
      disc("#53366f", "#a98bc4");
      add("circle", {r: 6.4, fill: "#fff", stroke: "none"});
      path("M-5,-4 L-3,-8 L0,-6 L3,-8 L5,-4 V2 C5,6 2,8 0,8 C-2,8 -5,6 -5,2 Z", {fill: "#181717", stroke: "none"});
    } else if (icon === "postgresql") {
      disc("#4169e1", "#91a9ff");
      logoStroke("M-6,-3 C-5,-8 5,-8 7,-2 C8,2 5,7 1,6 C-1,6 -1,2 1,1 C3,0 5,2 3,4 M-4,-2 V5", "#fff", 1.6);
    } else if (icon === "letsencrypt") {
      disc("#003a70", "#6fbaff");
      add("rect", {x: -5, y: -1, width: 10, height: 8, rx: 1.5, fill: "#fff", stroke: "none"});
      logoStroke("M-3,-1 V-4 A3,3 0 0 1 3,-4 V-1", "#fff", 1.6);
      [[0,-10],[7,-7],[-7,-7]].forEach(([x, y]) => add("line", {x1: x*.65, y1: y*.65, x2: x, y2: y, stroke: "#f9c74f", "stroke-width": 1.8}));
      add("circle", {cy: 3, r: 1.3, fill: "#003a70", stroke: "none"});
    } else if (icon === "ansible") {
      disc("#ee0000", "#ff8b8b");
      logoStroke("M-6,7 L0,-8 L7,7 L0,1 L-3,7", "#fff", 2);
    } else if (icon === "terraform") {
      disc("#844fba", "#c29ce8");
      [[-7,-7],[0,-3],[-7,1],[0,5]].forEach(([x, y], index) => add("polygon", {points: `${x},${y} ${x+5},${y+3} ${x+5},${y+9} ${x},${y+6}`, fill: index === 3 ? "#d9c2ef" : "#fff", stroke: "none"}));
    } else if (icon === "network") {
      [[0,-8,"#00d4ff"],[-8,6,"#00ff96"],[8,6,"#70a7ff"]].forEach(([cx, cy, fill]) => add("circle", {cx, cy, r: 2.8, fill, stroke: "#dffcff", "stroke-width": .7}));
      logoStroke("M0,-5 L-7,3 M0,-5 L7,3 M-5,6 H5", "#8fe9ff", 1.5);
    } else if (icon === "server") {
      add("rect", {x: -9, y: -9, width: 18, height: 7, rx: 1, fill: "#19324a", stroke: "#70a7ff"});
      add("rect", {x: -9, y: 2, width: 18, height: 7, rx: 1, fill: "#19324a", stroke: "#70a7ff"});
      add("circle", {cx: -6, cy: -5.5, r: 1.2, fill: "#00ff96", stroke: "none"});
      add("circle", {cx: -6, cy: 5.5, r: 1.2, fill: "#00d4ff", stroke: "none"});
    } else if (icon === "pipeline") {
      add("circle", {cx: -8, cy: -6, r: 2}); add("circle", {cx: 8, cy: 0, r: 2}); add("circle", {cx: -8, cy: 7, r: 2}); path("M-6,-6 H-2 C3,-6 3,0 6,0 M6,0 C3,0 3,7 -6,7");
    } else if (icon === "key") {
      add("circle", {cx: -4, cy: -3, r: 5, fill: "#3d3218", stroke: "#ffd45a"}); logoStroke("M0,1 L8,9 M4,5 L7,2 M6,7 L9,4", "#ffd45a", 2);
    } else if (icon === "shield") {
      path("M0,-10 L9,-6 V0 C9,6 5,9 0,11 C-5,9 -9,6 -9,0 V-6 Z", {fill: "#12384a", stroke: "#45d483"}); logoStroke("M-4,0 L-1,3 L5,-4", "#a5ffd0", 2);
    } else if (icon === "certificate") {
      add("rect", {x: -8, y: -10, width: 16, height: 17, rx: 1.5, fill: "#f4e6b0", stroke: "#ffd166"});
      logoStroke("M-4,-5 H4 M-4,-1 H3", "#7f6326", 1.3);
      add("circle", {cx: 4, cy: 6, r: 3.2, fill: "#00a6a6", stroke: "#9afff6"});
      path("M2,8 L1,11 M6,8 L7,11", {stroke: "#00a6a6", "stroke-width": 1.6});
    } else if (icon === "backup") {
      add("ellipse", {cx: 0, cy: -7, rx: 8, ry: 3, fill: "#33c3b8", stroke: "#bdfaf5"});
      path("M-8,-7 V5 C-8,9 8,9 8,5 V-7 M-8,-1 C-8,3 8,3 8,-1", {fill: "#126b67", stroke: "#bdfaf5"});
      logoStroke("M-3,6 L0,9 L4,5", "#fff", 1.7);
    } else if (icon === "mail") {
      add("rect", {x: -10, y: -7, width: 20, height: 14, rx: 2, fill: "#6246a8", stroke: "#c7b5ff"}); logoStroke("M-9,-5 L0,2 L9,-5", "#fff", 1.5);
    } else if (icon === "ai") {
      path("M0,-11 L2,-3 L9,0 L2,3 L0,11 L-2,3 L-9,0 L-2,-3 Z", {fill: "#8b5cf6", stroke: "#d8c6ff"}); add("circle", {r: 2.2, fill: "#00ff96", stroke: "none"});
    } else if (icon === "queue") {
      add("rect", {x: -9, y: -9, width: 18, height: 5, rx: 1}); add("rect", {x: -9, y: -2, width: 18, height: 5, rx: 1}); add("rect", {x: -9, y: 5, width: 18, height: 5, rx: 1});
    } else if (icon === "clock") {
      add("circle", {r: 9}); path("M0,-5 V0 L5,3");
    } else if (icon === "metrics") {
      path("M-9,8 V2 H-4 V8 M-2,8 V-5 H3 V8 M5,8 V-1 H10 V8 M-10,9 H10");
    } else if (icon === "registry") {
      add("rect", {x: -9, y: -8, width: 18, height: 16, rx: 2}); path("M-9,-2 H9 M-3,-8 V8");
    } else if (icon === "capacity") {
      path("M-10,7 A10,10 0 0 1 10,7"); path("M0,4 L6,-3"); add("circle", {cy: 4, r: 2});
    } else if (icon === "directory") {
      add("circle", {cy: -6, r: 3.3, fill: "#00a4ef", stroke: "#fff"});
      add("circle", {cx: -7, cy: 5, r: 2.8, fill: "#7fba00", stroke: "#fff"});
      add("circle", {cx: 7, cy: 5, r: 2.8, fill: "#f25022", stroke: "#fff"});
      logoStroke("M0,-2.5 V1 M-7,2 H7 M-7,2 V2.5 M7,2 V2.5", "#cbe8ff", 1.5);
    } else if (icon === "lock") {
      add("rect", {x: -8, y: -2, width: 16, height: 12, rx: 2}); path("M-5,-2 V-5 A5,5 0 0 1 5,-5 V-2"); add("circle", {cy: 3, r: 1.5}); path("M0,4 V7");
    } else if (icon === "microsoft") {
      [[-9,-9,"#f25022"],[1,-9,"#7fba00"],[-9,1,"#00a4ef"],[1,1,"#ffb900"]].forEach(([x, y, fill]) => add("rect", {x, y, width: 8, height: 8, fill, stroke: "none"}));
    } else if (icon === "cycle") {
      path("M-8,-1 A8,8 0 0 1 6,-6 L8,-9 M6,-6 L3,-8 M8,1 A8,8 0 0 1 -6,6 L-8,9 M-6,6 L-3,8");
    } else if (icon === "catalog") {
      path("M-9,-8 H4 L9,-3 V8 H-9 Z M4,-8 V-3 H9"); add("circle", {cx: -4, cy: -2, r: 1.5}); path("M0,-2 H5 M-5,3 H5");
    } else if (icon === "automation") {
      add("circle", {r: 7}); add("circle", {r: 2});
      for (let angle = 0; angle < 360; angle += 60) add("line", {x1: 0, y1: -7, x2: 0, y2: -11, transform: `rotate(${angle})`});
    } else if (icon === "folder") {
      path("M-10,-6 H-2 L1,-3 H10 V8 H-10 Z"); path("M-10,-3 H10");
    } else if (icon === "workload") {
      add("rect", {x: -9, y: -9, width: 7, height: 7, rx: 1}); add("rect", {x: 2, y: -9, width: 7, height: 7, rx: 1}); add("rect", {x: -3.5, y: 2, width: 7, height: 7, rx: 1}); path("M-5,-2 V0 H5 V-2 M0,0 V2");
    } else if (icon === "layers") {
      path("M0,-10 L10,-5 L0,0 L-10,-5 Z M-10,0 L0,5 L10,0 M-10,5 L0,10 L10,5");
    } else if (icon === "pod") {
      add("rect", {x: -9, y: -9, width: 18, height: 18, rx: 3}); add("circle", {cx: -4, cy: -3, r: 2}); add("circle", {cx: 4, cy: -3, r: 2}); path("M-5,4 H5");
    } else if (icon === "container") {
      add("rect", {x: -10, y: -8, width: 20, height: 16, rx: 1}); path("M-5,-8 V8 M0,-8 V8 M5,-8 V8 M-10,-2 H10 M-10,3 H10");
    } else if (icon === "route") {
      add("circle", {cx: -8, cy: 7, r: 2}); add("circle", {cx: 8, cy: -7, r: 2}); path("M-6,7 H-2 C5,7 -5,-7 6,-7");
    } else if (icon === "storage") {
      add("ellipse", {cy: -7, rx: 9, ry: 3}); path("M-9,-7 V6 C-9,10 9,10 9,6 V-7 M-9,-1 C-9,3 9,3 9,-1");
    } else if (icon === "job") {
      add("rect", {x: -8, y: -10, width: 16, height: 20, rx: 2}); path("M-4,-5 H4 M-4,0 H4 M-4,5 H1");
    } else {
      add("polygon", {points: "0,-10 9,-5 9,5 0,10 -9,5 -9,-5"}); path("M-9,-5 L0,0 L9,-5 M0,0 V10");
    }
    return group;
  }
  function statusBadge(status, radius) {
    const group = element("g", {class: `status-badge ${status}`, transform: `translate(${radius * .72} ${-radius * .72})`});
    group.appendChild(element("circle", {r: 6}));
    const glyph = element("text", {class: "status-glyph", y: 3}); glyph.textContent = ({healthy: "✓", warning: "!", critical: "×", unknown: "?"})[status] || "?"; group.appendChild(glyph);
    return group;
  }
  function relationIds(focus) {
    const childSet = new Set(focus.children || []);
    return [...new Set([...(focus.dependencies || []), ...(focus.affected || [])])].filter(id => !childSet.has(id) && id !== focus.id);
  }
  function polar(index, count, radius, offset = -Math.PI / 2) {
    const angle = offset + index * Math.PI * 2 / Math.max(count, 1);
    return {x: Math.cos(angle) * radius, y: Math.sin(angle) * radius};
  }
  function childLayout(count, span) {
    if (count <= 10) {
      const radius = Math.max(125, span * .27);
      return {points: Array.from({length: count}, (_item, index) => polar(index, count, radius)), rings: [radius], maxRadius: radius};
    }
    const outerCount = Math.ceil(count / 2); const innerCount = count - outerCount;
    const innerRadius = Math.max(115, span * .20); const outerRadius = Math.max(innerRadius + 76, span * .36);
    const points = [
      ...Array.from({length: outerCount}, (_item, index) => polar(index, outerCount, outerRadius)),
      ...Array.from({length: innerCount}, (_item, index) => polar(index, innerCount, innerRadius, -Math.PI / 2 + Math.PI / Math.max(innerCount, 1)))
    ];
    return {points, rings: [innerRadius, outerRadius], maxRadius: outerRadius};
  }
  function shortLabel(value, length) {
    return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
  }
  function addEdge(from, to, kind = "child") {
    const path = element("path", {class: `edge ${kind}`, d: `M ${from.x} ${from.y} C ${from.x * .45} ${from.y * .45}, ${to.x * .72} ${to.y * .72}, ${to.x} ${to.y}`});
    viewport.appendChild(path);
  }
  function addNode(node, point, role) {
    const icon = iconForNode(node);
    const group = element("g", {class: `node ${node.state} ${role}`, transform: `translate(${point.x} ${point.y})`, role: "button", tabindex: "0", "data-icon": icon, "aria-label": `${node.name}, ${node.state}, ${node.metric}`});
    const title = element("title"); title.textContent = `${node.name} · ${node.metric}`; group.appendChild(title);
    const radius = role === "center" ? 31 : 22;
    group.appendChild(element("circle", {class: "halo", r: radius + 10}));
    group.appendChild(element("circle", {class: "status-ring", r: radius}));
    group.appendChild(element("circle", {class: "icon-plate", r: radius - 4}));
    group.appendChild(serviceIcon(node, role === "center" ? 42 : 27));
    group.appendChild(statusBadge(node.state, radius));
    const label = element("text", {y: role === "center" ? 43 : 32}); label.textContent = shortLabel(node.name, role === "center" ? 30 : 22); group.appendChild(label);
    const metric = element("text", {class: "metric", y: role === "center" ? 59 : 47}); metric.textContent = shortLabel(node.metric || "no signal", role === "center" ? 34 : 28); group.appendChild(metric);
    // Keep the SVG pan handler from capturing a node press before the browser
    // can dispatch its click. This is especially important for physical mouse
    // and touch input, where pointer capture can retarget pointerup to the SVG.
    group.addEventListener("pointerdown", event => event.stopPropagation());
    group.addEventListener("click", event => { event.stopPropagation(); selectNode(node); });
    group.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(node); } });
    viewport.appendChild(group);
  }
  function selectNode(node) {
    state.selected = node.id; updateDetail(node);
    if ((node.children || []).length) {
      if (state.path[state.path.length - 1] !== node.id) state.path.push(node.id);
      state.focus = node.id; render();
    }
  }
  function updateDetail(node) {
    const details = node.details || {};
    const setDetail = (id, value) => { const target = document.getElementById(id); target.textContent = value; target.title = value; };
    const setSegmentedDetail = (id, value) => {
      const target = document.getElementById(id); const text = String(value); target.replaceChildren(); target.title = text;
      text.split(" · ").forEach(segment => { const line = document.createElement("span"); line.className = "detail-value-line"; line.textContent = segment; target.appendChild(line); });
    };
    setDetail("detail-name", node.name);
    setDetail("detail-kind", `${details.kind || "System"}${details.image ? ` · ${details.image}` : ""}`);
    document.getElementById("detail-state").textContent = node.state.toUpperCase();
    document.getElementById("detail-state").className = node.state;
    setDetail("detail-scale", details.scale || node.metric || "Not reported");
    setDetail("detail-runtime", details.runtime || `${node.metric || "No signal"} · ${node.source || "unknown source"}`);
    setSegmentedDetail("detail-resources", details.resources || "Open Grafana for metrics");
    setDetail("detail-network", details.network || details.meaning || "No network detail");
    const admin = document.getElementById("detail-admin"); const noAdmin = document.getElementById("detail-no-admin");
    let adminUrl = null;
    try { const candidate = new URL(node.admin_url); if (candidate.protocol === "https:" && candidate.hostname.endsWith(".parsec-lab.com")) adminUrl = candidate.href; } catch (_reason) { adminUrl = null; }
    admin.hidden = !adminUrl; noAdmin.hidden = Boolean(adminUrl); if (adminUrl) admin.href = adminUrl;
    const panel = document.getElementById("alerts-panel"); const list = document.getElementById("alerts-list"); const toggle = document.getElementById("alerts-toggle");
    if (!panel || !list || !toggle) return;
    list.replaceChildren();
    const alerts = node.alerts || []; panel.hidden = alerts.length === 0;
    document.getElementById("alerts-heading").textContent = `Alerts · ${alerts.length}`;
    let expanded = false;
    function renderAlerts() {
      list.replaceChildren(); const shown = expanded ? alerts : alerts.slice(0, 8);
      shown.forEach(alert => {
        const item = document.createElement("li"); const summary = document.createElement("strong"); summary.textContent = alert.summary || "Alert"; item.appendChild(summary);
        const details = Object.values(alert.details || {}).filter(Boolean); if (details.length) { const detail = document.createElement("span"); detail.className = "alert-detail"; detail.textContent = details.join(" · "); item.appendChild(detail); }
        list.appendChild(item);
      });
      toggle.hidden = alerts.length <= 8; toggle.textContent = expanded ? "Show fewer" : `Show all ${alerts.length}`;
    }
    toggle.onclick = () => { expanded = !expanded; renderAlerts(); }; renderAlerts();
  }
  function renderBreadcrumbs() {
    const host = document.getElementById("breadcrumbs"); if (!host) return; host.replaceChildren();
    state.path.forEach((id, index) => {
      if (index) { const separator = document.createElement("span"); separator.textContent = "›"; host.appendChild(separator); }
      const node = nodeById(id); const button = document.createElement("button"); button.type = "button"; button.textContent = index === 0 ? "AutomationLab platform map" : node.name;
      if (index === state.path.length - 1) button.className = "current";
      button.addEventListener("click", () => { state.path = state.path.slice(0, index + 1); state.focus = id; state.selected = id; render(); }); host.appendChild(button);
    });
  }
  function render() {
    viewport.replaceChildren(); renderBreadcrumbs();
    const focus = nodeById(state.focus); if (!focus) return;
    const box = svg.getBoundingClientRect(); const span = Math.min(box.width, box.height);
    const children = (focus.children || []).map(nodeById).filter(Boolean);
    const relations = relationIds(focus).map(nodeById).filter(Boolean);
    const layout = childLayout(children.length, span); layout.rings.forEach(radius => viewport.appendChild(element("circle", {class: "orbit", r: radius})));
    const relationRadius = Math.max(layout.maxRadius + 62, span * .43);
    const childPoints = new Map(); children.forEach((node, i) => childPoints.set(node.id, layout.points[i]));
    const relationPoints = new Map(); relations.forEach((node, i) => relationPoints.set(node.id, polar(i, relations.length, relationRadius, -Math.PI / 2 + .35)));
    children.forEach(node => addEdge({x: 0, y: 0}, childPoints.get(node.id)));
    relations.forEach(node => addEdge({x: 0, y: 0}, relationPoints.get(node.id), (focus.affected || []).includes(node.id) ? "affected" : "dependency"));
    children.forEach(node => addNode(node, childPoints.get(node.id), "child"));
    relations.forEach(node => addNode(node, relationPoints.get(node.id), "relation"));
    addNode(focus, {x: 0, y: 0}, "center");
    updateDetail(nodeById(state.selected) || focus); resetView();
  }
  async function load() {
    const error = document.getElementById("error");
    try {
      const response = await fetch(topologyEndpoint, {cache: "no-store"}); if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const snapshot = await response.json();
      if (snapshot.schema_version !== 1 || !Array.isArray(snapshot.nodes) || !snapshot.nodes.length ||
          !snapshot.nodes.some(node => node.id === snapshot.root)) throw new Error("invalid topology schema");
      state.snapshot = snapshot; state.byId = new Map(snapshot.nodes.map(node => [node.id, node]));
      if (snapshotCacheKey) {
        try { window.localStorage.setItem(snapshotCacheKey, JSON.stringify(snapshot)); } catch (_reason) { /* cache is best effort */ }
      }
      if (!state.focus || !state.byId.has(state.focus)) { state.focus = snapshot.root; state.path = [snapshot.root]; state.selected = snapshot.root; }
      state.routeLive = true; updateMapBadge();
      const updated = document.getElementById("updated"); if (updated) updated.textContent = `Updated ${new Date(snapshot.generated_at).toLocaleTimeString()}`;
      if (error) error.hidden = true; render();
    } catch (reason) {
      let restored = false;
      if (snapshotCacheKey && !state.snapshot) {
        try {
          const snapshot = JSON.parse(window.localStorage.getItem(snapshotCacheKey));
          if (snapshot?.schema_version === 1 && Array.isArray(snapshot.nodes) && snapshot.nodes.length &&
              snapshot.nodes.some(node => node.id === snapshot.root)) {
            state.snapshot = snapshot; state.byId = new Map(snapshot.nodes.map(node => [node.id, node]));
            state.focus = snapshot.root; state.path = [snapshot.root]; state.selected = snapshot.root; render(); restored = true;
          }
        } catch (_reason) { /* malformed browser cache is ignored */ }
      }
      const hasLastKnown = Boolean(state.snapshot);
      const cachedAt = hasLastKnown ? ` Last known state is from ${new Date(state.snapshot.generated_at).toLocaleString()}.` : "";
      state.routeLive = false;
      if (error) { error.textContent = `Live map unavailable: ${reason.message}.${cachedAt || " No last known state is available."}`; error.hidden = false; }
      const updated = document.getElementById("updated"); if (hasLastKnown && updated) updated.textContent = `Last known ${new Date(state.snapshot.generated_at).toLocaleString()}`;
      updateMapBadge(restored);
    }
  }
  function updateMapBadge(restored = false) {
    const badge = document.getElementById("mode-badge"); if (!badge) return;
    if (publicView && state.routeLive && state.snapshot) {
      const age = Math.max(0, Math.floor((Date.now() - new Date(state.snapshot.generated_at).getTime()) / 1000));
      badge.textContent = state.snapshot.degraded ? `Live and interactive, degraded, updated ${age}s ago` : `Live and interactive, updated ${age}s ago`;
    } else if (publicView) {
      badge.textContent = restored || state.snapshot ? "Offline · last known" : "Offline";
    } else {
      badge.textContent = state.snapshot?.mode === "demo" ? "DEMO DATA" : state.snapshot?.degraded ? "LIVE · DEGRADED" : "LIVE";
    }
  }
  svg.addEventListener("pointerdown", event => { state.dragging = true; state.dragStart = {x: event.clientX - state.x, y: event.clientY - state.y}; svg.setPointerCapture(event.pointerId); svg.classList.add("dragging"); });
  svg.addEventListener("pointermove", event => { if (!state.dragging) return; state.x = event.clientX - state.dragStart.x; state.y = event.clientY - state.dragStart.y; setTransform(); });
  svg.addEventListener("pointerup", () => { state.dragging = false; svg.classList.remove("dragging"); });
  svg.addEventListener("wheel", event => { event.preventDefault(); state.scale = Math.min(2.4, Math.max(.55, state.scale * (event.deltaY < 0 ? 1.12 : .89))); setTransform(); }, {passive: false});
  document.getElementById("zoom-in").addEventListener("click", () => { state.scale = Math.min(2.4, state.scale * 1.2); setTransform(); });
  document.getElementById("zoom-out").addEventListener("click", () => { state.scale = Math.max(.55, state.scale / 1.2); setTransform(); });
  document.getElementById("reset-view").addEventListener("click", resetView);
  const refresh = document.getElementById("refresh"); if (refresh) refresh.addEventListener("click", load);
  window.addEventListener("resize", render); load(); window.setInterval(load, 15000); window.setInterval(updateMapBadge, 1000);
})();
