---
title: Email Listing & Search
category: Core Modules
icon: Mail
order: 3
---

# Email Listing & Search

The Archive List page is where you browse and search archived emails for a
selected domain.

## Browsing

1. Open **Archive List** from the left menu.
2. Choose a domain from the **Domain Selector** — if your account is
   restricted to specific domains, only those appear.
3. The page loads archived emails for that domain, with a running
   **Total Emails** count. If none exist yet, an empty-state message is
   shown instead.

## Search Filters

| Filter | Notes |
|---|---|
| **Subject** | Keyword search on the subject line. |
| **Date Range** | Required — Search stays disabled until both a start and end date are set. |
| **From Address** | Filter by sender. |
| **To Address** | Filter by recipient. |
| **Attachments** | With, Without, or Any. |

If your account is limited to specific mailboxes, at least one of **From**
or **To Address** becomes required as well, so you can only search within
addresses you're authorized to see.

Click **Search** to run the query, or **Reset** to clear every filter and
return to the unfiltered list.

## Advanced Search

Accounts with the right permissions see an **Advanced Search** toggle that
adds:

- **Body Search** — search inside the message body, not just the subject.
- **Extended Date Range** — search further back than the standard 90-day
  window (up to 3650 days), for long-term compliance lookups.

## Working with a Result

Click a row to open the email preview, from which you can:

- **View** the full message body, headers, and attachment list.
- **Download EML** — save the raw `.eml` file (logged in the Audit Trail).
- **Print** the message.
- **Forward** it to another email address.

## Exporting

- **Export** — exports the current search results to Excel or CSV, capped
  at 25,000 records per request (you'll be asked to narrow your filters
  above that).
- **Request Download** — a separate action for larger result sets. It
  submits an asynchronous download job on the server rather than generating
  the file immediately, so you can keep working while it processes.
