import { initializeApp, getApps } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getApp() {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

function getStorageInstance() {
  return getStorage(getApp())
}

/** Base64 data URL → Firebase Storage 업로드 → 다운로드 URL 반환 */
export async function uploadImage(
  manuscriptId: string,
  imageIndex: number,
  dataUrl: string,
): Promise<string> {
  const storage = getStorageInstance()

  // data:image/png;base64,xxxxx → Uint8Array
  const base64 = dataUrl.split(',')[1]
  const mimeMatch = dataUrl.match(/data:(image\/\w+);/)
  const mimeType = mimeMatch?.[1] ?? 'image/png'
  const ext = mimeType.split('/')[1] ?? 'png'

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

  const path = `manuscripts/${manuscriptId}/image_${imageIndex}.${ext}`
  const storageRef = ref(storage, path)

  await uploadBytes(storageRef, bytes, { contentType: mimeType })
  const url = await getDownloadURL(storageRef)

  return url
}

/** Firebase Storage에서 이미지 삭제 */
export async function deleteImage(
  manuscriptId: string,
  imageIndex: number,
): Promise<void> {
  const storage = getStorageInstance()
  // png와 jpg 모두 시도
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    try {
      const path = `manuscripts/${manuscriptId}/image_${imageIndex}.${ext}`
      const storageRef = ref(storage, path)
      await deleteObject(storageRef)
      return
    } catch {
      // 파일이 없으면 다음 확장자 시도
    }
  }
}
