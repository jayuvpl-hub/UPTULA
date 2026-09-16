const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3_BUCKET, s3 } = require('./env');

/**
 * Build the S3 object key. Mirrors the old `${Date.now()}_${base}${ext}`
 * (and `${Date.now()}_${userId}_${base}${ext}`) filename patterns used by
 * the local-disk multer configs, just prefixed with the folder instead of
 * being written under UPLOADS_ROOT.
 */
function buildKey(folder, originalname, userId) {
  const ext = path.extname(originalname || '');
  const base = path
    .basename(originalname || 'file', ext)
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = userId ? `${Date.now()}_${userId}_${base}` : `${Date.now()}_${base}`;
  return `${folder}/${prefix}${ext}`;
}

const filters = {
  imageOnly: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'), false);
  },
  resumeOnly: (req, file, cb) => {
    const allowedMimes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    const allowedExt = new Set(['.pdf', '.doc', '.docx']);
    const ext = (path.extname(file.originalname || '') || '').toLowerCase();
    if (allowedMimes.has(file.mimetype) || allowedExt.has(ext)) return cb(null, true);
    cb(new Error('File must be a PDF or Word (.doc/.docx) file'), false);
  },
};

/**
 * Create a multer instance that uploads directly to S3 under `folder/`.
 *
 * @param {string} folder - S3 key prefix, e.g. 'applications', 'jobs', 'companies', 'resumes'
 * @param {object} [options]
 * @param {function} [options.fileFilter] - e.g. filters.imageOnly / filters.resumeOnly
 * @param {boolean} [options.includeUserId] - include req.user.id in the filename (matches
 *        the old employerLogoStorage / profile / resume patterns)
 * @param {number} [options.maxSizeMB=5]
 */
function makeUploader(folder, { fileFilter, includeUserId = false, maxSizeMB = 5 } = {}) {
  if (!S3_BUCKET) {
    throw new Error('S3_BUCKET is not set. Add it to backend/.env');
  }

  return multer({
    storage: multerS3({
      s3,
      bucket: S3_BUCKET,
      key: (req, file, cb) => {
        cb(null, buildKey(folder, file.originalname, includeUserId ? req.user?.id : null));
      },
    }),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    ...(fileFilter ? { fileFilter } : {}),
  });
}

module.exports = { makeUploader, filters, s3, buildKey };
