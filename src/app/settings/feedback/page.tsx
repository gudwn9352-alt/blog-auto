'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { getRejectionLogs } from '@/lib/firebase/rejection-logs'
import type { RejectionLog } from '@/lib/firebase/rejection-logs'
import { useBrandStore } from '@/stores/brandStore'
import { PageHeader } from '@/components/layout/PageHeader'

const TYPE_LABELS: Record<string, string> = {
  step1: 'STEP1 자동검수',
  step2: 'STEP2 자동검수',
  user: '사용자 반려',
}

const TYPE_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  step1: 'secondary',
  step2: 'default',
  user: 'destructive',
}

export default function FeedbackPage() {
  const [logs, setLogs] = useState<RejectionLog[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedBrand } = useBrandStore()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const data = await getRejectionLogs(selectedBrand?.id)
        setLogs(data)
      } catch {
        console.error('반려 로그를 불러오지 못했습니다')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBrand?.id])

  const stats = useMemo(() => {
    const total = logs.length
    const step1Count = logs.filter((l) => l.type === 'step1').length
    const step2Count = logs.filter((l) => l.type === 'step2').length
    const userCount = logs.filter((l) => l.type === 'user').length
    const appliedCount = logs.filter((l) => l.feedbackApplied).length

    // 가장 빈번한 반려 사유 Top 5
    const reasonMap = new Map<string, number>()
    logs.forEach((log) => {
      const key = log.reason || '(사유 없음)'
      reasonMap.set(key, (reasonMap.get(key) ?? 0) + 1)
    })
    const topReasons = Array.from(reasonMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      total,
      step1Count,
      step2Count,
      userCount,
      appliedCount,
      step1Ratio: total > 0 ? ((step1Count / total) * 100).toFixed(1) : '0',
      step2Ratio: total > 0 ? ((step2Count / total) * 100).toFixed(1) : '0',
      userRatio: total > 0 ? ((userCount / total) * 100).toFixed(1) : '0',
      topReasons,
    }
  }, [logs])

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="반려 피드백 관리"
        description="원고 반려 로그와 피드백 적용 현황을 확인합니다"
        backHref="/settings/manage"
      />

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : (
        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="logs">반려 로그 ({logs.length})</TabsTrigger>
          </TabsList>

          {/* 통계 탭 */}
          <TabsContent value="stats" className="space-y-4">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-gray-500">총 반려 수</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.step1Count}</p>
                  <p className="text-xs text-gray-500">STEP1 반려 ({stats.step1Ratio}%)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.step2Count}</p>
                  <p className="text-xs text-gray-500">STEP2 반려 ({stats.step2Ratio}%)</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.userCount}</p>
                  <p className="text-xs text-gray-500">사용자 반려 ({stats.userRatio}%)</p>
                </CardContent>
              </Card>
            </div>

            {/* 피드백 적용률 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">피드백 적용률</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{
                        width: `${stats.total > 0 ? (stats.appliedCount / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 shrink-0">
                    {stats.appliedCount}/{stats.total}건 적용됨
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Top 5 반려 사유 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">빈번한 반려 사유 Top 5</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topReasons.length === 0 ? (
                  <p className="text-xs text-gray-400">반려 기록이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {stats.topReasons.map(([reason, count], idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs w-6 justify-center">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm text-gray-700">{reason}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}회
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 로그 탭 */}
          <TabsContent value="logs" className="space-y-3">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-gray-400">반려 로그가 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={TYPE_COLORS[log.type] ?? 'outline'}>
                          {TYPE_LABELS[log.type] ?? log.type}
                        </Badge>
                        {log.feedbackApplied ? (
                          <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                            피드백 적용됨
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 text-xs">
                            미적용
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{log.reason}</p>
                    {log.issues && log.issues.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="space-y-1">
                          {log.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <Badge variant="outline" className="text-xs shrink-0">
                                {issue.type}
                              </Badge>
                              <span className="text-gray-600">{issue.detail}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
