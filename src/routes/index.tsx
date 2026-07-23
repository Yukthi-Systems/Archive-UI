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

import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

//layout and routes
import { Layout } from '@/components/layout/Layout'
import { PublicRoute } from './PublicRoutes'
import { ProtectedRoute } from './PrivateRoute'

//auth
import { LoginPage } from '@/pages/auth/login/Login'
import TwoFASelectPage from '@/pages/auth/2FA/2FASelectPage'
import TwoFAVerifyPage from '@/pages/auth/2FA/2FAVerifyPage'

import Dashboard from '@/pages/dashboard'
import Listing from '@/pages/archivelisting'
//users
import Users from '@/pages/users/list'
import UserForm from '@/pages/users/from'
import UserView from '@/pages/users/view'

//domains
import DomainsPage from '@/pages/domains/list'
import DomainForm from '@/pages/domains/form'
import DomainDetailPage from '@/pages/domains/view'

import Permissions from '@/pages/permissions'
//settings
import Settings from '@/pages/settings'
import OrganizationSettings from '@/pages/settings/organization'
import ProfileSettings from '@/pages/settings/profile'
import SecuritySettings from '@/pages/settings/security'

import Profile from '@/pages/profile'
import AuditLogs from '@/pages/auditLogs'
import HelpPage from '@/pages/help'
import ExportEmail from '@/pages/exportEmail'
import ExportEmlLayout from '@/components/layout/ExportEmlLayout'

//admin
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminLogin } from '@/pages/admin/login'
import AdminOrganizations from '@/pages/admin/organizations'
import AdminOrganizationForm from '@/pages/admin/organizations/form'
import AdminOrganizationView from '@/pages/admin/organizations/view'
import AdminDomains from '@/pages/admin/domains'
import AdminDomainForm from '@/pages/admin/domains/form'
import AdminDomainView from '@/pages/admin/domains/view'
import AdminUsers from '@/pages/admin/users'
import AdminUserForm from '@/pages/admin/users/form'
import AdminUserView from '@/pages/admin/users/view'
function RootElement() {
  const location = useLocation()

  useEffect(() => {
    if (!location.pathname.startsWith('/1219/admin')) {
      sessionStorage.removeItem('X-ADMIN-KEY')
    }
  }, [location.pathname])

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <RootElement />,
    errorElement: <ErrorBoundary />,
    children: [
      // ---------------------------------------------------
      // 1. PUBLIC ROUTES (Login, Forgot Password)
      // ---------------------------------------------------
      {
        element: <PublicRoute />,
        children: [
          {
            path: 'login',
            element: <LoginPage />,
          },
          {
            path: '/2fa/select',
            element: <TwoFASelectPage />,
          },
          {
            path: '/2fa/:method',
            element: <TwoFAVerifyPage />,
          },
        ],
      },

      // ---------------------------------------------------
      // 2. PRIVATE ROUTES (Dashboard, Settings)
      // ---------------------------------------------------
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <Layout />,
            children: [
              {
                path: '/',
                element: <Navigate to='/dashboard' replace />,
              },
              {
                path: 'dashboard',
                element: <Dashboard />,
              },
              {
                path: 'archive/:domainName?/:archiveId?',
                element: <Listing />,
              },
              {
                path: 'listing',
                element: <Navigate to='/archive' replace />,
              },
              {
                path: 'users',
                children: [
                  {
                    index: true,
                    element: <Users />,
                  },
                  {
                    path: 'create',
                    element: <UserForm mode='create' />,
                  },
                  {
                    path: ':userId',
                    element: <UserView />,
                  },
                  {
                    path: ':userId/edit',
                    element: <UserForm mode='edit' />,
                  },
                ],
              },
              {
                path: '/domains',
                element: <DomainsPage />,
              },
              {
                path: '/domains/create',
                element: <DomainForm mode='create' />,
              },
              {
                path: '/domains/:domainId',
                element: <DomainDetailPage />,
              },
              {
                path: '/domains/:domainId/edit',
                element: <DomainForm mode='edit' />,
              },
              {
                path: 'permissions',
                element: <Permissions />,
              },
              {
                path: 'settings',
                element: <Settings />,
              },
              {
                path: 'settings/organization',
                element: <OrganizationSettings />,
              },
              {
                path: 'settings/profile',
                element: <ProfileSettings />,
              },
              {
                path: 'settings/security',
                element: <SecuritySettings />,
              },
              {
                path: 'audit',
                element: <AuditLogs />,
              },
              {
                path: 'help',
                element: <HelpPage />,
              },
              {
                path: 'profile',
                element: <Profile />,
              },
            ],
          },
          {
            element: <ExportEmlLayout />,
            children: [
              {
                path: '/export/eml/:jobId',
                element: <ExportEmail />,
              },
            ],
          },
        ],
      },

      // ---------------------------------------------------
      // 3. ADMIN ROUTES (Admin Portal)
      // ---------------------------------------------------
      {
        path: '/1219/admin/login',
        element: <AdminLogin />,
      },
      {
        element: <AdminProtectedRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                path: '/1219/admin',
                element: <Navigate to='/1219/admin/organizations' replace />,
              },
              {
                path: '/1219/admin/organizations',
                children: [
                  { index: true, element: <AdminOrganizations /> },
                  {
                    path: 'create',
                    element: <AdminOrganizationForm mode='create' />,
                  },
                  { path: ':orgId', element: <AdminOrganizationView /> },
                  {
                    path: ':orgId/edit',
                    element: <AdminOrganizationForm mode='edit' />,
                  },
                ],
              },
              {
                path: '/1219/admin/domains',
                children: [
                  { index: true, element: <AdminDomains /> },
                  {
                    path: 'create',
                    element: <AdminDomainForm mode='create' />,
                  },
                  { path: ':domainId', element: <AdminDomainView /> },
                  {
                    path: ':domainId/edit',
                    element: <AdminDomainForm mode='edit' />,
                  },
                ],
              },
              {
                path: '/1219/admin/users',
                children: [
                  { index: true, element: <AdminUsers /> },
                  { path: 'create', element: <AdminUserForm mode='create' /> },
                  { path: ':userId', element: <AdminUserView /> },
                  {
                    path: ':userId/edit',
                    element: <AdminUserForm mode='edit' />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
