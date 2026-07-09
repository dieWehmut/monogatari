import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const docsDir = path.join(rootDir, 'src', 'data', 'docs')
const manifestPath = path.join(rootDir, 'src', 'data', 'capture', 'manifest.json')
const generatedPath = path.join(rootDir, 'src', 'data', 'capture', 'generated.ts')
const publicCaptureDir = path.join(rootDir, 'public', 'capture-assets')
const publicDocsDir = path.join(publicCaptureDir, 'docs')
const publicStandaloneDir = path.join(publicCaptureDir, 'standalone')
const publicLocalDir = path.join(publicCaptureDir, 'local')
const captureUrlPrefix = '/capture-assets/'
const preservedAssetPrefixes = [`${captureUrlPrefix}standalone/`, `${captureUrlPrefix}local/`]

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function emptyDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true })
  ensureDir(dirPath)
}

function resolveAssetsDir() {
  const envPath = process.env.DIESW_ASSETS_DIR?.trim()
  if (envPath) return path.resolve(rootDir, envPath)
  const candidates = [
    path.resolve(rootDir, '..', 'diesw-assets'),
    path.resolve(rootDir, '..', '..', 'diesw-assets'),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0]
}

function getMarkdownFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '')
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const data = {}
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const index = trimmed.indexOf(':')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = stripQuotes(trimmed.slice(index + 1).trim())
    if (key) data[key] = value
  }
  return { data, content: match[2] || '' }
}

