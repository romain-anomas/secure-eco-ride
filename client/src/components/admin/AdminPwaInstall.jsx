import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { Modal } from './ui.jsx';
import { getPendingInstallPrompt, isPwaInstalled, promptToInstall } from '../../services/pwaInstall.js';

const isAppleMobile = () => /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export default function AdminPwaInstall() {
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/admin-pwa-sw.js', { scope: '/admin/' })
        .catch((error) => console.error('[admin-pwa] service worker registration failed:', error.message));
    }

    const media = window.matchMedia('(display-mode: standalone)');
    const updateInstalled = () => setInstalled(media.matches || navigator.standalone === true);
    media.addEventListener?.('change', updateInstalled);
    window.addEventListener('secure-eco-ride-pwa-installed', updateInstalled);
    return () => {
      media.removeEventListener?.('change', updateInstalled);
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
      <span className="hidden sm:inline">Install app</span>
      <span className="sm:hidden">Install</span>
    </button>
    {showHelp && <Modal title="Install admin app" onClose={() => setShowHelp(false)}>
      {isAppleMobile() ? <div className="space-y-3 text-sm text-night/75">
        <p>In Safari:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Tap <Share className="inline h-4 w-4 align-text-bottom" aria-label="Share" /> <strong>Share</strong>.</li>
          <li>Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
        </ol>
      </div> : <div className="space-y-3 text-sm text-night/75">
        <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p>
      </div>}
      <div className="mt-6 flex justify-end"><button type="button" className="btn btn-primary btn-sm" onClick={() => setShowHelp(false)}>Close</button></div>
    </Modal>}
  </>;
}
