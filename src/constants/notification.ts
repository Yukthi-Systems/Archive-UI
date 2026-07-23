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

export const NOTIFICATION_TYPES = {
  // User
  USER_CREATED: 'user_created',
  USER_CREATION_FAILED: 'user_creation_failed',
  USER_UPDATED: 'user_updated',
  USER_UPDATE_FAILED: 'user_update_failed',
  USER_DELETED: 'user_deleted',
  USER_DELETION_FAILED: 'user_deletion_failed',
  USER_STATUS_UPDATED: 'user_status_updated',
  USER_STATUS_UPDATE_FAILED: 'user_status_update_failed',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_RESET_FAILED: 'password_reset_failed',

  // Domain
  DOMAIN_CREATED: 'domain_created',
  DOMAIN_CREATION_FAILED: 'domain_creation_failed',
  DOMAIN_UPDATED: 'domain_updated',
  DOMAIN_UPDATE_FAILED: 'domain_update_failed',
  DOMAIN_DELETED: 'domain_deleted',
  DOMAIN_DELETION_FAILED: 'domain_deletion_failed',

  // Organization
  ORGANIZATION_CREATED: 'organization_created', // If applicable
  ORGANIZATION_CREATION_FAILED: 'organization_creation_failed', // If applicable
  ORGANIZATION_UPDATED: 'organization_updated',
  ORGANIZATION_UPDATE_FAILED: 'organization_update_failed',
  ORGANIZATION_DELETED: 'organization_deleted', // If applicable
  ORGANIZATION_DELETION_FAILED: 'organization_deletion_failed', // If applicable

  // Auth
  AUTH_LOGIN: 'auth_login',
  AUTH_LOGIN_FAILED: 'auth_login_failed',
  AUTH_LOGOUT: 'auth_logout',
  AUTH_LOGOUT_FAILED: 'auth_logout_failed',
  TWO_FA_VERIFICATION: 'two_fa_verification',
  TWO_FA_VERIFICATION_FAILED: 'two_fa_verification_failed',

  // Archive
  ARCHIVE_EML_DOWNLOADED: 'archive_eml_downloaded',
  ARCHIVE_EML_DOWNLOAD_FAILED: 'archive_eml_download_failed',
  ARCHIVE_EXPORT: 'archive_export',
  ARCHIVE_EXPORT_FAILED: 'archive_export_failed',
  EML_EXPORT_VIEW: 'eml_export_view',
  EML_EXPORT_VIEW_FAILED: 'eml_export_view_failed',
  EML_EXPORT_DOWNLOAD: 'eml_export_download',
  EML_EXPORT_DOWNLOAD_FAILED: 'eml_export_download_failed',
}