function parseTags(raw) {
  if (!raw) return []
  const value = raw.trim()
  if (!value) return []
  const normalized = value.startsWith('[') && value.endsWith(']')
    ? value.slice(1, -1)
    : value
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function docIdFromPath(filePath) {
  return path.basename(filePath, path.extname(filePath))
}

function normalizeDocAssetUrl(docFilePath, assetPath) {
  if (!assetPath || /^(?:[a-z]+:)?\/\//i.test(assetPath) || assetPath.startsWith('data:')) return assetPath
  if (assetPath.startsWith(captureUrlPrefix)) return assetPath

  const docsRelativeDir = path.dirname(path.relative(docsDir, docFilePath))
  const resolved = path.normalize(path.join(docsRelativeDir, assetPath))
  return `${captureUrlPrefix}docs/${toPosix(resolved)}`
}

function captureAssetRelativePath(src) {
  return src.slice(captureUrlPrefix.length)
}

function parseImages(docFilePath, content) {
  const images = []
  const markdownPattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  const htmlPattern = /<img\b[^>]*src=['"]([^'"]+)['"][^>]*alt=['"]([^'"]*)['"][^>]*>|<img\b[^>]*alt=['"]([^'"]*)['"][^>]*src=['"]([^'"]+)['"][^>]*>/gi

  let match
  while ((match = markdownPattern.exec(content)) !== null) {
    const src = normalizeDocAssetUrl(docFilePath, match[2].trim())
    images.push({
      src,
      alt: match[1].trim(),
    })
  }

  while ((match = htmlPattern.exec(content)) !== null) {
    const rawSrc = (match[1] || match[4] || '').trim()
    const alt = (match[2] || match[3] || '').trim()
    if (!rawSrc) continue
    images.push({
      src: normalizeDocAssetUrl(docFilePath, rawSrc),
      alt,
    })
  }

  return images
}

function isCaptureAssetUrl(src) {
  return src.startsWith(captureUrlPrefix)
}

function sortByDateDesc(items) {
  return items.slice().sort((a, b) => {
    const aTime = getSortTimestamp(a.date)
    const bTime = getSortTimestamp(b.date)
    return bTime - aTime || (a.title || '').localeCompare(b.title || '')
  })
}

function getSortTimestamp(date) {
  if (!date) return 0
  const normalized = String(date).replace(/\//g, '-')
  const rangeMatch = normalized.match(/^\s*(\d{4}-\d{2}-\d{2})(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/)
  if (rangeMatch) return Date.parse(rangeMatch[1]) || 0
  return Date.parse(date) || 0
}

function loadManifest() {
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : []
}

function loadExistingCaptureAssets() {
  if (!fs.existsSync(generatedPath)) return []
  const raw = fs.readFileSync(generatedPath, 'utf8')
  const match = raw.match(/export const generatedCaptureAssets: CaptureAsset\[\] = ([\s\S]*?) as CaptureAsset\[\]/)
  if (!match) return []
  try {
    const data = JSON.parse(match[1])
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function isPreservedCaptureAsset(asset) {
  const image = String(asset?.image || '')
  return preservedAssetPrefixes.some((prefix) => image.startsWith(prefix))
}

function preservedCaptureAssetSourcePath(assetsDir, asset) {
  const image = String(asset?.image || '')
  if (!image.startsWith(captureUrlPrefix)) return true
  const relativePath = captureAssetRelativePath(image)
  const publicPath = path.join(publicCaptureDir, relativePath)
  if (fs.existsSync(publicPath)) return publicPath

  const assetsPath = path.join(assetsDir, relativePath)
  if (fs.existsSync(assetsPath)) return assetsPath

  return ''
}

function normalizeExistingCaptureAsset(asset) {
  return {
    id: String(asset.id || asset.image || '').trim(),
    image: String(asset.image || '').trim(),
    title: String(asset.title || '').trim(),
    date: String(asset.date || '').trim(),
    tags: Array.isArray(asset.tags) ? asset.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
    summary: String(asset.summary || '').trim(),
    sourceRefs: Array.isArray(asset.sourceRefs) ? asset.sourceRefs : [],
    standalone: asset.standalone !== false,
  }
}

function syncPreservedCaptureAsset(asset, sourcePath) {
  const image = String(asset?.image || '')
  if (!image.startsWith(captureUrlPrefix) || typeof sourcePath !== 'string') return
  const relativePath = captureAssetRelativePath(image)
  const destinationPath = path.join(publicCaptureDir, relativePath)
  if (path.resolve(sourcePath) === path.resolve(destinationPath)) return
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function assertFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`)
  }
}

function syncDocAsset(assetsDir, docFilePath, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const docRelativePath = relativeAssetPath.replace(/^docs\//, '')
  const localSourcePath = path.join(docsDir, docRelativePath)
  const assetsSourcePath = path.join(assetsDir, 'docs', docRelativePath)
  const sourcePath = fs.existsSync(localSourcePath) ? localSourcePath : assetsSourcePath
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  assertFileExists(sourcePath, 'Markdown image')
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function copyStandaloneAsset(assetsDir, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const standaloneRelative = relativeAssetPath.replace(/^standalone\//, '')
  const sourcePath = path.join(assetsDir, 'standalone', standaloneRelative)
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  assertFileExists(sourcePath, 'Standalone asset')
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function toTsModule(data) {
  const serialized = JSON.stringify(data, null, 2)
  return `import type { CaptureAsset } from '../../types/capture'\n\nexport const generatedCaptureAssets: CaptureAsset[] = ${serialized} as CaptureAsset[]\n\nexport default generatedCaptureAssets\n`
}

function titleFromStandalonePath(relativePath) {
  const parts = toPosix(relativePath).split('/')
  const yearMonth = parts[0] || ''
  const groupId = parts[1] || ''
  const fileName = path.basename(relativePath, path.extname(relativePath))
  return [yearMonth, groupId, fileName].filter(Boolean).join(' ')
}

function dateFromStandalonePath(relativePath) {
  const match = toPosix(relativePath).match(/^(\d{4})-(\d{2})\//)
  return match ? `${match[1]}-${match[2]}-01` : ''
}

function titleFromDocsPath(relativePath) {
  const parts = toPosix(relativePath).split('/')
  const fileName = path.basename(relativePath, path.extname(relativePath))
  const folder = parts.slice(0, -1).join('/')
  return [folder, fileName].filter(Boolean).join(' / ')
}

function docsGroupTagFromPath(relativePath) {
  return toPosix(relativePath).split('/')[0] || 'docs'
}

function loadDocAssetsFromRepository(assetsDir) {
  const repoDocsDir = path.join(assetsDir, 'docs')
  if (!fs.existsSync(repoDocsDir)) return []
  const assets = []

  function walk(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      if (!/\.(?:avif|gif|jpe?g|png|webp|svg)$/i.test(entry.name)) continue

      const relativePath = toPosix(path.relative(repoDocsDir, fullPath))
      const id = `docs-${relativePath.replace(/\.[^.]+$/i, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
      assets.push({
        id,
        image: `${captureUrlPrefix}docs/${relativePath}`,
        title: titleFromDocsPath(relativePath),
        date: '',
        tags: [docsGroupTagFromPath(relativePath)],
        summary: '',
        sourceRefs: [],
        standalone: true,
      })
    }
  }

  walk(repoDocsDir)
  return assets
}

function copyDocRepositoryAsset(assetsDir, imageUrl) {
  const relativeAssetPath = captureAssetRelativePath(imageUrl)
  const docRelativePath = relativeAssetPath.replace(/^docs\//, '')
  const sourcePath = path.join(assetsDir, 'docs', docRelativePath)
  const destinationPath = path.join(publicCaptureDir, relativeAssetPath)
  assertFileExists(sourcePath, 'Docs asset')
  ensureDir(path.dirname(destinationPath))
  fs.copyFileSync(sourcePath, destinationPath)
}

function loadStandaloneAssetsFromRepository(assetsDir) {
  const standaloneDir = path.join(assetsDir, 'standalone')
  if (!fs.existsSync(standaloneDir)) return []
  const assets = []

  function walk(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(entry.name)) continue

      const relativePath = path.relative(standaloneDir, fullPath)
      const normalizedRelative = toPosix(relativePath)
      const id = `standalone-${normalizedRelative.replace(/\.[^.]+$/i, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
      assets.push({
        id,
        image: `${captureUrlPrefix}standalone/${normalizedRelative}`,
        title: titleFromStandalonePath(normalizedRelative),
        date: dateFromStandalonePath(normalizedRelative),
        tags: [],
        summary: '',
        sourceRefs: [],
        standalone: true,
      })
    }
  }

  walk(standaloneDir)
  return assets
}

async function main() {
  const assetsDir = resolveAssetsDir()
  const manifestEntries = loadManifest()
  const manifestByUrl = new Map()

  for (const entry of manifestEntries) {
    const image = String(entry.image || '').trim()
    if (!image) continue
    if (!isCaptureAssetUrl(image)) {
      throw new Error(`Manifest image must use ${captureUrlPrefix}: ${image}`)
    }
    manifestByUrl.set(image, entry)
  }

  ensureDir(publicCaptureDir)
  emptyDir(publicDocsDir)
  ensureDir(publicStandaloneDir)
  ensureDir(publicLocalDir)

  const byImage = new Map()
  const markdownFiles = getMarkdownFiles(docsDir)

  for (const asset of loadStandaloneAssetsFromRepository(assetsDir)) {
    byImage.set(asset.image, asset)
    copyStandaloneAsset(assetsDir, asset.image)
  }

  for (const asset of loadDocAssetsFromRepository(assetsDir)) {
    byImage.set(asset.image, asset)
    copyDocRepositoryAsset(assetsDir, asset.image)
  }

  for (const asset of loadExistingCaptureAssets()) {
    if (!isPreservedCaptureAsset(asset)) continue
    const sourcePath = preservedCaptureAssetSourcePath(assetsDir, asset)
    if (!sourcePath) continue
    const normalized = normalizeExistingCaptureAsset(asset)
    if (normalized.image) byImage.set(normalized.image, normalized)
    syncPreservedCaptureAsset(normalized, sourcePath)
  }

  for (const filePath of markdownFiles) {
    const raw = fs.readFileSync(filePath, 'utf8')
    const { data, content } = parseFrontmatter(raw)
    const type = data.type === 'note' || toPosix(filePath).includes('/notes/') ? 'note' : 'post'
    const id = data.id || docIdFromPath(filePath)
    const title = data.title || id
    const date = data.date || ''
    const tags = parseTags(data.tags)
    const url = `/${type}/${id}`
    const seenInDoc = new Set()

    for (const image of parseImages(filePath, content)) {
      if (!isCaptureAssetUrl(image.src)) continue
      if (seenInDoc.has(image.src)) continue
      seenInDoc.add(image.src)

      const relativePath = captureAssetRelativePath(image.src)
      if (!relativePath.startsWith('docs/')) continue

      const manifestEntry = manifestByUrl.get(image.src)
      if (manifestEntry?.hidden) continue

      const existing = byImage.get(image.src) || {
        id: manifestEntry?.id || relativePath.replace(/[\\/]/g, '-').replace(/\.[^.]+$/i, ''),
        image: image.src,
        title: manifestEntry?.title || image.alt || '',
        date: manifestEntry?.date || date,
        tags: manifestEntry?.tags?.length ? [...manifestEntry.tags] : [...tags],
        summary: manifestEntry?.summary || '',
        sourceRefs: [],
        standalone: false,
      }

      existing.title = manifestEntry?.title || existing.title || image.alt || ''
      existing.date = manifestEntry?.date || existing.date || date
      existing.tags = manifestEntry?.tags?.length ? [...manifestEntry.tags] : existing.tags
      existing.summary = manifestEntry?.summary || existing.summary
      existing.standalone = false

      if (!existing.sourceRefs.some((item) => item.type === type && item.id === id)) {
        existing.sourceRefs.push({ type, id, title, url })
      }

      byImage.set(image.src, existing)
      syncDocAsset(assetsDir, filePath, image.src)
    }
  }

  const needsStandaloneAssets = manifestEntries.some((entry) => !entry.hidden && String(entry.image || '').trim())
  if (needsStandaloneAssets) {
    assertFileExists(assetsDir, 'Assets directory')
  }

  for (const entry of manifestEntries) {
    if (entry.hidden) continue
    const image = String(entry.image || '').trim()
    if (!image) continue
    const relativePath = captureAssetRelativePath(image)
    const existing = byImage.get(image)

    if (relativePath.startsWith('standalone/')) {
      copyStandaloneAsset(assetsDir, image)
    }

    if (existing) {
      existing.id = entry.id || existing.id
      existing.title = entry.title || existing.title
      existing.date = entry.date || existing.date
      existing.tags = entry.tags?.length ? [...entry.tags] : existing.tags
      existing.summary = entry.summary || existing.summary
      existing.standalone = Boolean(entry.standalone) && existing.sourceRefs.length === 0
      byImage.set(image, existing)
      continue
    }

    byImage.set(image, {
      id: entry.id,
      image,
      title: entry.title,
      date: entry.date,
      tags: entry.tags || [],
      summary: entry.summary || '',
      sourceRefs: [],
      standalone: entry.standalone !== false,
    })
  }

  const captureAssets = sortByDateDesc(Array.from(byImage.values())).map((asset) => ({
    ...asset,
    tags: Array.from(new Set(asset.tags || [])),
    sourceRefs: asset.sourceRefs.slice().sort((a, b) => a.title.localeCompare(b.title)),
    standalone: asset.sourceRefs.length === 0 ? asset.standalone !== false : false,
  }))

  fs.writeFileSync(generatedPath, toTsModule(captureAssets), 'utf8')
  console.log(`Generated ${captureAssets.length} capture assets from ${markdownFiles.length} markdown files.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
