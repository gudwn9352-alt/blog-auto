import { getDriveClient } from './auth'
import { Readable } from 'stream'
import { readFileSync } from 'fs'

const BLOG_AUTO_FOLDER_ID = process.env.GDRIVE_MAIN_FOLDER_ID ?? ''
const BACKUP_FOLDER_ID = process.env.GDRIVE_BACKUP_FOLDER_ID ?? ''

export async function uploadFile(
  fileName: string,
  content: Buffer | string,
  mimeType: string,
  folderId: string = BLOG_AUTO_FOLDER_ID,
): Promise<string> {
  const drive = getDriveClient()
  const existing = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  })
  const fileContent = typeof content === 'string' ? Buffer.from(content, 'utf8') : content

  if (existing.data.files && existing.data.files.length > 0) {
    const fileId = existing.data.files[0].id!
    await drive.files.update({ fileId, media: { mimeType, body: Readable.from(fileContent) } })
    return fileId
  } else {
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media: { mimeType, body: Readable.from(fileContent) },
      fields: 'id',
    })
    return res.data.id!
  }
}

export async function uploadLocalFile(localPath: string, fileName: string, mimeType: string, folderId: string = BLOG_AUTO_FOLDER_ID): Promise<string> {
  return uploadFile(fileName, readFileSync(localPath), mimeType, folderId)
}

export async function uploadBackup(fileName: string, content: Buffer, mimeType: string = 'application/zip'): Promise<string> {
  return uploadFile(fileName, content, mimeType, BACKUP_FOLDER_ID)
}

export { BLOG_AUTO_FOLDER_ID, BACKUP_FOLDER_ID }
