---
title: FAQs
category: Support
icon: HelpCircle
order: 11
---

# Frequently Asked Questions

### Account & Access

**Can I recover a deleted user?**
No — once a user is deleted, their access is permanently removed. Audit
logs associated with that user are retained, though.

**Can I forward an email to my Gmail (or any other) address?**
Yes. Open any archived email and use **Forward** to send it to any email
address you choose, including a personal or external one like Gmail.

### Retention

**What happens to emails once they pass the retention period?**
They're deleted automatically and permanently — see
[How Retention Period Works](#domains) for the full explanation with an
example. There's no warning before this happens and no way to recover the
email afterward, so set the retention period to cover the longest lookback
you actually need.

**Can the retention period be changed later?**
Yes, from **Domains → [domain] → Edit Domain**. Once you've changed it,
you have to wait 24 hours before changing it again.

**Do we lose emails if we increase the retention period later?**
No — increasing the retention period only widens the window going
forward, so nothing currently in the archive is deleted because of the
increase. It won't bring back emails that were already deleted under a
shorter retention period before you increased it, though.

**Can each domain have a different retention period?**
Yes. Retention is configured per domain, so different domains in the same
organization can each have their own retention period.

### Domains & Organization

**Can we edit the domain name later?**
No — the domain name can't be changed after the domain is created. If you
need a different domain, create a new one; existing archived data won't be
moved automatically.

**Can the organization name be edited?**
Not from within the app — it's set when your organization is provisioned.
Contact your account administrator if it needs to change.

**Can each domain have different user logins?**
Users are org-wide accounts, not separate logins per domain. What you can
do instead is control which domains (and even which specific mailboxes)
each user can access — see [Domain Scope vs. Mailbox Scope](#users).

**Can we increase our storage quota?**
Yes, per domain — edit the domain and raise its quota, up to your
organization's total remaining available quota. If you need more than
that, you'll need to increase the organization's overall quota with your
account administrator.

**Can we have our own logo?**
Not currently — there's no self-service branding/logo upload in the app
today.

**What happens if I exceed my storage quota?**
Emails that arrive after a domain's storage quota is full are **lost and
cannot be recovered later** — they are not queued or retried once space is
freed up. Administrators receive alerts as usage approaches the limit, so
treat those as urgent: raise the domain's quota before it fills up, not
after.

### Security

**Is the data encrypted?**
Yes — all data is encrypted in transit (TLS) and at rest (AES-256).
