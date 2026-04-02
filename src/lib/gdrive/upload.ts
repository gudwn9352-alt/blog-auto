import { getDriveClient } from './auth'
import { Readable } from 'stream'
import { readFileSync } from 'fs'

const BLOG_AUTO_FOLDER_ID = '1K9nRjLmFovihlzn7DvN8GmQKw2FOBNIA'
const BACKUP_FOLDER_ID = '110lu5rtfruDujw3uuCCdOXdRiBK2oT7J'

// 파일 업로드 (덮어쓰기 지원)
export async function uploadFile(
  fileName: string,
  content: Buffer | string,
  mimeType: string,
  folderId: string = BLOG_AUTO_FOLDER_ID,
): Promise<string> {
  const drive = getDriveClient()

  // 기존 파일 찾기 (같은 이름이면 덮어쓰기)
  const existing = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  })

  const fileContent = typeof content === 'string' ? Buffer.from(content, 'utf8') : content

  if (existing.data.files && existing.data.files.length > 0) {
    // 덮어쓰기
    const fileId = existing.data.files[0].id!
    await drive.files.update({
      fileId,
      media: { mimeType, body: Readable.from(fileContent) },
    })
    return fileId
  } else {
    // 새로 생성
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: Readable.from(fileContent) },
      fields: 'id',
    })
    return res.data.id!
  }
}

// 로컬 파일을 구글 드라이브에 업로드
export async function uploadLocalFile(
  localPath: string,
  fileName: string,
  mimeType: string,
  folderId: string = BLOG_AUTO_FOLDER_ID,
): Promise<string> {
  const content = readFileSync(localPath)
  return uploadFile(fileName, content, mimeType, folderId)
}

// 백업 폴더에 업로드
export async function uploadBackup(
  fileName: string,
  content: Buffer,
  mimeType: string = 'application/zip',
): Promise<string> {
  return uploadFile(fileName, content, mimeType, BACKUP_FOLDER_ID)
}

// blog_auto 폴더에 여러 파일 업로드
export async function uploadMultipleFiles(
  files: Array<{ name: string; content: Buffer | string; mimeType: string }>,
): Promise<Array<{ name: string; id: string; success: boolean }>> {
  const results = []
  for (const file of files) {
    try {
      const id = await uploadFile(file.name, file.content, file.mimeType)
      results.push({ name: file.name, id, success: true })
    } catch (e) {
      console.error(`[GDrive upload failed] ${file.name}:`, e)
      results.push({ name: file.name, id: '', success: false })
    }
  }
  return results
}

export { BLOG_AUTO_FOLDER_ID, BACKUP_FOLDER_ID }
