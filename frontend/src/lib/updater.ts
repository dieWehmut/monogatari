// Auto-update check for the Tauri desktop build.
// Safe no-op in web / mobile / dev, where the updater plugin is unavailable.

const isTauriRuntime = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function checkForUpdates(): Promise<void> {
  if (!isTauriRuntime()) return;

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return;

    const notes = update.body ? `\n\n${update.body}` : '';
    const confirmed = window.confirm(`发现新版本 ${update.version}，是否现在更新并重启？${notes}`);
    if (!confirmed) return;

    await update.downloadAndInstall();

    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (error) {
    console.error('[updater] update check failed', error);
  }
}
