---
name: drawio-uml
description: >
  Generate UML diagrams: class diagrams, component diagrams, use case diagrams,
  and state machines as .drawio.svg files.
  Use when the user asks for a UML diagram, class hierarchy, component diagram,
  state machine, use case diagram, or any object-oriented design visualization.
---

# UML Diagram Generation

Generate UML diagrams using the `drawio-claude` CLI tool. Describe the diagram as JSON, and the tool handles layout and rendering.

## Quick Start

```bash
echo '<JSON>' | drawio-claude generate -o diagram.drawio.svg
```

## UML Shapes

| Type | Shape | Use For |
|------|-------|---------|
| `uml.class` | Class box (swimlane) | Classes with attributes/methods |
| `uml.interface` | Interface box | Interface definitions |
| `uml.actor` | Stick figure | Actors in use case diagrams |
| `uml.usecase` | Ellipse | Use cases |
| `uml.component` | Component box | Components/modules |
| `uml.package` | Folder tab | Packages/namespaces |
| `uml.node` | 3D box | Deployment nodes |
| `uml.object` | Plain rectangle | Object instances |
| `uml.state` | Rounded rectangle | States in state machines |
| `uml.initial-state` | Filled circle | Initial state |
| `uml.final-state` | Bullseye circle | Final state |
| `uml.activity` | Rounded rectangle | Activities |
| `uml.decision` | Diamond | Decision/merge points |
| `uml.note` | Folded corner note | Annotations |

## Example: Class Diagram

```json
{
  "title": "User Management Classes",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "TB" },
  "nodes": [
    { "id": "user", "label": "User\n─────────\n- id: string\n- email: string\n- role: Role\n─────────\n+ login()\n+ logout()", "type": "uml.class" },
    { "id": "admin", "label": "Admin\n─────────\n- permissions: string[]\n─────────\n+ grant()\n+ revoke()", "type": "uml.class" },
    { "id": "auth", "label": "«interface»\nAuthenticatable\n─────────\n+ authenticate()\n+ getToken()", "type": "uml.interface" },
    { "id": "session", "label": "Session\n─────────\n- token: string\n- expiresAt: Date", "type": "uml.class" }
  ],
  "edges": [
    { "from": "admin", "to": "user", "label": "extends" },
    { "from": "user", "to": "auth", "label": "implements", "style": { "dashed": true } },
    { "from": "user", "to": "session", "label": "creates" }
  ]
}
```

## Example: Component Diagram

```json
{
  "title": "Microservice Architecture",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "LR" },
  "groups": [
    { "id": "frontend", "label": "Frontend" },
    { "id": "services", "label": "Backend Services" },
    { "id": "infra", "label": "Infrastructure" }
  ],
  "nodes": [
    { "id": "web", "label": "Web App", "type": "uml.component", "group": "frontend" },
    { "id": "mobile", "label": "Mobile App", "type": "uml.component", "group": "frontend" },
    { "id": "api", "label": "API Gateway", "type": "uml.component", "group": "services" },
    { "id": "auth", "label": "Auth Service", "type": "uml.component", "group": "services" },
    { "id": "user-svc", "label": "User Service", "type": "uml.component", "group": "services" },
    { "id": "db", "label": "PostgreSQL", "type": "uml.node", "group": "infra" },
    { "id": "cache", "label": "Redis", "type": "uml.node", "group": "infra" }
  ],
  "edges": [
    { "from": "web", "to": "api" },
    { "from": "mobile", "to": "api" },
    { "from": "api", "to": "auth" },
    { "from": "api", "to": "user-svc" },
    { "from": "auth", "to": "cache" },
    { "from": "user-svc", "to": "db" }
  ]
}
```

## Example: State Machine

```json
{
  "title": "Order State Machine",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "LR" },
  "nodes": [
    { "id": "init", "label": "", "type": "uml.initial-state", "size": { "width": 30, "height": 30 } },
    { "id": "pending", "label": "Pending", "type": "uml.state" },
    { "id": "confirmed", "label": "Confirmed", "type": "uml.state" },
    { "id": "shipped", "label": "Shipped", "type": "uml.state" },
    { "id": "delivered", "label": "Delivered", "type": "uml.state" },
    { "id": "cancelled", "label": "Cancelled", "type": "uml.state", "style": { "fillColor": "#f8cecc" } },
    { "id": "end", "label": "", "type": "uml.final-state", "size": { "width": 30, "height": 30 } }
  ],
  "edges": [
    { "from": "init", "to": "pending", "label": "create" },
    { "from": "pending", "to": "confirmed", "label": "confirm" },
    { "from": "pending", "to": "cancelled", "label": "cancel" },
    { "from": "confirmed", "to": "shipped", "label": "ship" },
    { "from": "confirmed", "to": "cancelled", "label": "cancel" },
    { "from": "shipped", "to": "delivered", "label": "deliver" },
    { "from": "delivered", "to": "end" },
    { "from": "cancelled", "to": "end" }
  ]
}
```

## Tips

- Use `\n─────────\n` to create visual separators in class/interface boxes
- Use `"size": { "width": 200, "height": 150 }` for class boxes with many members
- Use dashed edges for "implements" relationships: `"style": { "dashed": true }`
- `TB` direction works best for inheritance hierarchies
- `LR` direction works best for component/deployment diagrams
- Use groups for packages/modules/layers
