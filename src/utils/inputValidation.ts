/*
 * Copyright (C) 2026 Yukthi Systems Private Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

// Backend search endpoints (subject/body/user/activity keyword search) build
// queries from these strings server-side, so a stray quote or SQL
// metacharacter can break/inject the query (e.g. an apostrophe in a subject
// like "Apr'23" surfacing a ClickHouse syntax error). Restrict free-text
// search inputs to alphanumeric characters and spaces at entry time.
const ALPHANUMERIC_SPACE_PATTERN = /[^a-zA-Z0-9 ]/g

export function sanitizeAlphanumericSpaces(value: string): string {
  return value.replace(ALPHANUMERIC_SPACE_PATTERN, '')
}

// Email inputs need to retain characters valid in addresses (and
// comma-separated lists of them) while still stripping SQL metacharacters
// such as quotes, semicolons, and backslashes before the value ever reaches
// state/the API.
const EMAIL_LIST_DISALLOWED_PATTERN = /[^a-zA-Z0-9 @.\-_+,]/g

export function sanitizeEmailListInput(value: string): string {
  return value.replace(EMAIL_LIST_DISALLOWED_PATTERN, '')
}
