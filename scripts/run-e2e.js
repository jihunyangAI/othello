import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer, preview } from 'vite';

// Keep server ownership in this process so Windows does not need taskkill /T.
const root = fileURLToPath(new URL('../', import.meta.url));
const browserCache = fileURLToPath(
  new URL('../.playwright-browsers', import.meta.url),
);
const cli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
);
const options = { host: '127.0.0.1', port: 5174, strictPort: true };
let server;
let child;

try {
  if (process.env.E2E_PREVIEW === '1') {
    server = await preview({ root, preview: options });
  } else {
    server = await createServer({ root, server: options });
    await server.listen();
  }

  const env = { ...process.env, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:5174' };
  if (!env.PLAYWRIGHT_BROWSERS_PATH && existsSync(browserCache)) {
    env.PLAYWRIGHT_BROWSERS_PATH = browserCache;
  }
  child = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], {
    cwd: root,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (server) {
    if (server.close) await server.close();
    else
      await new Promise((resolve, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
  }
}
