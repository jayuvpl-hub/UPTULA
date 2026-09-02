import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';

const PremiumMembers = () => {
  const { premiumMembers, fetchPremiumMembers, loading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [membershipFilter, setMembershipFilter] = useState('all');

  useEffect(() => {
    fetchPremiumMembers();
  }, [fetchPremiumMembers]);

  useEffect(() => {
    let filtered = premiumMembers.filter(member =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm))
    );

    if (membershipFilter !== 'all') {
      filtered = filtered.filter(member => member.membership_type === membershipFilter);
    }

    setFilteredMembers(filtered);
  }, [premiumMembers, searchTerm, membershipFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getMembershipBadge = (type) => {
    const typeClasses = {
      'basic': 'badge-info',
      'premium': 'badge-warning',
      'enterprise': 'badge-danger',
      'gold': 'badge-success'
    };
    return `badge ${typeClasses[type] || 'badge-secondary'}`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'active': 'badge-success',
      'expired': 'badge-danger',
      'pending': 'badge-warning',
      'cancelled': 'badge-secondary'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Premium Members Management</h1>
        <div className="d-flex">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Search premium members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
          />
          <select
            className="form-control mr-2"
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Types</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
            <option value="gold">Gold</option>
          </select>
          <button className="btn btn-primary">
            <i className="fas fa-download fa-sm text-white-50"></i> Export
          </button>
        </div>
      </div>

      {/* Premium Members Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Premium Members</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered" id="dataTable" width="100%" cellSpacing="0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Membership Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Amount Paid</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center">No premium members found</td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td>{member.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '32px', height: '32px' }}
                            />
                            <div>
                              <strong>{member.full_name}</strong>
                              <br />
                              <small className="text-muted">{member.role}</small>
                            </div>
                          </div>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.phone || 'N/A'}</td>
                        <td>
                          <span className={getMembershipBadge(member.membership_type)}>
                            {member.membership_type}
                          </span>
                        </td>
                        <td>{formatDate(member.membership_start_date)}</td>
                        <td>{formatDate(member.membership_end_date)}</td>
                        <td>
                          <span className={getStatusBadge(member.membership_status)}>
                            {member.membership_status}
                          </span>
                        </td>
                        <td>
                          <strong>${member.amount_paid || 0}</strong>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-primary"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              title="Edit Membership"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              title="Renew Membership"
                            >
                              <i className="fas fa-sync"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              title="Send Reminder"
                            >
                              <i className="fas fa-bell"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              title="Cancel Membership"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Premium Members
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {premiumMembers.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-crown fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Active Memberships
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {premiumMembers.filter(m => m.membership_status === 'active').length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    This Month Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ${premiumMembers
                      .filter(m => {
                        const memberDate = new Date(m.membership_start_date);
                        const currentDate = new Date();
                        return memberDate.getMonth() === currentDate.getMonth() &&
                               memberDate.getFullYear() === currentDate.getFullYear();
                      })
                      .reduce((total, member) => total + (member.amount_paid || 0), 0)
                    }
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ${premiumMembers.reduce((total, member) => total + (member.amount_paid || 0), 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-chart-line fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Membership Types</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Membership Type</th>
                      <th>Count</th>
                      <th>Revenue</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['basic', 'premium', 'enterprise', 'gold'].map(type => {
                      const members = premiumMembers.filter(m => m.membership_type === type);
                      const count = members.length;
                      const revenue = members.reduce((total, member) => total + (member.amount_paid || 0), 0);
                      const percentage = premiumMembers.length > 0 ? ((count / premiumMembers.length) * 100).toFixed(1) : 0;
                      return (
                        <tr key={type}>
                          <td>
                            <span className={getMembershipBadge(type)}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </td>
                          <td>{count}</td>
                          <td>${revenue}</td>
                          <td>{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Recent Premium Signups</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumMembers.slice(0, 5).map((member) => (
                      <tr key={member.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '24px', height: '24px' }}
                            />
                            <div>
                              <strong>{member.full_name}</strong>
                              <br />
                              <small className="text-muted">{member.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={getMembershipBadge(member.membership_type)}>
                            {member.membership_type}
                          </span>
                        </td>
                        <td>${member.amount_paid || 0}</td>
                        <td>{formatDate(member.membership_start_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Revenue Overview</h6>
            </div>
            <div className="card-body">
              <div className="chart-area">
                <canvas id="revenueChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PremiumMembers;
