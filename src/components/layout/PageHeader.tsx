'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, backHref, children }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-3">
        {backHref && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            onClick={() => router.push(backHref)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {children && <div className="flex gap-2 shrink-0">{children}</div>}
    </div>
  )
}
