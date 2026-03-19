import { css, injectGlobal } from '@emotion/css';

const TOAST_CONTAINER_ID = 'ribbit-plugin-xlsx-toast-container';

injectGlobal`
  @keyframes ribbit-toast-in {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ribbit-toast-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
`;

type ToastType = 'success' | 'error';

const toastStyle = (type: ToastType) => css`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: ${type === 'success' ? '#2e7d32' : '#c62828'};
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
  animation: ribbit-toast-in 0.22s ease;
  pointer-events: none;
`;

function getContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 画面右下にトースト通知を表示します
 *
 * @param message 表示するメッセージ
 * @param type 'success' または 'error'
 * @param durationMs 表示時間 (ms)
 */
export function showToast(message: string, type: ToastType = 'success', durationMs = 3000): void {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = toastStyle(type);
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'ribbit-toast-out 0.3s ease forwards';
    setTimeout(() => toast.remove(), 320);
  }, durationMs);
}
