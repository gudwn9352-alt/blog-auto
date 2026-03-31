'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useBrandStore } from '@/stores/brandStore'

const navGroups = [
  {
    label: '작업',
    items: [
      { href: '/dashboard', label: '대시보드', icon: '🏠' },
      { href: '/generate', label: '원고 생성', icon: '✍️' },
      { href: '/manuscripts', label: '원고 목록', icon: '📄' },
      { href: '/reports', label: '보고서', icon: '📊' },
    ],
  },
  {
    label: '설정',
    items: [
      { href: '/settings/brand', label: '브랜드', icon: '🏢' },
      { href: '/settings/rules', label: '검수 규칙', icon: '📋' },
      { href: '/settings/fact-rules', label: '팩트 룰', icon: '🔍' },
      { href: '/settings/feedback', label: '반려 피드백', icon: '📝' },
      { href: '/settings/manage', label: '전체 관리', icon: '⚙️' },
    ],
  },
  {
    label: '도움말',
    items: [
      { href: '/relations', label: '관계성 보기', icon: '🔗' },
      { href: '/guide', label: '이용 방법', icon: '📖' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBrand, clearBrand } = useBrandStore()

  function handleChangeBrand() {
    clearBrand()
    router.push('/')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0 h-screen shadow-sm">
      {/* 브랜드 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {selectedBrand?.logoUrl ? (
            <img src={selectedBrand.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {selectedBrand?.name?.charAt(0) ?? 'B'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              {selectedBrand?.name ?? '브랜드'}
            </h1>
            <button
              onClick={handleChangeBrand}
              className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
            >
              브랜드 변경
            </button>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-[13px] transition-all',
                  pathname.startsWith(item.href)
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-300 text-center">v2.0</p>
      </div>
    </aside>
  )
}
