---
title: User Management
category: Core Modules
icon: Users
order: 5
permission: user:view
---

# User Management

The Users module manages accounts, permissions, and access scope for
everyone with access to the Email Archive application. Note: you won't see
your own account in this list — only other users.

## User List

| Column | Shows |
|---|---|
| **Status** | Active or Inactive. |
| **User** | Name and username. |
| **Contact** | Email address and phone number. |
| **2FA** | Which two-factor method is enabled (Authenticator, SMS, Email) or Disabled. |
| **Updated / Created** | Last updated and account creation dates. |

Use **Search Users** (by name, username, or contact info), **Add New User**,
and **Bulk Actions**. Unlike Domains, Users only supports **Import**,
**Export**, and bulk delete — there's no bulk edit for user accounts.

The row **More Options (⋮)** menu offers View Profile, Edit, Reset Password,
Activate/Deactivate, and Delete. If a user has permissions broader than your
own account, these actions are disabled for that row as a privilege-escalation
safeguard.

## User Details

Click a user to see their full profile:

- **User Information** — name, username, email, phone, status, created/
  updated dates.
- **Access Control List (ACL)** — module-wise permissions (View, Create,
  Update, Delete).
- **Domain Scope** — which domains the user can access.
- **Mailbox Scope** — which specific mailboxes the user can access.
- **Security & Authentication** — which 2FA methods are active. 2FA itself
  is set up from **Settings → Security** by the user, not from this page.

From here you can **Edit Configuration**, **Deactivate**, or **Delete** the
account (delete requires confirmation and is permanent).

## Create / Edit User

| Field | Rules |
|---|---|
| **Username** | Required, 3–50 characters — letters, numbers, dots, hyphens, underscores only. |
| **Display Name** | Required, 3–100 characters, letters and spaces only. |
| **Email Address** | Required, standard email format. |
| **Phone Number** | Required, E.164 format with country code (e.g. `+919845061219`). |
| **Password** | Required on create only. Minimum 8 characters with at least one uppercase, one lowercase, one number, and one special character. |
| **Domain Scope / Mailbox Scope** | Assign which domains/mailboxes the user can access. |
| **Permission Scope** | Module-wise View/Create/Update/Delete permissions. |
| **Active Account** | Enable/disable the account. Defaults to enabled. |

Click **Save Changes** (edit) / **Create User** (new), or **Cancel** to
discard.

### Domain Scope vs. Mailbox Scope

If your organization has more than one archive-enabled domain, **Domain
Scope** controls which ones a user is allowed to see. You can assign one
domain or several — search and select each domain to grant, and it's added
as a badge you can remove later. Whatever domains are assigned, the user
can see and search **Archive List** and individual emails only for those
domains; any domain not assigned to them won't appear in their Domain
Selector or anywhere else in their account.

**Mailbox Scope** narrows this further, down to specific mailboxes
(individual addresses). When a mailbox scope is set for a user:

- Their **From Address** and **To Address** search filters on Archive List
  only accept those specific mailbox addresses — they can't search by any
  other sender or recipient, even within a domain they otherwise have
  access to.
- At least one of From or To Address becomes a required filter on their
  searches, so every query stays scoped to a mailbox they're authorized
  to see.

Use Domain Scope to restrict an admin to only the domain(s) they should
manage (e.g. a regional IT lead who should only see `sales.example.com`),
and add Mailbox Scope on top of that when you need to restrict them
further to specific mailboxes (e.g. an HR user who should only ever search
`hr@example.com`'s mail, not the rest of the domain).
