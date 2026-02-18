// ABOUTME: Network/infrastructure shape definitions for draw.io style strings.
// ABOUTME: Covers generic networking: servers, routers, switches, firewalls, etc.

export const networkShapes: Record<string, string> = {
  "network.server":
    "shape=mxgraph.cisco.servers.standard_server;html=1;whiteSpace=wrap;",
  "network.router":
    "shape=mxgraph.cisco.routers.router;html=1;whiteSpace=wrap;",
  "network.switch":
    "shape=mxgraph.cisco.switches.workgroup_switch;html=1;whiteSpace=wrap;",
  "network.firewall":
    "shape=mxgraph.cisco.firewalls.firewall;html=1;whiteSpace=wrap;",
  "network.cloud":
    "ellipse;shape=cloud;whiteSpace=wrap;html=1;",
  "network.user":
    "shape=mxgraph.cisco.people.standing_man;html=1;whiteSpace=wrap;",
  "network.laptop":
    "shape=mxgraph.cisco.computers_and_peripherals.laptop;html=1;whiteSpace=wrap;",
  "network.desktop":
    "shape=mxgraph.cisco.computers_and_peripherals.pc;html=1;whiteSpace=wrap;",
  "network.database":
    "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;size=15;",
  "network.internet":
    "shape=mxgraph.cisco.misc.cloud;html=1;whiteSpace=wrap;",
  "network.load-balancer":
    "shape=mxgraph.cisco.misc.aCSicon;html=1;whiteSpace=wrap;",
  "network.wireless":
    "shape=mxgraph.cisco.wireless.wireless_bridge;html=1;whiteSpace=wrap;",
};
