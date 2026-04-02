import { NextResponse } from 'next/server'
import { hasToken } from '@/lib/gdrive/auth'
import { uploadFile, BLOG_AUTO_FOLDER_ID, BACKUP_FOLDER_ID } from '@/lib/gdrive/upload'
import { readFileSync } from 'fs'
import { join } from 'path'

// 로컬 파일을 구글 드라이브에 업로드
export async function POST(req: Request) {
  try {
    if (!hasToken()) {
      return NextResponse.json({
        error: 'Google Drive not connected. Visit /api/auth/google first.',
        needAuth: true,
      }, { status: 401 })
    }

    const { action, fileName, content, filePath, isBackup } = await req.json()

    let folderId = isBackup ? BACKUP_FOLDER_ID : BLOG_AUTO_FOLDER_ID

    if (action === 'upload_local') {
      // 로컬 파일 경로에서 읽어서 업로드
      const fullPath = filePath.startsWith('/') || filePath.includes(':')
        ? filePath
        : join(process.cwd(), filePath)
      const fileContent = readFileSync(fullPath)
      const id = await uploadFile(fileName, fileContent, getMimeType(fileName), folderId)
      return NextResponse.json({ success: true, fileId: id })
    }

    if (action === 'upload_content') {
      // 직접 content 업로드
      const buf = Buffer.from(content, 'base64')
      const id = await uploadFile(fileName, buf, getMimeType(fileName), folderId)
      return NextResponse.json({ success: true, fileId: id })
    }

    if (action === 'upload_text') {
      const id = await uploadFile(fileName, content, 'text/plain', folderId)
      return NextResponse.json({ success: true, fileId: id })
    }

    // 기본: 프로젝트 핵심 파일들 일괄 업로드
    if (action === 'sync_all') {
      const projectRoot = process.cwd()
      const files = [
        { name: '실행.bat', path: join(projectRoot, '실행.bat'), mime: 'application/x-bat' },
        { name: '업데이트.bat', path: join(projectRoot, '업데이트.bat'), mime: 'application/x-bat' },
        { name: '.env.local', path: join(projectRoot, '.env.local'), mime: 'text/plain' },
        { name: '시작하기.txt', path: join(projectRoot, '시작하기.txt'), mime: 'text/plain' },
      ]

      const results = []
      for (const f of files) {
        try {
          const content = readFileSync(f.path)
          const id = await uploadFile(f.name, content, f.mime, BLOG_AUTO_FOLDER_ID)
          results.push({ name: f.name, success: true, id })
        } catch (e) {
          results.push({ name: f.name, success: false, error: String(e) })
        }
      }

      // 0.백업 폴더에 날짜별 백업
      try {
        const now = new Date()
        const d = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
        const envContent = readFileSync(join(projectRoot, '.env.local'))
        await uploadFile(`backup_${d}.env.local`, envContent, 'text/plain', BACKUP_FOLDER_ID)
        results.push({ name: `backup_${d}`, success: true, id: 'backup' })
      } catch {}

      return NextResponse.json({ success: true, results })
    }

    if (action === 'backup') {
      const buf = content ? Buffer.from(content, 'base64') : Buffer.from('empty')
      const id = await uploadFile(fileName, buf, getMimeType(fileName), BACKUP_FOLDER_ID)
      return NextResponse.json({ success: true, fileId: id })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: unknown) {
    console.error('[GDrive upload error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

function getMimeType(fileName: string): string {
  if (fileName.endsWith('.bat')) return 'application/x-bat'
  if (fileName.endsWith('.txt')) return 'text/plain'
  if (fileName.endsWith('.md')) return 'text/markdown'
  if (fileName.endsWith('.json')) return 'application/json'
  if (fileName.endsWith('.zip')) return 'application/zip'
  if (fileName.endsWith('.png')) return 'image/png'
  if (fileName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/octet-stream'
}
