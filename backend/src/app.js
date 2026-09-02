// Ensure .env is loaded even on hosts that run app.js directly (e.g. cPanel/Passenger)
require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimiter } = require('./middleware/rateLimit');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { CLIENT_ORIGINS, UPLOADS_ROOT, isProduction } = require('./config/env');

const authRoutes = require('./routes/auth.routes');
const employerRoutes = require('./routes/employer.routes');
const profileRoutes = require('./routes/profile.routes');
const jobsRoutes = require('./routes/jobs.routes');
const resumeRoutes = require('./routes/resume.routes');
const adminRoutes = require('./routes/admin.routes');
const customerRoutes = require('./routes/customer.routes');
const premiumRoutes = require('./routes/premium.routes');
const searchRoutes = require('./routes/search.routes');
const referralRoutes = require('./routes/referral.routes');
const chatRoutes = require('./routes/chat.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const categoriesRoutes = require('./routes/categories.routes');
const aiRoutes = require('./routes/ai.routes');
const appRoutes = require('./routes/app.routes');
const paymentRoutes = require('./routes/payment.routes')
const path = require('path');
const fs = require('fs');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (CLIENT_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use('/api', rateLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', jobsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/employer/referral', referralRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/registration', categoriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/app', appRoutes);
app.use('/api/paymentRoutes', paymentRoutes)

// Device-aware redirect for app-link emails (mobile → Play Store, desktop → jobs page)
app.get('/redirect', (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const isMobile = /android|iphone|ipad|mobile/i.test(ua);

  if (isMobile) {
    return res.redirect('https://play.google.com/store/apps/details?id=com.uptula');
  }
  return res.redirect('https://uptula.com/jobs');
});

// Static files for uploads (UPLOADS_ROOT env for production paths outside app dir)
const uploadsRoot = UPLOADS_ROOT;
try { fs.mkdirSync(path.join(uploadsRoot, 'jobs'), { recursive: true }); } catch (_) {}
try { fs.mkdirSync(path.join(uploadsRoot, 'applications'), { recursive: true }); } catch (_) {}
try { fs.mkdirSync(path.join(uploadsRoot, 'profiles'), { recursive: true }); } catch (_) {}
try { fs.mkdirSync(path.join(uploadsRoot, 'resumes'), { recursive: true }); } catch (_) {}
try { fs.mkdirSync(path.join(uploadsRoot, 'companies'), { recursive: true }); } catch (_) {}
app.use('/uploads', express.static(uploadsRoot));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Swagger API docs at /api/docs (optional dependency — degrade gracefully).
try {
  const swaggerUi = require('swagger-ui-express');
  const openapiSpec = require('./docs/openapi');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'UPTULA API Docs' }));
  app.get('/api/docs.json', (req, res) => res.json(openapiSpec));
} catch (err) {
  console.warn('Swagger UI not available:', err.message);
}

