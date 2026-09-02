const express = require('express');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

const buildFullAccessMembership = (userId) => ({
  id: 0,
  user_id: userId,
  membership_type: 'enterprise',
  status: 'active',
  start_date: new Date(),
  end_date: null,
  price: 0,
  payment_method: 'manual',
  transaction_id: null,
  features: JSON.stringify({ access: 'full', billingPaused: true })
});

// Helper function to check if user has active premium membership
const checkPremiumMembership = async (userId) => {
  try {
    const membership = await query(`
      SELECT * FROM premium_memberships 
      WHERE user_id = ? AND status = 'active' 
      AND (end_date IS NULL OR end_date > NOW())
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);
    
    if (membership.length > 0) {
      return membership[0];
    }

    // Billing is temporarily disabled, grant synthetic full-access membership
    return buildFullAccessMembership(userId);
  } catch (error) {
    console.error('Error checking premium membership:', error);
    return buildFullAccessMembership(userId);
  }
};

// Helper function to get daily download count for employer
const getDailyDownloadCount = async (employerId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const downloads = await query(`
      SELECT COUNT(*) as count 
      FROM download_tracking 
      WHERE employer_id = ? AND download_date = ?
    `, [employerId, today]);
    
    return downloads[0].count || 0;
  } catch (error) {
    console.error('Error getting daily download count:', error);
    return 0;
  }
};

// Check download limit and premium status
router.get('/download-status', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can download resumes.' });
    }

    const employerId = req.user.id;
    const premiumMembership = await checkPremiumMembership(employerId);
    const dailyDownloads = await getDailyDownloadCount(employerId);
    
    const isPremium = !!premiumMembership;
    const dailyLimit = isPremium ? 999 : 2; // Premium users get unlimited downloads
    const remainingDownloads = Math.max(0, dailyLimit - dailyDownloads);
    
    res.json({
      isPremium,
      membershipType: premiumMembership?.membership_type || 'basic',
      dailyDownloads,
      dailyLimit,
      remainingDownloads,
      canDownload: remainingDownloads > 0,
      membershipExpiry: premiumMembership?.end_date || null
    });
  } catch (error) {
    console.error('Error checking download status:', error);
    return next(error);
  }
});

// Download resume with limit checking
router.post('/download-resume/:applicationId', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can download resumes.' });
    }

    const employerId = req.user.id;
    const applicationId = req.params.applicationId;
    
    // Check if application exists and belongs to employer's job
    const application = await query(`
      SELECT a.*, j.employer_id 
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = ? AND j.employer_id = ?
    `, [applicationId, employerId]);
    
    if (application.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied.' });
    }

    // Check premium membership and download limits
    const premiumMembership = await checkPremiumMembership(employerId);
    const dailyDownloads = await getDailyDownloadCount(employerId);
    
    const isPremium = !!premiumMembership;
    const dailyLimit = isPremium ? 999 : 2;
    
    if (dailyDownloads >= dailyLimit) {
      return res.status(429).json({ 
        message: 'Daily download limit reached. Upgrade to premium for unlimited downloads.',
        isPremium: false,
        dailyDownloads,
        dailyLimit,
        upgradeRequired: true
      });
    }

    // Record the download
    const today = new Date().toISOString().split('T')[0];
    await query(`
      INSERT INTO download_tracking (employer_id, application_id, download_date)
      VALUES (?, ?, ?)
    `, [employerId, applicationId, today]);

    // Return the resume data
    const resumeData = {
      applicationId: application[0].id,
      candidateName: application[0].name,
      candidateEmail: application[0].email,
      candidatePhone: application[0].phone,
      resumeUrl: application[0].resume_url,
      pastedCv: application[0].pasted_cv,
      appliedAt: application[0].created_at,
      downloadedAt: new Date().toISOString()
    };

    res.json({
      message: 'Resume downloaded successfully',
      resumeData,
      remainingDownloads: dailyLimit - dailyDownloads - 1
    });
  } catch (error) {
    console.error('Error downloading resume:', error);
    return next(error);
  }
});

// Get premium membership plans
router.get('/membership-plans', async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        duration: 'Free',
        features: [
          '2 resume downloads per day',
          'Basic job posting',
          'Standard support'
        ],
        limits: {
          dailyDownloads: 2,
          jobPostings: 5,
          applications: 50
        }
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 29.99,
        duration: 'Monthly',
        features: [
          'Unlimited resume downloads',
          'Advanced job posting',
          'Priority support',
          'Advanced analytics',
          'Custom branding'
        ],
        limits: {
          dailyDownloads: 999,
          jobPostings: 50,
          applications: 500
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99.99,
        duration: 'Monthly',
        features: [
          'Unlimited resume downloads',
          'Unlimited job postings',
          '24/7 dedicated support',
          'Advanced analytics & reporting',
          'Custom branding & white-label',
          'API access',
          'Bulk operations'
        ],
        limits: {
          dailyDownloads: 999,
          jobPostings: 999,
          applications: 999
        }
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Error getting membership plans:', error);
    return next(error);
  }
});

// Enroll in premium membership
router.post('/enroll-premium', authenticate, async (req, res, next) => {
  try {
    const { membershipType, paymentMethod, transactionId } = req.body;
    
    if (!['premium', 'enterprise'].includes(membershipType)) {
      return res.status(400).json({ message: 'Invalid membership type.' });
    }

    const userId = req.user.id;
    
    // Check if user already has an active membership
    const existingMembership = await checkPremiumMembership(userId);
    if (existingMembership) {
      return res.status(400).json({ 
        message: 'You already have an active premium membership.',
        currentMembership: existingMembership
      });
    }

    // Calculate membership details
    const membershipDetails = {
      premium: { price: 29.99, duration: 30 },
      enterprise: { price: 99.99, duration: 30 }
    };

    const details = membershipDetails[membershipType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + details.duration);

    // Create premium membership record
    const membershipResult = await query(`
      INSERT INTO premium_memberships (
        user_id, membership_type, status, start_date, end_date, 
        price, payment_method, transaction_id, features
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      membershipType, 
      startDate, 
      endDate, 
      details.price,
      paymentMethod || 'stripe',
      transactionId || `txn_${Date.now()}`,
      JSON.stringify(membershipDetails[membershipType])
    ]);

    // Create payment record
    await query(`
      INSERT INTO payments (
        user_id, membership_id, amount, payment_method, transaction_id,
        status, payment_type, description
      ) VALUES (?, ?, ?, ?, ?, 'completed', 'membership', ?)
    `, [
      userId,
      membershipResult.insertId,
      details.price,
      paymentMethod || 'stripe',
      transactionId || `txn_${Date.now()}`,
      `${membershipType} membership enrollment`
    ]);

    res.json({
      message: 'Premium membership activated successfully',
      membership: {
        id: membershipResult.insertId,
        type: membershipType,
        startDate,
        endDate,
        price: details.price
      }
    });
  } catch (error) {
    console.error('Error enrolling in premium membership:', error);
    return next(error);
  }
});

