import { spawn } from 'node:child_process'
import process from 'node:process'

const command = process.platform === 'win32' ? 'vite.cmd' : 'vite'
const child = spawn(command, [], {
  env: {
    ...process.env,
    VITE_STATIC_STORY: 'false',
  },
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