export const getNotificationPayload = (type: string, data: any) => {
  switch (type) {
    // --- User Success Cases ---
    case NOTIFICATION_TYPES.USER_CREATED:
      return {
        type: NOTIFICATION_TYPES.USER_CREATED,
        message: `User ${data.user_name} has been created.`,
        metadata: { ...data, password: '*******' },
      }
    case NOTIFICATION_TYPES.USER_UPDATED:
      return {
        type: NOTIFICATION_TYPES.USER_UPDATED,
        message: `User ${data.user_name || 'details'} has been updated.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.USER_STATUS_UPDATED:
      return {
        type: NOTIFICATION_TYPES.USER_STATUS_UPDATED,
        message: `User status for ${
          data.user_name || 'user'
        } has been updated to ${data.is_active ? 'Active' : 'Inactive'}.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.USER_DELETED:
      return {
        type: NOTIFICATION_TYPES.USER_DELETED,
        message: `User ${data.user_name} has been deleted.`,
        metadata: { user_id: data.user_id },
      }
    case NOTIFICATION_TYPES.PASSWORD_RESET:
      return {
        type: NOTIFICATION_TYPES.PASSWORD_RESET,
        message: `Password has been reset for user: ${data.user_name}.`,
        metadata: { user_name: data.user_name },
      }

    // --- User Failure Cases ---
    case NOTIFICATION_TYPES.USER_CREATION_FAILED:
      return {
        type: NOTIFICATION_TYPES.USER_CREATION_FAILED,
        message: `Failed to create user ${data.user_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.USER_UPDATE_FAILED:
      return {
        type: NOTIFICATION_TYPES.USER_UPDATE_FAILED,
        message: `Failed to update user ${data.user_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.USER_STATUS_UPDATE_FAILED:
      return {
        type: NOTIFICATION_TYPES.USER_STATUS_UPDATE_FAILED,
        message: `Failed to update status for user ${data.user_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.USER_DELETION_FAILED:
      return {
        type: NOTIFICATION_TYPES.USER_DELETION_FAILED,
        message: `Failed to delete user: ${data.user_name}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.PASSWORD_RESET_FAILED:
      return {
        type: NOTIFICATION_TYPES.PASSWORD_RESET_FAILED,
        message: `Failed to reset password for user: ${data.user_name}. ${
          data.error || ''
        }`,
        metadata: data,
      }

    // --- Domain Success Cases ---
    case NOTIFICATION_TYPES.DOMAIN_CREATED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_CREATED,
        message: `Domain ${data.domain_name} has been created.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.DOMAIN_UPDATED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_UPDATED,
        message: `Domain ${data.domain_name} has been updated.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.DOMAIN_DELETED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_DELETED,
        message: `Domain ${data.domain_name || data.domain_id} has been deleted.`,
        metadata: data,
      }

    // --- Domain Failure Cases ---
    case NOTIFICATION_TYPES.DOMAIN_CREATION_FAILED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_CREATION_FAILED,
        message: `Failed to create domain ${data.domain_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.DOMAIN_UPDATE_FAILED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_UPDATE_FAILED,
        message: `Failed to update domain ${data.domain_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.DOMAIN_DELETION_FAILED:
      return {
        type: NOTIFICATION_TYPES.DOMAIN_DELETION_FAILED,
        message: `Failed to delete domain ${
          data.domain_name || data.domain_id
        }. ${data.error || ''}`,
        metadata: data,
      }

    // --- Organization Success Cases ---
    case NOTIFICATION_TYPES.ORGANIZATION_CREATED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_CREATED,
        message: `Organization ${data.organization_name} has been created.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.ORGANIZATION_UPDATED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_UPDATED,
        message: `Organization ${
          data.organization_name || 'details'
        } has been updated.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.ORGANIZATION_DELETED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_DELETED,
        message: `Organization ${data.organization_name} has been deleted.`,
        metadata: data,
      }

    // --- Organization Failure Cases ---
    case NOTIFICATION_TYPES.ORGANIZATION_CREATION_FAILED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_CREATION_FAILED,
        message: `Failed to create organization ${
          data.organization_name || ''
        }. ${data.error || ''}`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.ORGANIZATION_UPDATE_FAILED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_UPDATE_FAILED,
        message: `Failed to update organization ${
          data.organization_name || ''
        }. ${data.error || ''}`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.ORGANIZATION_DELETION_FAILED:
      return {
        type: NOTIFICATION_TYPES.ORGANIZATION_DELETION_FAILED,
        message: `Failed to delete organization ${
          data.organization_name || ''
        }. ${data.error || ''}`,
        metadata: data,
      }

    // --- Auth Success Cases ---
    case NOTIFICATION_TYPES.AUTH_LOGIN:
      return {
        type: NOTIFICATION_TYPES.AUTH_LOGIN,
        message: `User ${data.user_name || 'Unknown'} logged in successfully.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.AUTH_LOGOUT:
      return {
        type: NOTIFICATION_TYPES.AUTH_LOGOUT,
        message: `User ${data.user_name || 'Unknown'} logged out successfully.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.TWO_FA_VERIFICATION:
      return {
        type: NOTIFICATION_TYPES.TWO_FA_VERIFICATION,
        message: `Two-factor authentication verified successfully for user ${data.user_name || ''}.`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.TWO_FA_VERIFICATION_FAILED:
      return {
        type: NOTIFICATION_TYPES.TWO_FA_VERIFICATION_FAILED,
        message: `Two-factor authentication verification failed for user ${data.user_name || ''}. ${data.error || ''}`,
        metadata: data,
      }

    // --- Auth Failure Cases ---
    case NOTIFICATION_TYPES.AUTH_LOGIN_FAILED:
      return {
        type: NOTIFICATION_TYPES.AUTH_LOGIN_FAILED,
        message: `Login failed for user ${data.user_name || ''}. ${
          data.error || ''
        }`,
        metadata: data,
      }
    case NOTIFICATION_TYPES.AUTH_LOGOUT_FAILED:
      return {
        type: NOTIFICATION_TYPES.AUTH_LOGOUT_FAILED,
        message: `Logout failed. ${data.error || ''}`,
        metadata: data,
      }

    // --- Archive Success Cases ---
    case NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOADED:
      return {
        type: NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOADED,
        message: `EML file for archive ID: ${data.archive_id} has been downloaded.`,
        metadata: data,
      }

    // --- Archive Failure Cases ---
    case NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOAD_FAILED:
      return {
        type: NOTIFICATION_TYPES.ARCHIVE_EML_DOWNLOAD_FAILED,
        message: `Failed to download EML for archive ID: ${data.archive_id}. ${
          data.error || ''
        }`,
        metadata: data,
      }

    // --- Export Success Cases ---
    case NOTIFICATION_TYPES.EML_EXPORT_VIEW:
      return {
        type: NOTIFICATION_TYPES.EML_EXPORT_VIEW,
        message: `Email export for job ID: ${data.jobId} completed successfully.`,
        metadata: data,
      }

    // --- Export Failure Cases ---
    case NOTIFICATION_TYPES.EML_EXPORT_VIEW_FAILED:
      return {
        type: NOTIFICATION_TYPES.EML_EXPORT_VIEW_FAILED,
        message: `Failed to view EML Zip files for job ID: ${data.jobId}. ${data.error || ''}`,
        metadata: data,
      }

    // --- Export Download Success ---
    case NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD:
      return {
        type: NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD,
        message: `Successfully downloaded EML Zip file: ${data.fileName} (Job ID: ${data.jobId}).`,
        metadata: data,
      }

    // --- Export Download Failure ---
    case NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD_FAILED:
      return {
        type: NOTIFICATION_TYPES.EML_EXPORT_DOWNLOAD_FAILED,
        message: `Failed to download EML Zip file: ${data.fileName} (Job ID: ${data.jobId}). ${data.error || ''}`,
        metadata: data,
      }

    default:
      return {
        type: 'General',
        message: 'Notification',
        metadata: data,
      }
  }
}

export const notificationTypes = {
  // User
  user_created: 'USER CREATED',
  user_creation_failed: 'USER CREATION FAILED',
  user_updated: 'USER UPDATED',
  user_update_failed: 'USER UPDATE FAILED',
  user_deleted: 'USER DELETED',
  user_deletion_failed: 'USER DELETION FAILED',
  user_status_updated: 'USER STATUS UPDATED',
  user_status_update_failed: 'USER STATUS UPDATE FAILED',
  password_reset: 'PASSWORD RESET',
  password_reset_failed: 'PASSWORD RESET FAILED',

  // Domain
  domain_created: 'DOMAIN CREATED',
  domain_creation_failed: 'DOMAIN CREATION FAILED',
  domain_updated: 'DOMAIN UPDATED',
  domain_update_failed: 'DOMAIN UPDATE FAILED',
  domain_deleted: 'DOMAIN DELETED',
  domain_deletion_failed: 'DOMAIN DELETION FAILED',

  // Organization
  organization_created: 'ORGANIZATION CREATED', // If applicable
  organization_creation_failed: 'ORGANIZATION CREATION FAILED', // If applicable
  organization_updated: 'ORGANIZATION UPDATED',
  organization_update_failed: 'ORGANIZATION UPDATE FAILED',
  organization_deleted: 'ORGANIZATION DELETED', // If applicable
  organization_deletion_failed: 'ORGANIZATION DELETION FAILED', // If applicable

  // Auth
  auth_login: 'AUTH LOGIN',
  auth_login_failed: 'AUTH LOGIN FAILED',
  auth_logout: 'AUTH LOGOUT',
  auth_logout_failed: 'AUTH LOGOUT FAILED',
  two_fa_verification: 'TWO FA VERIFICATION',
  two_fa_verification_failed: 'TWO FA VERIFICATION FAILED',

  // Archive
  archive_eml_downloaded: 'ARCHIVE EML DOWNLOADED',
  archive_eml_download_failed: 'ARCHIVE EML DOWNLOAD FAILED',
  archive_export: 'ARCHIVE EXPORT',
  archive_export_failed: 'ARCHIVE EXPORT FAILED',
  eml_export_view: 'EML EXPORT VIEW',
  eml_export_view_failed: 'EML EXPORT VIEW FAILED',
  eml_export_download: 'EML EXPORT DOWNLOAD',
  eml_export_download_failed: 'EML EXPORT DOWNLOAD FAILED',
}
