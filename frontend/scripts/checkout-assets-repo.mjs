import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const repository = process.env.DIESW_ASSETS_REPOSITORY || 'dieWehmut/diesw-assets'
const token = process.env.DIESW_ASSETS_TOKEN || ''
const targetRef = process.env.DIESW_ASSETS_REF || 'main'
const destination = path.resolve(rootDir, process.env.DIESW_ASSETS_DIR || '.cache/diesw-assets')
const remoteUrl = `https://github.com/${repository}.git`
const gitEnv = createGitEnv()

function fail(message) {
  console.error(message)
  process.exit(1)
}

function createGitEnv() {
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
  }

  for (const key of Object.keys(env)) {
    if (/^GIT_CONFIG_(?:COUNT|KEY_\d+|VALUE_\d+)$/.test(key)) {
      delete env[key]
    }
  }

  if (!token) return env

  const encoded = Buffer.from(`x-access-token:${token}`).toString('base64')

  return {
    ...env,
    GIT_CONFIG_COUNT: '1',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${encoded}`,
  }
}

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd || rootDir,
    env: gitEnv,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  })

  if (result.status !== 0 && !options.allowFailure) {
    if (options.capture && result.stderr) console.error(result.stderr.trim())
    fail(`git ${args.join(' ')} failed`)
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
  }
}

function isWithin(parentPath, childPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

if (!/^[^/]+\/[^/]+$/.test(repository)) {
  fail(`DIESW_ASSETS_REPOSITORY must be in owner/repo format: ${repository}`)
}

const workspaceRoot = path.dirname(rootDir)
if (!isWithin(workspaceRoot, destination)) {
  fail(`Refusing to checkout assets outside the workspace: ${destination}`)
}

fs.rmSync(destination, { recursive: true, force: true })

const checkout = runGit(['clone', '--depth', '1', '--branch', targetRef, remoteUrl, destination], {
  allowFailure: true,
})

if (!checkout.ok) {
  const tokenHint = token
    ? `Check that DIESW_ASSETS_TOKEN can read ${repository}.`
    : `If ${repository} is private, set DIESW_ASSETS_TOKEN with read access.`
  fail(`Could not checkout ${repository}@${targetRef}. ${tokenHint}`)
}

runGit(['config', '--global', '--add', 'safe.directory', destination], {
  allowFailure: true,
})

console.log(`Checked out ${repository}@${targetRef} to ${destination}.`)
