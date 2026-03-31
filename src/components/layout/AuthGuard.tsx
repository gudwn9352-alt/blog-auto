'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { onAuthChange, signInWithGoogle } from '@/lib/firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [setUser, setLoading])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              블로그 원고 이미지 생성 시스템
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => signInWithGoogle()} size="lg">
              Google로 로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
