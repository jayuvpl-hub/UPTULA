const express = require('express');
const { body, validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');
const getAppLinkTemplate = require('../utils/getAppLinkTemplate');

const router = express.Router();

router.post(
  '/send-app-link',
  [body('email').isEmail().withMessage('Please enter a valid email address.')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email } = req.body;
      const html = getAppLinkTemplate(email);
      await sendEmail(email, 'Your Uptula App Link', html);

      return res.json({ message: 'App link sent successfully! Please check your email.' });
    } catch (err) {
      console.error('send-app-link error:', err);
      return res.status(500).json({ message: 'Failed to send email. Please try again later.' });
    }
  }
);

module.exports = router;
