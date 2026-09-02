/**
 * Hand-authored OpenAPI 3 spec for the UPTULA API (spec section 21).
 * Served at GET /api/docs via swagger-ui-express (mounted in app.js).
 * Covers the core + Phase 1-5 endpoints; extend as new routes are added.
 */
const bearer = [{ bearerAuth: [] }];

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UPTULA API',
    version: '2.0.0',
    description: 'Professional career platform API — auth, categories, profiles, resume parsing, AI, admin.',
  },
  servers: [
    { url: '/', description: 'Same origin' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  paths: {
    '/api/health': { get: { summary: 'Health check', responses: { 200: { description: 'OK' } } } },

    '/api/auth/register': {
      post: {
        summary: 'Start registration (sends OTP). Accepts categoryIds[] (max 5) or single categoryId.',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['seeker', 'provider'] },
            fullName: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' },
            password: { type: 'string' }, experience: { type: 'string', enum: ['fresher', 'experience'] },
            categoryIds: { type: 'array', items: { type: 'integer' } },
            subcategoryIds: { type: 'array', items: { type: 'integer' } },
            categoryId: { type: 'integer' }, subcategoryId: { type: 'integer' },
          },
          required: ['role', 'fullName', 'email', 'password'],
        } } } },
        responses: { 200: { description: 'OTP sent' }, 400: { description: 'Validation error' } },
      },
    },
    '/api/auth/verify-register-otp': {
      post: { summary: 'Verify OTP and create the account (writes category junctions).',
        responses: { 200: { description: 'Registered' }, 400: { description: 'Invalid OTP' } } },
    },
    '/api/auth/login': {
      post: { summary: 'Login (email or phone). Legacy md5 hashes auto-upgrade to bcrypt.',
        responses: { 200: { description: 'JWT + user' }, 401: { description: 'Bad credentials' }, 403: { description: 'Suspended' } } },
    },

    '/api/categories/categories': {
      get: { summary: 'Public active categories. Optional ?type=technical|non_technical',
        parameters: [{ name: 'type', in: 'query', schema: { type: 'string', enum: ['technical', 'non_technical'] } }],
        responses: { 200: { description: 'Category list' } } },
    },
    '/api/categories/categories/{categoryId}/subcategories': {
      get: { summary: 'Public subcategories for a category',
        parameters: [{ name: 'categoryId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Subcategory list' } } },
    },
    '/api/categories/admin/categories': {
      post: { summary: 'Create category (admin). Body includes type.', security: bearer,
        responses: { 201: { description: 'Created' } } },
    },

    '/api/profile': {
      get: { summary: 'Get my candidate profile (includes categories, completion, resume meta)', security: bearer,
        responses: { 200: { description: 'Profile' } } },
      put: { summary: 'Update profile (multipart: profilePicture, resume + fields)', security: bearer,
        responses: { 200: { description: 'Updated' } } },
    },
    '/api/profile/categories': {
      get: { summary: 'My selected categories/subcategories', security: bearer, responses: { 200: { description: 'OK' } } },
      put: { summary: 'Replace my categories (max 5)', security: bearer,
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: {
          categoryIds: { type: 'array', items: { type: 'integer' } },
          subcategoryIds: { type: 'array', items: { type: 'integer' } } } } } } },
        responses: { 200: { description: 'Saved' }, 400: { description: 'Too many / invalid' } } },
    },
    '/api/profile/language': {
      put: { summary: 'Set preferred language', security: bearer, responses: { 200: { description: 'Saved' } } },
    },

    '/api/resume/parse': {
      post: { summary: 'Parse a resume (multipart: resume) or the stored one. ?enhance=true uses AI if configured.',
        security: bearer, responses: { 200: { description: 'Parsed fields' }, 422: { description: 'Unreadable' } } },
    },
    '/api/resume/apply-parsed': {
      post: { summary: 'Apply reviewed resume fields to the profile', security: bearer, responses: { 200: { description: 'Updated' } } },
    },

    '/api/ai/status': { get: { summary: 'Whether AI features are enabled', responses: { 200: { description: '{configured}' } } } },
    '/api/ai/enhance-profile': { post: { summary: 'AI profile strength, missing/recommended skills, suggestions', security: bearer, responses: { 200: { description: 'OK' }, 503: { description: 'AI not configured' } } } },
    '/api/ai/job-description': { post: { summary: 'AI job description generator (employer)', security: bearer, responses: { 200: { description: 'OK' } } } },
    '/api/ai/cover-letter': { post: { summary: 'AI cover letter (candidate)', security: bearer, responses: { 200: { description: 'OK' } } } },
    '/api/ai/skill-gap': { post: { summary: 'AI skill-gap analysis', security: bearer, responses: { 200: { description: 'OK' } } } },

    '/api/admin/users': { get: { summary: 'List users (search/role/status/pagination)', security: bearer, responses: { 200: { description: 'OK' } } } },
    '/api/admin/users/stats': { get: { summary: 'User counts by role/type', security: bearer, responses: { 200: { description: 'OK' } } } },
    '/api/admin/users/{id}': {
      get: { summary: 'User detail', security: bearer, responses: { 200: { description: 'OK' } } },
      delete: { summary: 'Delete user', security: bearer, responses: { 200: { description: 'Deleted' } } },
    },
    '/api/admin/users/{id}/status': {
      patch: { summary: 'Suspend / activate user', security: bearer, responses: { 200: { description: 'OK' } } },
    },
    '/api/admin/audit-logs': { get: { summary: 'Recent audit log entries', security: bearer, responses: { 200: { description: 'OK' } } } },
  },
};

module.exports = openapiSpec;
