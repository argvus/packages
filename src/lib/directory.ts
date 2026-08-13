import fs from 'node:fs'
import path from 'node:path'

export interface DirectoryEntry {
  name: string
  href: string
  kind: 'directory' | 'file'
  size: string
  modified: string
}

export interface DirectoryIndex {
  displayPath: string
  parentHref: string | null
  entries: DirectoryEntry[]
}

const root = path.resolve(process.cwd(), 'public')

function normalizeRoute(route = '') {
  return route
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/')
}

function formatSize(bytes: number) {
  if (bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return unit === 0 ? `${value} ${units[unit]}` : `${value.toFixed(1)} ${units[unit]}`
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
}

export function listDirectoryRoutes() {
  const routes: string[] = []

  function walk(relativeDir: string) {
    const absoluteDir = path.join(root, relativeDir)
    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const child = path.join(relativeDir, entry.name)
      routes.push(child.split(path.sep).join('/'))
      walk(child)
    }
  }

  walk('')
  return routes
}

export function getDirectoryIndex(route = ''): DirectoryIndex {
  const cleanRoute = normalizeRoute(route)
  const absoluteDir = path.join(root, cleanRoute)
  const realRoot = fs.realpathSync(root)
  const realDir = fs.realpathSync(absoluteDir)

  if (!realDir.startsWith(realRoot)) {
    throw new Error(`Invalid directory route: ${route}`)
  }

  const entries = fs
    .readdirSync(realDir, { withFileTypes: true })
    .filter((entry) => entry.name !== '.gitkeep' && !entry.name.endsWith('.html'))
    .map((entry) => {
      const stat = fs.statSync(path.join(realDir, entry.name))
      const isDirectory = entry.isDirectory()
      return {
        name: `${entry.name}${isDirectory ? '/' : ''}`,
        href: `${entry.name}${isDirectory ? '/' : ''}`,
        kind: isDirectory ? 'directory' : 'file',
        size: isDirectory ? '-' : formatSize(stat.size),
        modified: formatDate(stat.mtime),
      } satisfies DirectoryEntry
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  return {
    displayPath: `/${cleanRoute}${cleanRoute ? '/' : ''}`,
    parentHref: cleanRoute ? '../' : null,
    entries,
  }
}
