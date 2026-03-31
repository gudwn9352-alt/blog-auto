import {
  collection,
  addDoc,
  getDocs,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/client'

export interface RejectionLog {
  id?: string
  manuscriptId: string
  brandId: string
  reason: string
  type: 'step1' | 'step2' | 'user'
  issues: Array<{ type: string; detail: string }>
  feedbackApplied: boolean
  createdAt: string
}

const COLLECTION = 'rejection_logs'

export async function getRejectionLogs(brandId?: string): Promise<RejectionLog[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, COLLECTION))
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RejectionLog))

  if (brandId) {
    results = results.filter((log) => log.brandId === brandId)
  }

  // createdAt 내림차순 정렬
  results.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return results
}

export async function createRejectionLog(
  data: Omit<RejectionLog, 'id'>,
): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: new Date().toISOString(),
  })
  return ref.id
}
