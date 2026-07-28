---
title: Bulk Import Tool
category: Core Modules
icon: FileSpreadsheet
order: 6
---

# Bulk Import Tool

The Bulk Import tool lets you create multiple Domains or Users at once from
a spreadsheet, available from the Bulk Actions menu on each of those pages.

## How it works

1. **Download Sample** — grab the sample CSV/Excel file to see the required
   headers and format.
2. **Upload & Process** — upload your filled-in file. Every row is
   automatically validated for format and data integrity (the same rules as
   the Create form — e.g. username/email format, password strength for
   users, retention/quota ranges for domains).
3. **Preview Data** — review exactly how each row will be created before
   confirming.

## Validation is all-or-nothing

If any row fails validation (duplicate username, invalid email, weak
password, out-of-range retention/quota, etc.), the entire import is blocked
— nothing partially imports. Fix the flagged rows and re-upload.

For user imports, each row's requested permissions are also checked against
your own account's permission set — you can't bulk-import a user with more
access than you have yourself.