// Get user's membership status
router.get('/my-membership', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const membership = await query(`
      SELECT pm.*, u.full_name, u.email
      FROM premium_memberships pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.user_id = ?
      ORDER BY pm.created_at DESC
      LIMIT 1
    `, [userId]);

    if (membership.length === 0) {
      return res.json({
        hasMembership: false,
        membership: null
      });
    }

    const membershipData = membership[0];
    const isActive = membershipData.status === 'active' && 
                    (!membershipData.end_date || new Date(membershipData.end_date) > new Date());

    res.json({
      hasMembership: true,
      membership: {
        id: membershipData.id,
        type: membershipData.membership_type,
        status: membershipData.status,
        isActive,
        startDate: membershipData.start_date,
        endDate: membershipData.end_date,
        price: membershipData.price,
        paymentMethod: membershipData.payment_method,
        transactionId: membershipData.transaction_id
      }
    });
  } catch (error) {
    console.error('Error getting membership status:', error);
    return next(error);
  }
});

// Get download history for employer
router.get('/download-history', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'provider') {
      return res.status(403).json({ message: 'Access denied. Only employers can view download history.' });
    }

    const employerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const downloads = await query(`
      SELECT 
        dt.id,
        dt.download_date,
        dt.created_at,
        a.name as candidate_name,
        a.email as candidate_email,
        j.job_title,
        j.company_name
      FROM download_tracking dt
      JOIN applications a ON a.id = dt.application_id
      JOIN jobs j ON j.id = a.job_id
      WHERE dt.employer_id = ?
      ORDER BY dt.created_at DESC
      LIMIT ? OFFSET ?
    `, [employerId, parseInt(limit), parseInt(offset)]);

    const totalCount = await query(`
      SELECT COUNT(*) as count
      FROM download_tracking dt
      WHERE dt.employer_id = ?
    `, [employerId]);

    res.json({
      downloads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting download history:', error);
    return next(error);
  }
});

module.exports = router;
