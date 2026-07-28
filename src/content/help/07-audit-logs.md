---
title: Audit Logs
category: Core Modules
icon: Shield
order: 7
permission: audit:view
---

# Audit Logs

A record of user and system activity — logins, searches, exports, imports,
settings changes, and account/domain management — for monitoring and
compliance.

## Filtering

| Filter | Notes |
|---|---|
| **Activity Search** | Keyword search across log entries. |
| **User Filter** | Restrict to a specific user. |
| **Log Type** | Choose from the full set of trackable event types (logins, CRUD on domains/users, password changes, 2FA changes, archive search/view/download/forward/export, imports, and their failed-attempt variants). |
| **Date Range** | Required — Search stays disabled until a range is set. |

Click **Search** to run the query, or **Reset** to clear all filters back to
their defaults.

## Reading the results

The **Total Records** count shows how many entries match. The table lists
**Event Type**, **Activity Summary**, **User**, and **Time** for each entry
— click a row to open its full detail.

## Exporting

**Export** downloads the filtered results as Excel or CSV, capped at 50,000
records per batch; if your filters match more than that, you'll get a
partial export and should narrow the date range or filters.
