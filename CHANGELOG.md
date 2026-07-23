# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.7] - 2026-04-15

### Added
- **Help Module**: Documented technical API details, including endpoints, cache durations, and response data structures across various modules.

### Changed
- **Application Version**: Updated internal versioning to `0.1.7`.

### Improved
- **Organization Selection**: Integrated `chat_service_enabled` and `email_service_enabled` flags into the organization selection flow and persisted them via the `ui_info` atom.
- **Dashboard Optimization**: Transitioned dashboard data fetching to centralized React Query hooks with a 3-minute caching policy, improving performance and consistency.
- **Quota Settings UI**: Updated button state logic in the chat preferences page to correctly highlight the "Update Quota" button when modifying quota allocations.

### Fixed
- **TypeScript Issues**: Corrected API response typings to resolve "Property 'data' does not exist" and "No overload matches this call" errors related to `folderUidValidity`.
- **React Query Compatibility**: Removed the deprecated `keepPreviousData` property from the `useUserCount` hook to align with TanStack Query v5 requirements.

## [0.1.6] - 2026-04-08

### Changed
- **Environment URLs**: Switched API configurations and reCAPTCHA site keys from development to production values.
- **Application Version**: Updated internal versioning to `0.1.6`.

### Fixed
- **Email Preview**: Corrected the attachment count indicator to accurately reflect both regular and inline attachments in the email preview dialog.
- **Notification Panel**: Refined the layout and formatting of the raw JSON details view for improved readability.

### Improved
- **Health Check Performance**: Implemented caching for health and maintenance checks using `staleTime` and `gcTime` in React Query, reducing redundant API traffic.
- **User Management UI**: 
  - Replaced the interactive 2FA toggle with a read-only status badge (Active/Inactive) for better visual feedback.
  - Simplified the User View by disabling unused 2FA configuration modals and streamlining permission logic.

## [0.1.5] - 2026-04-02

### Changed
- **Environment URLs**: Switched API endpoints and reCAPTCHA site keys to development values.

### Refined
- **Domain Form**: Updated the `handleSkip` function to explicitly call `refetchOrganization()` to refresh organization data when skipping the re-login prompt.
- **Logout Flow**: Updated the `logout` function to call `SendNotification` and the audit log service before calling the server-side logout API. The session deletion API is now only called if both the notification and audit log are successfully completed.

## [0.1.4] - 2026-04-01

### Added
- **Custom Scrollbar**: Replaced hidden scrollbars with a refined, visible, and modern design in the email listing and other scrollable areas.
- **Audit Logging**: Added specific audit logs for `EML_EXPORT` and `EML_EXPORT_FAILED` to track email export activities.
- **Enhanced Notifications**: 
  - Integrated notifications for EML export job status.
  - Implemented a "Click to View" feature on notifications to open a details popup directly.

### Fixed
- **Admin Session Persistence**: Resolved an issue where refreshing the admin domain pages caused an unexpected redirect to the login page.
- **Theme Consistency**: Fixed hardcoded light-mode colors in the Export Email page and Notification Panel to ensure proper support for dark mode.
- **TypeScript Errors**: 
  - Fixed variable redefinition errors in `StatusBanner.tsx`.
  - Resolved implicit 'any' type errors in `NotificationPanel.tsx`.
- **UI Logic**: Added conditional visibility for the download button on expired export files.

### Improved
- **Export Interface**: Redesigned the Export Email page with better feedback, including "Expired" status badges and job metadata.
- **Notification UI**: Improved the overall layout and readability of the notification panel across different themes.
