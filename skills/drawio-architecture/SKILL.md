---
name: drawio-architecture
description: >
  Generate cloud architecture, system design, and network diagrams as .drawio.svg files.
  Supports AWS, Azure, GCP, and generic network shapes.
  Use when the user asks for an architecture diagram, system design, infrastructure diagram,
  cloud topology, network diagram, or any diagram involving cloud services or system components.
---

# Architecture Diagram Generation

Generate architecture diagrams using the `drawio-claude` CLI tool. Describe the system as JSON with cloud service shapes, and the tool handles layout and rendering.

## Quick Start

```bash
echo '<JSON>' | drawio-claude generate -o architecture.drawio.svg
```

## JSON DSL Format

```json
{
  "title": "Serverless API",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "LR" },
  "groups": [
    { "id": "frontend", "label": "Frontend" },
    { "id": "backend", "label": "Backend Services" },
    { "id": "data", "label": "Data Layer" }
  ],
  "nodes": [
    { "id": "cdn", "label": "CloudFront", "type": "aws.cloudfront", "group": "frontend" },
    { "id": "apigw", "label": "API Gateway", "type": "aws.api-gateway", "group": "backend" },
    { "id": "fn", "label": "Lambda", "type": "aws.lambda", "group": "backend" },
    { "id": "db", "label": "DynamoDB", "type": "aws.dynamodb", "group": "data" },
    { "id": "cache", "label": "ElastiCache", "type": "aws.elasticache", "group": "data" }
  ],
  "edges": [
    { "from": "cdn", "to": "apigw" },
    { "from": "apigw", "to": "fn" },
    { "from": "fn", "to": "db" },
    { "from": "fn", "to": "cache" }
  ]
}
```

## AWS Shapes

| Type | Service |
|------|---------|
| `aws.lambda` | Lambda |
| `aws.ec2` | EC2 |
| `aws.s3` | S3 |
| `aws.rds` | RDS |
| `aws.dynamodb` | DynamoDB |
| `aws.api-gateway` | API Gateway |
| `aws.sqs` | SQS |
| `aws.sns` | SNS |
| `aws.cloudfront` | CloudFront |
| `aws.ecs` | ECS |
| `aws.eks` | EKS |
| `aws.fargate` | Fargate |
| `aws.elb` | Elastic Load Balancer |
| `aws.vpc` | VPC |
| `aws.route53` | Route 53 |
| `aws.cloudwatch` | CloudWatch |
| `aws.iam` | IAM |
| `aws.cognito` | Cognito |
| `aws.stepfunctions` | Step Functions |
| `aws.eventbridge` | EventBridge |
| `aws.kinesis` | Kinesis |
| `aws.redshift` | Redshift |
| `aws.elasticache` | ElastiCache |
| `aws.secrets-manager` | Secrets Manager |
| `aws.ecr` | ECR |
| `aws.codepipeline` | CodePipeline |
| `aws.cloudformation` | CloudFormation |
| `aws.sagemaker` | SageMaker |
| `aws.generic` | Generic AWS cloud icon |

## Azure Shapes

| Type | Service |
|------|---------|
| `azure.vm` | Virtual Machine |
| `azure.app-service` | App Service |
| `azure.sql-database` | SQL Database |
| `azure.storage` | Storage |
| `azure.functions` | Functions |
| `azure.cosmos-db` | Cosmos DB |
| `azure.key-vault` | Key Vault |
| `azure.aks` | AKS |
| `azure.load-balancer` | Load Balancer |
| `azure.vnet` | Virtual Network |
| `azure.api-management` | API Management |
| `azure.service-bus` | Service Bus |
| `azure.event-hub` | Event Hub |
| `azure.container-registry` | Container Registry |
| `azure.active-directory` | Active Directory |
| `azure.monitor` | Monitor |
| `azure.cdn` | CDN |
| `azure.redis-cache` | Redis Cache |
| `azure.devops` | DevOps |
| `azure.logic-apps` | Logic Apps |

## GCP Shapes

