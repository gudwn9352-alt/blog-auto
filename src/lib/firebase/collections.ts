import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { getDb } from './client'
import type { Brand, Manuscript, UserSettings } from '@/types/manuscript'

// ─── Brands ────────────────────────────────────────────────────────────────

export async function getBrands(): Promise<Brand[]> {
  const db = getDb()
  const snap = await getDocs(collection(db, 'brands'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Brand))
}

export async function getBrand(id: string): Promise<Brand | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'brands', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Brand
}

export async function createBrand(data: Omit<Brand, 'id'>): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'brands'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return ref.id
}

export async function updateBrand(id: string, data: Partial<Brand>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'brands', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteBrand(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'brands', id))
}

// ─── Manuscripts ────────────────────────────────────────────────────────────

export async function getManuscripts(
  brandId?: string,
  status?: string
): Promise<Manuscript[]> {
  const db = getDb()
  // 복합 인덱스 없이 작동하도록 전체 가져온 후 클라이언트 필터링
  const snap = await getDocs(collection(db, 'manuscripts'))
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Manuscript))

  if (brandId) results = results.filter((m) => m.brandId === brandId)
  if (status) results = results.filter((m) => m.status === status)

  // createdAt 내림차순 정렬
  results.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  return results
}

export async function getManuscript(id: string): Promise<Manuscript | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'manuscripts', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Manuscript
}

export async function createManuscript(data: Omit<Manuscript, 'id'>): Promise<string> {
  const db = getDb()
  const ref = await addDoc(collection(db, 'manuscripts'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  return ref.id
}

export async function updateManuscript(id: string, data: Partial<Manuscript>): Promise<void> {
  const db = getDb()
  await updateDoc(doc(db, 'manuscripts', id), {
    ...data,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteManuscript(id: string): Promise<void> {
  const db = getDb()
  await deleteDoc(doc(db, 'manuscripts', id))
}

// ─── User Settings ──────────────────────────────────────────────────────────

export async function getUserSettings(): Promise<UserSettings> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'user_settings', 'defaults'))
  if (!snap.exists()) return {}
  return snap.data() as UserSettings
}

export async function updateUserSettings(data: Partial<UserSettings>): Promise<void> {
  const db = getDb()
  await setDoc(doc(db, 'user_settings', 'defaults'), data, { merge: true })
}

// ─── Review Rules ────────────────────────────────────────────────────────────

export async function getOpenProhibitions(): Promise<string[]> {
  const db = getDb()
  const snap = await getDoc(doc(db, 'review_rules', 'open_prohibitions'))
  if (!snap.exists()) return []
  return (snap.data()?.items as string[]) ?? []
}

export async function updateOpenProhibitions(items: string[]): Promise<void> {
  const db = getDb()
  await setDoc(doc(db, 'review_rules', 'open_prohibitions'), { items })
}
