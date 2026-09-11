---
title: Domain Management
category: Core Modules
icon: Database
order: 4
permission: domain:view
---

# Domain Management

The Domains module is where you manage archive-enabled domains: storage
quotas, retention policies, and the unique archive address used for email
journaling.

## Domain List

| Column | Shows |
|---|---|
| **Status** | Active or Inactive. |
| **Storage** | Used vs. total quota, with a utilization bar. |
| **Retention** | Configured retention period. |
| **Updated / Created** | Last updated and creation dates. |

Use **Search Domains** to find a domain by name, **Add New Domain** to
create one, and the **Bulk Actions** menu for operations across multiple
domains. Add New Domain and destructive bulk actions are hidden or disabled
for admins whose account is scoped to specific domains or mailboxes.

## Domain Details

Click a domain from the list to see its full configuration:

- **Domain Information** — name, created date, last updated date.
- **Status** and **Retention Period**.
- **Storage Used** vs. **Total Quota**.
- **Archiving Setup** — the unique archive email address used for
  journaling/forwarding. Use **Show Address** to reveal it and
  **Copy Address** to copy it to the clipboard.
- **Edit Domain**, **Deactivate** (pauses archiving; existing data stays
  accessible), and **Delete** (permanent, requires confirmation).

> After creating or deleting a domain, the app will prompt you to re-login
> so the domain list reflects the change immediately.

## Create / Edit Domain

| Field | Rules |
|---|---|
| **Domain Name** | Required, valid FQDN without protocol (e.g. `example.com`). **Cannot be changed after creation** — only retention, quota, and status are editable afterward. |
| **Retention Period (Days)** | Required, 1–7300 days (up to 20 years). Once set, further changes are only allowed 24 hours after the last change. |
| **Storage Quota (GB)** | Required, minimum 2 GB, capped by your organization's remaining available quota. |
| **Active Status** | Enable/disable archiving for the domain. Defaults to enabled. |

Click **Save Changes** (edit) or **Create Domain** (new) to apply, or
**Cancel** to discard.

### How Retention Period Works

The retention period is a rolling window, not a fixed cutoff date. On any
given day, only emails received within the last *N* days (where *N* is the
domain's configured retention period) are kept. Once an email goes beyond
that age, it is automatically and permanently deleted — **without any prior
warning or notification**.

**Example:** if a domain's retention period is set to 90 days, then on
1 June the archive holds every email received between 3 March and 1 June.
An email that arrived on 2 March would already have been deleted by
1 June, since it is more than 90 days old, and there is no way to recover
it afterward.

Keep this in mind when choosing a retention period — set it to cover the
longest lookback your compliance or business needs actually require, since
anything older simply won't be there to search or export later.

## Bulk Actions

| Action | Description |
|---|---|
| **Import** | Bulk-create domains from a CSV/Excel file — see [Bulk Import Tool](#bulk-import-tool). |
| **Bulk Edit** | Update retention, quota, or status for multiple selected domains at once. |
| **Export** | Export domain information to Excel or CSV. |
