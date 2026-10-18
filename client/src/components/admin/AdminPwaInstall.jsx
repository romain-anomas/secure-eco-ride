import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Modal } from './ui.jsx';
import { getPendingInstallPrompt, isPwaInstalled, promptToInstall } from '../../services/pwaInstall.js';

const isAppleMobile = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function AdminPwaInstall() {
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [installable, setInstallable] = useState(() => Boolean(getPendingInstallPrompt()));
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/admin-pwa-sw.js', { scope: '/admin/' })
        .catch((error) => console.error('[admin-pwa] service worker registration failed:', error.message));
    }

    const media = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => setInstalled(media.matches || navigator.standalone === true);
    const updateInstallable = () => setInstallable(Boolean(getPendingInstallPrompt()));
    media.addEventListener?.('change', updateInstalled);
    window.addEventListener('secure-eco-ride-pwa-installable', updateInstallable);
    window.addEventListener('secure-eco-ride-pwa-installed', updateInstalled);
    return () => {
      media.removeEventListener?.('change', updateInstalled);
      window.removeEventListener('secure-eco-ride-pwa-installable', updateInstallable);
      window.removeEventListener('secure-eco-ride-pwa-installed', updateInstalled);
    };
  }, []);

  async function install() {
    const prompt = getPendingInstallPrompt();
    if (!prompt) {
      setShowHelp(true);
      return;
    }
    try {
      const choice = await promptToInstall();
      setInstallable(false);
      if (choice?.outcome === 'accepted') setInstalled(true);
      else if (isAppleMobile()) setShowHelp(true);
    } catch (error) {
      console.error('[admin-pwa] install prompt failed:', error.message);
      setShowHelp(true);
    }
  }

  if (installed) return null;

  return <>
    <button type="button" className="btn btn-outline btn-sm !px-3 !py-2" onClick={install} aria-label="Install Secure Eco Ride Admin">
      <Download className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Install Admin App</span>
      <span className="sm:hidden">Install</span>
    </button>
    {showHelp && <Modal title="Install Secure Eco Ride Admin" onClose={() => setShowHelp(false)}>
      {isAppleMobile() ? <div className="space-y-3 text-sm text-night/75">
        <p>Install this dashboard from Safari:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Tap the <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> Share button.</li>
          <li>Choose <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong> to finish.</li>
        </ol>
      </div> : <div className="space-y-3 text-sm text-night/75">
        <p>If your browser supports app installation, open its menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>
        <p>If that option is missing, open this admin page in an up-to-date browser such as Chrome or Edge over HTTPS. Some browsers do not support a one-tap install prompt.</p>
      </div>}
      <div className="mt-6 flex justify-end"><button type="button" className="btn btn-primary btn-sm" onClick={() => setShowHelp(false)}>Got it</button></div>
    </Modal>}
  </>;
}
