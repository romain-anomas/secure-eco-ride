import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import MobileActionBar from '../components/MobileActionBar.jsx';

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-lime focus:px-4 focus:py-2 focus:font-bold focus:text-night">Skip to content</a>
      <Navbar />
      <main id="main" className="pb-16 md:pb-0">
        <Suspense fallback={<div className="grid min-h-[60vh] place-items-center bg-night text-white/60">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileActionBar />
    </>
  );
}
