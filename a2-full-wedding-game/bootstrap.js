const loading = document.querySelector('#loading');
const fallback = document.querySelector('#fallback');
const fallbackTitle = fallback?.querySelector('h2');
const fallbackBody = fallback?.querySelector('p');
const loadingText = loading?.querySelector('p');

let finished = false;

function failBoot(message) {
  if (finished) return;
  finished = true;
  if (loading) loading.hidden = true;
  if (fallback) fallback.hidden = false;
  if (fallbackTitle) fallbackTitle.textContent = '3Dの起動に失敗しました';
  if (fallbackBody) fallbackBody.textContent = `${message} ページを再読み込みしてください。改善しない場合はブラウザの開発者コンソールの最初の赤いエラーを確認してください。`;
}

globalThis.__A2_BOOT_FAIL__ = failBoot;

if (loadingText) loadingText.textContent = '3Dエンジンを準備しています';

const watchdog = setTimeout(() => {
  failBoot('12秒以内に3Dエンジンを開始できませんでした。');
}, 12000);

try {
  await import('./app.js');
  finished = true;
  clearTimeout(watchdog);
  if (fallback) fallback.hidden = true;
} catch (error) {
  clearTimeout(watchdog);
  console.error('[A2 boot]', error);
  failBoot(error?.message || '不明な起動エラーです。');
}
