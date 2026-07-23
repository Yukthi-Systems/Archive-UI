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

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// ─────────────────────────────────────────────────────────
//  Country data
// ─────────────────────────────────────────────────────────
interface Country {
  name: string
  dialCode: string
  flag: string
  code: string
}

const COUNTRIES: Country[] = [
  { name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫', code: 'AF' },
  { name: 'Albania', dialCode: '+355', flag: '🇦🇱', code: 'AL' },
  { name: 'Algeria', dialCode: '+213', flag: '🇩🇿', code: 'DZ' },
  { name: 'Andorra', dialCode: '+376', flag: '🇦🇩', code: 'AD' },
  { name: 'Angola', dialCode: '+244', flag: '🇦🇴', code: 'AO' },
  { name: 'Argentina', dialCode: '+54', flag: '🇦🇷', code: 'AR' },
  { name: 'Armenia', dialCode: '+374', flag: '🇦🇲', code: 'AM' },
  { name: 'Australia', dialCode: '+61', flag: '🇦🇺', code: 'AU' },
  { name: 'Austria', dialCode: '+43', flag: '🇦🇹', code: 'AT' },
  { name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', code: 'AZ' },
  { name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', code: 'BH' },
  { name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', code: 'BD' },
  { name: 'Belarus', dialCode: '+375', flag: '🇧🇾', code: 'BY' },
  { name: 'Belgium', dialCode: '+32', flag: '🇧🇪', code: 'BE' },
  { name: 'Bolivia', dialCode: '+591', flag: '🇧🇴', code: 'BO' },
  { name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦', code: 'BA' },
  { name: 'Brazil', dialCode: '+55', flag: '🇧🇷', code: 'BR' },
  { name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬', code: 'BG' },
  { name: 'Cambodia', dialCode: '+855', flag: '🇰🇭', code: 'KH' },
  { name: 'Cameroon', dialCode: '+237', flag: '🇨🇲', code: 'CM' },
  { name: 'Canada', dialCode: '+1', flag: '🇨🇦', code: 'CA' },
  { name: 'Chile', dialCode: '+56', flag: '🇨🇱', code: 'CL' },
  { name: 'China', dialCode: '+86', flag: '🇨🇳', code: 'CN' },
  { name: 'Colombia', dialCode: '+57', flag: '🇨🇴', code: 'CO' },
  { name: 'Croatia', dialCode: '+385', flag: '🇭🇷', code: 'HR' },
  { name: 'Cuba', dialCode: '+53', flag: '🇨🇺', code: 'CU' },
  { name: 'Cyprus', dialCode: '+357', flag: '🇨🇾', code: 'CY' },
  { name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', code: 'CZ' },
  { name: 'Denmark', dialCode: '+45', flag: '🇩🇰', code: 'DK' },
  { name: 'Ecuador', dialCode: '+593', flag: '🇪🇨', code: 'EC' },
  { name: 'Egypt', dialCode: '+20', flag: '🇪🇬', code: 'EG' },
  { name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', code: 'ET' },
  { name: 'Finland', dialCode: '+358', flag: '🇫🇮', code: 'FI' },
  { name: 'France', dialCode: '+33', flag: '🇫🇷', code: 'FR' },
  { name: 'Georgia', dialCode: '+995', flag: '🇬🇪', code: 'GE' },
  { name: 'Germany', dialCode: '+49', flag: '🇩🇪', code: 'DE' },
  { name: 'Ghana', dialCode: '+233', flag: '🇬🇭', code: 'GH' },
  { name: 'Greece', dialCode: '+30', flag: '🇬🇷', code: 'GR' },
  { name: 'Guatemala', dialCode: '+502', flag: '🇬🇹', code: 'GT' },
  { name: 'Hungary', dialCode: '+36', flag: '🇭🇺', code: 'HU' },
  { name: 'India', dialCode: '+91', flag: '🇮🇳', code: 'IN' },
  { name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', code: 'ID' },
  { name: 'Iran', dialCode: '+98', flag: '🇮🇷', code: 'IR' },
  { name: 'Iraq', dialCode: '+964', flag: '🇮🇶', code: 'IQ' },
  { name: 'Ireland', dialCode: '+353', flag: '🇮🇪', code: 'IE' },
  { name: 'Israel', dialCode: '+972', flag: '🇮🇱', code: 'IL' },
  { name: 'Italy', dialCode: '+39', flag: '🇮🇹', code: 'IT' },
  { name: 'Japan', dialCode: '+81', flag: '🇯🇵', code: 'JP' },
  { name: 'Jordan', dialCode: '+962', flag: '🇯🇴', code: 'JO' },
  { name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', code: 'KZ' },
  { name: 'Kenya', dialCode: '+254', flag: '🇰🇪', code: 'KE' },
  { name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', code: 'KW' },
  { name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬', code: 'KG' },
  { name: 'Latvia', dialCode: '+371', flag: '🇱🇻', code: 'LV' },
  { name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', code: 'LB' },
  { name: 'Libya', dialCode: '+218', flag: '🇱🇾', code: 'LY' },
  { name: 'Lithuania', dialCode: '+370', flag: '🇱🇹', code: 'LT' },
  { name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺', code: 'LU' },
  { name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', code: 'MY' },
  { name: 'Maldives', dialCode: '+960', flag: '🇲🇻', code: 'MV' },
  { name: 'Malta', dialCode: '+356', flag: '🇲🇹', code: 'MT' },
  { name: 'Mexico', dialCode: '+52', flag: '🇲🇽', code: 'MX' },
  { name: 'Moldova', dialCode: '+373', flag: '🇲🇩', code: 'MD' },
  { name: 'Mongolia', dialCode: '+976', flag: '🇲🇳', code: 'MN' },
  { name: 'Morocco', dialCode: '+212', flag: '🇲🇦', code: 'MA' },
  { name: 'Myanmar', dialCode: '+95', flag: '🇲🇲', code: 'MM' },
  { name: 'Nepal', dialCode: '+977', flag: '🇳🇵', code: 'NP' },
  { name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', code: 'NL' },
  { name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', code: 'NZ' },
  { name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', code: 'NG' },
  { name: 'Norway', dialCode: '+47', flag: '🇳🇴', code: 'NO' },
  { name: 'Oman', dialCode: '+968', flag: '🇴🇲', code: 'OM' },
  { name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', code: 'PK' },
  { name: 'Palestine', dialCode: '+970', flag: '🇵🇸', code: 'PS' },
  { name: 'Peru', dialCode: '+51', flag: '🇵🇪', code: 'PE' },
  { name: 'Philippines', dialCode: '+63', flag: '🇵🇭', code: 'PH' },
  { name: 'Poland', dialCode: '+48', flag: '🇵🇱', code: 'PL' },
  { name: 'Portugal', dialCode: '+351', flag: '🇵🇹', code: 'PT' },
  { name: 'Qatar', dialCode: '+974', flag: '🇶🇦', code: 'QA' },
  { name: 'Romania', dialCode: '+40', flag: '🇷🇴', code: 'RO' },
  { name: 'Russia', dialCode: '+7', flag: '🇷🇺', code: 'RU' },
  { name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', code: 'SA' },
  { name: 'Senegal', dialCode: '+221', flag: '🇸🇳', code: 'SN' },
  { name: 'Serbia', dialCode: '+381', flag: '🇷🇸', code: 'RS' },
  { name: 'Singapore', dialCode: '+65', flag: '🇸🇬', code: 'SG' },
  { name: 'Slovakia', dialCode: '+421', flag: '🇸🇰', code: 'SK' },
  { name: 'Slovenia', dialCode: '+386', flag: '🇸🇮', code: 'SI' },
  { name: 'Somalia', dialCode: '+252', flag: '🇸🇴', code: 'SO' },
  { name: 'South Africa', dialCode: '+27', flag: '🇿🇦', code: 'ZA' },
  { name: 'South Korea', dialCode: '+82', flag: '🇰🇷', code: 'KR' },
  { name: 'Spain', dialCode: '+34', flag: '🇪🇸', code: 'ES' },
  { name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', code: 'LK' },
  { name: 'Sudan', dialCode: '+249', flag: '🇸🇩', code: 'SD' },
  { name: 'Sweden', dialCode: '+46', flag: '🇸🇪', code: 'SE' },
  { name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', code: 'CH' },
  { name: 'Syria', dialCode: '+963', flag: '🇸🇾', code: 'SY' },
  { name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', code: 'TW' },
  { name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯', code: 'TJ' },
  { name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', code: 'TZ' },
  { name: 'Thailand', dialCode: '+66', flag: '🇹🇭', code: 'TH' },
  { name: 'Tunisia', dialCode: '+216', flag: '🇹🇳', code: 'TN' },
  { name: 'Turkey', dialCode: '+90', flag: '🇹🇷', code: 'TR' },
  { name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲', code: 'TM' },
  { name: 'Uganda', dialCode: '+256', flag: '🇺🇬', code: 'UG' },
  { name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', code: 'UA' },
  { name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', code: 'AE' },
  { name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', code: 'GB' },
  { name: 'United States', dialCode: '+1', flag: '🇺🇸', code: 'US' },
  { name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿', code: 'UZ' },
  { name: 'Venezuela', dialCode: '+58', flag: '🇻🇪', code: 'VE' },
  { name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', code: 'VN' },
  { name: 'Yemen', dialCode: '+967', flag: '🇾🇪', code: 'YE' },
  { name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', code: 'ZW' },
]

const DEFAULT_COUNTRY = COUNTRIES.find(c => c.code === 'IN')!

const FlagIcon = ({ code }: { code: string }) => (
  <img
    src={`/flags/${code.toLowerCase()}.svg`}
    alt={code}
    className='h-4 w-6 object-cover'
    loading='lazy'
  />
)

// ─────────────────────────────────────────────────────────
//  Helpers to split / merge country-code + local number
// ─────────────────────────────────────────────────────────
function splitPhoneValue(value: string): { country: Country; local: string } {
  if (!value) return { country: DEFAULT_COUNTRY, local: '' }

  // Find the longest matching dial code first (greedy)
  const sorted = [...COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )
  for (const c of sorted) {
    if (value.startsWith(c.dialCode)) {
      const local = value.slice(c.dialCode.length).trimStart()
      return { country: c, local }
    }
  }
  return { country: DEFAULT_COUNTRY, local: value }
}

// ─────────────────────────────────────────────────────────
//  PhoneInput component
// ─────────────────────────────────────────────────────────
interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  hasError?: boolean
  placeholder?: string
  id?: string
  className?: string
}

const PhoneInput = ({
  value = '',
  onChange,
  onBlur,
  disabled = false,
  hasError = false,
  placeholder = '1234567890',
  id,
  className,
}: PhoneInputProps) => {
  const { country: initialCountry, local: initialLocal } =
    splitPhoneValue(value)
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(initialCountry)
  const [localNumber, setLocalNumber] = useState<string>(initialLocal)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync external value changes (e.g., react-hook-form reset)
  useEffect(() => {
    const { country, local } = splitPhoneValue(value)
    setSelectedCountry(country)
    setLocalNumber(local)
  }, [value])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50)
    } else {
      setSearch('')
    }
  }, [open])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setOpen(false)
    const full = localNumber
      ? `${country.dialCode}${localNumber}`
      : country.dialCode
    onChange?.(full)
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const local = e.target.value
    setLocalNumber(local)
    const full = local
      ? `${selectedCountry.dialCode}${local}`
      : selectedCountry.dialCode
    onChange?.(full)
  }

  const filtered = COUNTRIES.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  )

  return (
    <div className={cn('flex', className)} ref={dropdownRef}>
      {/* Country Code Button */}
      <div className='relative'>
        <button
          type='button'
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className={cn(
            'h-9 flex items-center gap-1.5 px-3 rounded-l-md border border-r-0 border-input bg-background',
            'text-sm font-medium transition-colors',
            'hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-red-500',
            open && 'ring-2 ring-ring/50'
          )}
          aria-haspopup='listbox'
          aria-expanded={open}
        >
          <FlagIcon code={selectedCountry.code} />
          <span className='text-muted-foreground'>
            {selectedCountry.dialCode}
          </span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className={cn(
              'absolute left-0 top-full z-[9999] mt-1 w-72 rounded-md border border-border',
              'bg-popover shadow-md overflow-hidden'
            )}
            role='listbox'
          >
            {/* Search */}
            <div className='flex items-center border-b border-border px-3 py-2 gap-2'>
              <Search className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
              <input
                ref={searchRef}
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search country...'
                className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
              />
            </div>

            {/* Country List */}
            <div className='max-h-60 overflow-y-auto'>
              {filtered.length === 0 ? (
                <div className='py-4 text-center text-sm text-muted-foreground'>
                  No country found
                </div>
              ) : (
                filtered.map(country => (
                  <button
                    key={country.code}
                    type='button'
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-sm text-left',
                      'hover:bg-muted/80 transition-colors',
                      selectedCountry.code === country.code &&
                        'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <FlagIcon code={country.code} />
                    <span className='flex-1 truncate'>{country.name}</span>
                    <span className='text-muted-foreground text-xs shrink-0'>
                      {country.dialCode}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <Input
        id={id}
        type='number'
        value={localNumber}
        onChange={handleLocalChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'rounded-l-none border-l-0 flex-1',
          'focus-visible:ring-offset-0',
          hasError && 'border-red-500 bg-red-50/10'
        )}
      />
    </div>
  )
}

export default PhoneInput
