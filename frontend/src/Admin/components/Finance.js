import React, { useState, useEffect, useRef } from 'react';

import { useAdmin } from '../AdminContext';
import { API_BASE_URL } from '../../config/api';

const Finance = () => {
  const { token } = useAdmin();
  
  
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    earningsByPeriod: [],
    earningsByType: [],
    earningsByRole: [],
    monthlyBreakdown: [],
    quarterlyBreakdown: [],
    yearlyBreakdown: []
  });
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    role: 'all',
    search: ''
  });

  useEffect(() => {
    loadFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, currentPage, filters.status, filters.type, filters.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadFinanceData();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);

      // Load analytics
      try {
        const analyticsRes = await fetch(
          `${API_BASE_URL}/api/admin/finance/analytics?period=${selectedPeriod}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      }

      // Load payment stats
      try {
        const statsRes = await fetch(
          `${API_BASE_URL}/api/admin/payment-stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setPaymentStats(statsData.overall || {});
        }
      } catch (err) {
        console.error('Error loading payment stats:', err);
      }

      // Load payments
      try {
        const params = new URLSearchParams();
        params.set('page', currentPage);
        params.set('limit', '50');
        if (filters.status !== 'all') params.set('status', filters.status);
        if (filters.type !== 'all') params.set('type', filters.type);
        if (filters.search) params.set('q', filters.search);

        const paymentsRes = await fetch(
          `${API_BASE_URL}/api/admin/payments?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData.payments || []);
          setPagination(paymentsData.pagination || {});
        } else {
          setPayments([]);
          setPagination({});
        }
      } catch (err) {
        console.error('Error loading payments:', err);
        setPayments([]);
        setPagination({});
      }
    } catch (error) {
      console.error('Finance load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const getStatusBadge = (status) => {
    const badges = {
      completed: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger',
      refunded: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  const getTypeBadge = (type) => {
    const badges = {
      membership: 'badge-primary',
      resume_download: 'badge-info',
      job_posting: 'badge-warning',
      other: 'badge-secondary'
    };
    return badges[type] || 'badge-secondary';
  };

  const getChartData = () => {
    if (selectedPeriod === 'monthly') return analytics.monthlyBreakdown || [];
    if (selectedPeriod === 'quarterly') return analytics.quarterlyBreakdown || [];
    return analytics.yearlyBreakdown || [];
  };

  const chartData = getChartData();
  const maxEarnings =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => parseFloat(d.earnings || 0)), 1)
      : 1;

  const filteredPayments = payments.filter((p) =>
    filters.role === 'all' ? true : p.role === filters.role
  );

  const totalEarnings = paymentStats.total_revenue || 0;
  const totalPayments = paymentStats.total_payments || 0;
  const successfulPayments = paymentStats.successful_payments || 0;
  const failedPayments = paymentStats.failed_payments || 0;

  return (
    <>
      {/* Your entire JSX remains unchanged */}
    </>
  );
};

export default Finance;
