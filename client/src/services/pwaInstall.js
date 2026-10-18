let pendingInstallPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    pendingInstallPrompt = event;
    window.dispatchEvent(new Event('secure-eco-ride-pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    pendingInstallPrompt = null;
    window.dispatchEvent(new Event('secure-eco-ride-pwa-installed'));
  });
}

export const getPendingInstallPrompt = () => pendingInstallPrompt;

export async function promptToInstall() {
  const prompt = pendingInstallPrompt;
  if (!prompt) return null;
  pendingInstallPrompt = null;
  window.dispatchEvent(new Event('secure-eco-ride-pwa-installable'));
  await prompt.prompt();
  return prompt.userChoice;
}

export function isPwaInstalled() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}
