const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Dev proxy for /api and /uploads when the browser calls localhost:3000/api (API_BASE_URL '').
 * REACT_APP_USE_PRODUCTION_API=false → always proxy to local backend :5000
 * REACT_APP_USE_PRODUCTION_API=true  → proxy to REACT_APP_REMOTE_API_TARGET (live server)
 */
module.exports = function setupProxy(app) {
  const useProductionApi = process.env.REACT_APP_USE_PRODUCTION_API === 'true';
  const target = useProductionApi
    ? (process.env.REACT_APP_REMOTE_API_TARGET || 'https://uptula.com')
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

  console.log('[setupProxy] /api →', target);

  app.use(
    ['/api', '/uploads'],
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: target.startsWith('https'),
    })
  );
};
