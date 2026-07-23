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

// Runtime configuration is public: it is delivered to every browser. Do not
// place passwords, private API keys, or other credentials in VITE_* variables.
// Authentication and authorization must be enforced by the backend.
//
// Resolution order: runtime config (window._env_) -> Vite build-time config.
const getEnv = (key: string, defaultValue = ''): string => {
  if (typeof window !== 'undefined' && window._env_ && window._env_[key]) {
    return window._env_[key]
  }
  return import.meta.env[key] || defaultValue
}

const APP_VERSION_VALUE = '0.1.9'

export const PER_PAGE = 50

// API Configuration
export const API_URL = getEnv('VITE_API_URL')

export const EXPORT_API_URL = getEnv('VITE_EXPORT_API_URL')

// This value is sent to every browser and request. It is a public client
// identifier only; do not use it as a credential or authorization mechanism.
export const EXPORT_API_KEY = getEnv('VITE_API_KEY')

export const RECAPTCHA_SITE_KEY = getEnv('VITE_RECAPTCHA_SITE_KEY', '')

export const APP_VERSION = getEnv('VITE_APP_VERSION', APP_VERSION_VALUE)

export const WSS_URL = getEnv('VITE_WSS_URL')

export const ARCHIVE_DOMAIN = getEnv('VITE_ARCHIVE_DOMAIN', '')

// Related Repository URLs (FOSS)
export const ARCHIVE_UI_REPO_URL =
  'https://github.com/Yukthi-Systems/EMailArchive-UI'
export const RMQ_PARSER_REPO_URL =
  'https://github.com/Yukthi-Systems/RMQ-Archive-Parser'
export const ARCHIVE_ADMIN_API_REPO_URL =
  'https://github.com/Yukthi-Systems/Archive-Admin-API'
export const IMAP_SYNC_REPO_URL = 'https://github.com/Yukthi-Systems/IMAP-Sync'
export const ARCHIVE_DOWNLOADER_REPO_URL =
  'https://github.com/Yukthi-Systems/Archive-Email-Downloader'
export const ARCHIVE_MAIN_WORKER_REPO_URL =
  'https://github.com/Yukthi-Systems/Archive-Main-Worker-RMQ'
export const ARCHIVE_DEDUPE_REPO_URL =
  'https://github.com/Yukthi-Systems/Archive-Dedupe-Handler-RMQ'
export const RMQ_ARCHIVE_EXPORT_REPO_URL =
  'https://github.com/Yukthi-Systems/RMQ-Archive-Export'
