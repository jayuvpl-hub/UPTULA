import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './GuestMobileHero.css';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.uptula';
/** Set when the iOS App Store listing is live */
const APP_STORE_URL = '';

const getMobileAppStoreUrl = () => {
  if (typeof navigator === 'undefined') return PLAY_STORE_URL;

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  if (isIOS) return APP_STORE_URL || null;
  if (isAndroid) return PLAY_STORE_URL;
  return PLAY_STORE_URL;
};

/**
 * Mobile-only hero for visitors who are not signed in.
 * Shown from Home.js; desktop + logged-in users keep the default hero.
 */
function GuestMobileHero({
  searchKeyword,
  setSearchKeyword,
  onSearch,
}) {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof window === 'undefined') return undefined;

    const syncVisibleHeight = () => {
      const nav = document.querySelector('nav.navbar.bootsnav');
      const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height) : 70;
      const visibleHeight = Math.round(
        window.visualViewport?.height ?? window.innerHeight
      );
      section.style.setProperty('--guest-mobile-hero-height', `${visibleHeight}px`);
      section.style.setProperty('--guest-mobile-header-offset', `${navHeight}px`);
    };

    syncVisibleHeight();
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', syncVisibleHeight);
    window.addEventListener('resize', syncVisibleHeight);
    window.addEventListener('orientationchange', syncVisibleHeight);

    const t1 = window.setTimeout(syncVisibleHeight, 100);
    const t2 = window.setTimeout(syncVisibleHeight, 450);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      viewport?.removeEventListener('resize', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
      window.removeEventListener('orientationchange', syncVisibleHeight);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (typeof onSearch === 'function') {
      onSearch();
      return;
    }
    const params = new URLSearchParams();
    const q = String(searchKeyword || '').trim();
    if (q) params.set('q', q);
    navigate(`/jobs?${params.toString()}`);
  };

  const openMobileApp = (e) => {
    e.preventDefault();
    const storeUrl = getMobileAppStoreUrl();
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    const el = document.getElementById('uptula-mobile-app-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openSigninModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new Event('uptula:open-default-signin'));
    if (typeof window !== 'undefined' && window.jQuery) {
      window.jQuery('#signin').modal('show');
    }
  };

  const openRegisterModal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new Event('uptula:open-default-register'));
    if (typeof window !== 'undefined' && window.jQuery) {
      window.jQuery('#register').modal('show');
    }
  };

  return (
    <section ref={sectionRef} className="guest-mobile-hero" aria-label="Find jobs">
      <div className="guest-mobile-hero__inner">
        <div className="guest-mobile-hero__copy">
          <form className="guest-mobile-hero__search" onSubmit={handleSearchSubmit}>
            <i className="ti-search guest-mobile-hero__search-icon" aria-hidden="true" />
            <input
              type="text"
              className="guest-mobile-hero__search-input"
              placeholder="Search jobs here..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              aria-label="Search jobs"
            />
          </form>

          <h1 className="guest-mobile-hero__title">Put your "CV" dream job waiting.</h1>
        </div>
      </div>

      <div className="guest-mobile-hero__visual">
        <img
          src="/assets/img/mobile_hero.png"
          alt="Explore jobs across industries"
          className="guest-mobile-hero__image"
        />
      </div>

      <div className="guest-mobile-hero__inner guest-mobile-hero__inner--bottom">
        <div className="guest-mobile-hero__actions">
        <button
            type="button"
            className="guest-mobile-hero__btn guest-mobile-hero__btn--app"
            onClick={openMobileApp}
          >
            Get mobile application
          </button>
          
        <div className="guest-mobile-hero__actions-row">
            <button
              type="button"
              className="guest-mobile-hero__btn guest-mobile-hero__btn--light"
              onClick={openSigninModal}
            >
              Login
            </button>
            <button
              type="button"
              className="guest-mobile-hero__btn guest-mobile-hero__btn--primary"
              onClick={openRegisterModal}
            >
              Register
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
}

export default GuestMobileHero;
