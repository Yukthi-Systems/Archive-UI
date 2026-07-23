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

import { CheckCircle2, XCircle } from 'lucide-react'

interface StatusViewerProps {
  isActive: boolean
}

const StatusViewer = ({ isActive }: StatusViewerProps) => {
  return (
    <div
      className={`
            h-8 w-8 flex items-center justify-center rounded-md
            ${
              isActive
                ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
                : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
            }`}
    >
      {isActive ? (
        <>
          <CheckCircle2 className='w-5 h-5' />
        </>
      ) : (
        <>
          <XCircle className='w-5 h-5' />
        </>
      )}
    </div>
  )
}

export default StatusViewer
