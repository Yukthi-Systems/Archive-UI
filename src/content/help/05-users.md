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
