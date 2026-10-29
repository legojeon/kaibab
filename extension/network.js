import {messages} from './locales.js';

export const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const PATHS = new Set(['/kr/html/campus/053001.html', '/en/html/campus/053001.html']);

// A public menu is data, never executable remote code. Limit the destination,
// redirect behavior and body size before handing the text to the local parser.
export async function fetchMenuPage(url, signal, language) {
  const m = messages(language);
  const target = new URL(url);
  if (target.origin !== 'https://www.kaist.ac.kr' || !PATHS.has(target.pathname) || target.username || target.password) {
    throw new Error(m.invalidPage);
  }
  const response = await fetch(target.href, {
    signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', redirect: 'error',
  });
  if (!response.ok) throw new Error(m.http(response.status));
  if (!/^text\/html(?:;|$)/i.test(response.headers.get('content-type') || '') || !response.body) {
    await response.body?.cancel();
    throw new Error(m.invalidPage);
  }
  if (Number(response.headers.get('content-length')) > MAX_PAGE_BYTES) {
    await response.body.cancel();
    throw new Error(m.invalidPage);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let size = 0;
  let text = '';
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PAGE_BYTES) {
        await reader.cancel();
        throw new Error(m.invalidPage);
      }
      text += decoder.decode(value, {stream: true});
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}
