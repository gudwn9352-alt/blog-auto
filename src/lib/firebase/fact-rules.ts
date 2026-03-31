import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from 'firebase/firestore'
import { getDb } from '@/lib/firebase/client'
import type { FactRule } from '@/types/manuscript'

// ─── Memo 타입 ──────────────────────────────────────────────────────────────

export interface Memo {
  id?: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Fact Rules ─────────────────────────────────────────────────────────────

export async function getFactRules(): Promise<FactRule[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, 'fact_rules'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FactRule))
}

export async function createFactRule(data: Omit<FactRule, 'id'>): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'fact_rules'), data)
  return ref.id
}

export async function updateFactRule(id: string, data: Partial<FactRule>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'fact_rules', id), { ...data })
}

export async function deleteFactRule(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'fact_rules', id))
}

// ─── Memos ──────────────────────────────────────────────────────────────────

export async function getMemos(): Promise<Memo[]> {
  const db = getDb()
  const snap = await getDocs(
    query(collection(db, 'memos'), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Memo))
}

export async function createMemo(data: Omit<Memo, 'id'>): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'memos'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return ref.id
}

export async function updateMemo(id: string, data: Partial<Memo>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'memos', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteMemo(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'memos', id))
}