// Serve frontend build (if present) and provide SPA fallback for admin/customer UI routes.
// The project may ship the compiled frontend under a few possible locations:
// - ../frontend/build (monorepo or separate frontend folder)
// - ../../public_html (old layout / this repo already contains `public_html`)
// Prefer `public_html` if present (it contains the static SPA assets in this repo),
// otherwise fall back to ../frontend/build so other deployments keep working.
let frontendBuildPath = path.join(__dirname, '..', '..', 'public_html');
const fallbackFrontend = path.join(__dirname, '..', '..', 'frontend', 'build');
if (!fs.existsSync(frontendBuildPath) && fs.existsSync(fallbackFrontend)) {
  frontendBuildPath = fallbackFrontend;
}
console.log('Checking for frontend build at:', frontendBuildPath);
if (fs.existsSync(frontendBuildPath)) {
  console.log('Frontend build directory found. Setting up SPA routes.');
  // Serve static files (CSS, JS, images, etc.) from the build directory
  // In `public_html` index.html sits at the root and static assets are under /static.
  app.use(express.static(frontendBuildPath, { 
    index: false, // Don't serve index.html automatically for root
    fallthrough: true // Continue to next middleware if file not found
  }));

  // Also serve the same build when the request path starts with /admin or /cs
  // This ensures assets referenced relatively (e.g. assets/...) resolve when
  // the browser is on a nested SPA route like /admin/login.
  app.use('/admin', express.static(frontendBuildPath, { index: false, fallthrough: true }));
  app.use('/cs', express.static(frontendBuildPath, { index: false, fallthrough: true }));

  // Serve assets when requests come in as /admin/<any>/assets/... or /admin/<any>/static/...
  // Browsers sometimes request /admin/login/assets/... when navigating nested SPA routes.
  // If a request for /admin/.../assets/* arrives, locate the matching file under the
  // frontend build's assets directory and send it directly with correct MIME type.
  app.use((req, res, next) => {
    try {
      // match /admin/anything/assets/<path>
      const mAssets = req.path.match(/^\/admin(?:\/.*)?\/assets(\/.*)$/);
      if (mAssets) {
        const fileRelativePath = mAssets[1]; // starts with '/'
        const filePath = path.join(frontendBuildPath, 'assets', fileRelativePath);
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }

      // match /admin/anything/static/<path> (CRA builds put hashed JS in /static/js/...)
      const mStatic = req.path.match(/^\/admin(?:\/.*)?\/static(\/.*)$/);
      if (mStatic) {
        const fileRelativePath = mStatic[1];
        const filePath = path.join(frontendBuildPath, 'static', fileRelativePath);
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }

      // Also handle same patterns for /cs
      const cAssets = req.path.match(/^\/cs(?:\/.*)?\/assets(\/.*)$/);
      if (cAssets) {
        const fileRelativePath = cAssets[1];
        const filePath = path.join(frontendBuildPath, 'assets', fileRelativePath);
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
      }

      const cStatic = req.path.match(/^\/cs(?:\/.*)?\/static(\/.*)$/);
      if (cStatic) {
        const fileRelativePath = cStatic[1];
        const filePath = path.join(frontendBuildPath, 'static', fileRelativePath);
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
      }
    } catch (e) {
      // continue to next handler if anything goes wrong
    }
    next();
  });

  // Serve SPA for admin routes - MUST be before catch-all
  // Use regex to match all admin routes. The index.html may live at the build root.
  app.get(/^\/admin(?:\/.*)?$/, (req, res, next) => {
    const indexPath = path.join(frontendBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('Serving admin route:', req.path, '-> index.html');
      res.sendFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      next();
    }
  });

  // Serve SPA for customer service routes - MUST be before catch-all
  // Use regex to match all cs routes
  app.get(/^\/cs(?:\/.*)?$/, (req, res, next) => {
    const indexPath = path.join(frontendBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('Serving cs route:', req.path, '-> index.html');
      res.sendFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      next();
    }
  });

  // Catch-all for all other non-API routes -> serve index.html (SPA)
  app.get('*', (req, res, next) => {
    // Skip API routes, uploads, and device-aware email redirect
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/redirect') {
      return next();
    }
    
    const indexPath = path.join(frontendBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('Serving SPA route:', req.path, '-> index.html (from', frontendBuildPath + ')');
      res.sendFile(indexPath);
    } else {
      console.error('index.html not found at:', indexPath);
      next();
    }
  });
} else {
  console.warn('⚠️  Frontend build directory not found at:', frontendBuildPath);
  console.warn('⚠️  SPA routes (/admin/*, /cs/*) will not work without the build directory.');
  console.warn('⚠️  Please ensure the frontend is built and the build directory exists.');
}

app.use(notFoundHandler);
app.use(errorHandler);

// TEMP: internal debug endpoint to verify which frontend path the running
// server is using and if index.html exists. Useful while troubleshooting
// deployments on hosts like cPanel/Passenger. Disabled when explicitly
// turned off via env var DEBUG_FRONTEND_CHECK=0.
const enableFrontendCheck =
  !isProduction && process.env.DEBUG_FRONTEND_CHECK !== '0';
if (enableFrontendCheck) {
  app.get('/api/internal/frontend-check', (req, res) => {
    try {
      const indexPath = path.join(frontendBuildPath || '', 'index.html');
      const exists = !!frontendBuildPath && fs.existsSync(indexPath);

      // Check a few common asset files that are used by the legacy admin layout.
      const sampleAssets = [
        path.join(frontendBuildPath || '', 'assets', 'css', 'style.css'),
        path.join(frontendBuildPath || '', 'assets', 'plugins', 'bootstrap', 'css', 'bootstrap.min.css'),
        path.join(frontendBuildPath || '', 'static', 'js')
      ];
      const assetsExist = {};
      for (const p of sampleAssets) assetsExist[p.replace((frontendBuildPath||''),'') || p] = fs.existsSync(p);
      return res.json({
        ok: true,
        frontendBuildPath: frontendBuildPath || null,
        indexHtmlExists: exists,
        sampleAssets: assetsExist,
        indexPath: indexPath,
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });
}

module.exports = app;