| Type | Service |
|------|---------|
| `gcp.compute-engine` | Compute Engine |
| `gcp.cloud-functions` | Cloud Functions |
| `gcp.cloud-run` | Cloud Run |
| `gcp.gke` | GKE |
| `gcp.cloud-storage` | Cloud Storage |
| `gcp.bigquery` | BigQuery |
| `gcp.cloud-sql` | Cloud SQL |
| `gcp.firestore` | Firestore |
| `gcp.pub-sub` | Pub/Sub |
| `gcp.cloud-cdn` | Cloud CDN |
| `gcp.load-balancing` | Load Balancing |
| `gcp.vpc` | VPC |
| `gcp.iam` | IAM |
| `gcp.cloud-build` | Cloud Build |
| `gcp.dataflow` | Dataflow |
| `gcp.vertex-ai` | Vertex AI |

## Network Shapes

| Type | Shape |
|------|-------|
| `network.server` | Server |
| `network.router` | Router |
| `network.switch` | Switch |
| `network.firewall` | Firewall |
| `network.cloud` | Cloud |
| `network.user` | User/Person |
| `network.laptop` | Laptop |
| `network.desktop` | Desktop PC |
| `network.database` | Database cylinder |
| `network.internet` | Internet cloud |
| `network.load-balancer` | Load Balancer |
| `network.wireless` | Wireless bridge |

## Nested Groups (VPCs, Subnets, Zones)

Architecture diagrams frequently need multi-level nesting:

```json
{
  "groups": [
    { "id": "vpc", "label": "VPC 10.0.0.0/16" },
    { "id": "public", "label": "Public Subnet", "parent": "vpc" },
    { "id": "private", "label": "Private Subnet", "parent": "vpc" },
    { "id": "az1", "label": "AZ-1", "parent": "private" }
  ],
  "nodes": [
    { "id": "alb", "label": "ALB", "type": "aws.elb", "group": "public" },
    { "id": "app1", "label": "App Server", "type": "aws.ec2", "group": "az1" }
  ]
}
```

## Layout Tips for Architecture Diagrams

- Use `"direction": "LR"` for horizontal data flow (client → server → database)
- Use `"direction": "TB"` for layered architectures (presentation → logic → data)
- Increase `spacing.layer` to 120+ for readability with many groups
- Use groups to represent boundaries (VPCs, subnets, regions, accounts)

## Style Overrides

Color-code by concern:

```json
{ "id": "db", "label": "DB", "type": "aws.rds", "style": { "fillColor": "#f8cecc" } }
```

## Example: Multi-Tier Web Application

```json
{
  "title": "Multi-Tier Web App",
  "theme": "professional",
  "layout": { "algorithm": "hierarchical", "direction": "TB", "spacing": { "layer": 120 } },
  "groups": [
    { "id": "dns", "label": "DNS & CDN" },
    { "id": "compute", "label": "Compute" },
    { "id": "data", "label": "Data" },
    { "id": "monitoring", "label": "Monitoring" }
  ],
  "nodes": [
    { "id": "r53", "label": "Route 53", "type": "aws.route53", "group": "dns" },
    { "id": "cf", "label": "CloudFront", "type": "aws.cloudfront", "group": "dns" },
    { "id": "alb", "label": "ALB", "type": "aws.elb", "group": "compute" },
    { "id": "ecs", "label": "ECS Fargate", "type": "aws.fargate", "group": "compute" },
    { "id": "rds", "label": "Aurora", "type": "aws.rds", "group": "data" },
    { "id": "redis", "label": "ElastiCache", "type": "aws.elasticache", "group": "data" },
    { "id": "s3", "label": "S3 Assets", "type": "aws.s3", "group": "data" },
    { "id": "cw", "label": "CloudWatch", "type": "aws.cloudwatch", "group": "monitoring" }
  ],
  "edges": [
    { "from": "r53", "to": "cf" },
    { "from": "cf", "to": "alb" },
    { "from": "alb", "to": "ecs" },
    { "from": "ecs", "to": "rds" },
    { "from": "ecs", "to": "redis" },
    { "from": "cf", "to": "s3" },
    { "from": "ecs", "to": "cw" }
  ]
}
```
