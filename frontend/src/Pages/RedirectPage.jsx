import { useEffect } from 'react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.uptula';
const JOBS_URL = 'https://uptula.com/jobs';

function RedirectPage() {
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isMobile = /android|iphone|ipad|mobile/i.test(ua);
    window.location.replace(isMobile ? PLAY_STORE_URL : JOBS_URL);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', fontFamily: 'Arial, sans-serif', color: '#334155' }}>
      <p>Redirecting you to Uptula...</p>
      <p>
        <a href={JOBS_URL}>Click here if you are not redirected</a>
      </p>
    </div>
  );
}

export default RedirectPage;
