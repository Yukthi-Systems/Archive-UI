---
title: Dashboard
category: Getting Started
icon: LayoutDashboard
order: 2
permission: dashboard:view
---

# Dashboard

The Dashboard Provides you a real-time overview of your archive environment:
storage usage, service health, and archiving trends.

## Organization & Storage

- **User Information** — organization name, member-since date, registered
  admin email, and contact number.
- **Storage Usage** — total capacity, used storage, available storage, and a
  progress bar. The bar turns yellow around 70% utilization and red near
  90%, so you can see quota pressure at a glance.

## Service Health

Displays the live status of four backend services: **API**, **Cache**,
**Database**, and **Search DB**, each marked OK or Failed. Health is checked
automatically every 3 minutes.

## Export

The **Export** button download live dashboard data — per-domain email counts,
storage quota, and utilization — and downloads it as an Excel/CSV format.
The action is recorded in the Audit Logs.

## Charts

| Chart | Shows |
|---|---|
| **Total Emails** | Archived email count, grouped by domain. |
| **Total Size** | Storage used, grouped by domain — which domains consume the most space. |
| **Email Volume (Last 7 Days)** | Daily archiving activity trend. |
| **Storage Volume (Last 7 Days)** | Daily storage growth trend. |

The chart panels only appear if your account has dashboard view permission.
