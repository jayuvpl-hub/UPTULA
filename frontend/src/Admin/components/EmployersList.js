import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { API_BASE_URL } from '../../config/api';

const EmployersList = () => {
  const { employers, fetchEmployers, loading, token } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployers, setFilteredEmployers] = useState([]);
  const [viewing, setViewing] = useState(null); // { employer, profile }
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  useEffect(() => {
    const filtered = employers.filter(employer =>
      employer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employer.phone && employer.phone.includes(searchTerm))
    );
    setFilteredEmployers(filtered);
  }, [employers, searchTerm]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const viewProfile = async (employerId) => {
    try {
      setViewLoading(true);
      const resp = await fetch(`${API_BASE_URL}/api/admin/employers/${employerId}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setViewing(data);
      }
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Employers Management</h1>
        <div className="d-flex">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Search employers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
          />
          <button className="btn btn-primary">
            <i className="fas fa-download fa-sm text-white-50"></i> Export
          </button>
        </div>
      </div>

      {/* Employers Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Registered Employers</h6>
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
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">No employers found</td>
                    </tr>
                  ) : (
                    filteredEmployers.map((employer) => (
                      <tr key={employer.id}>
                        <td>{employer.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '32px', height: '32px' }}
                            />
                            {employer.full_name}
                          </div>
                        </td>
                        <td>{employer.full_name}</td>
                        <td>{employer.email}</td>
                        <td>{employer.phone || 'N/A'}</td>
                        <td>{formatDate(employer.created_at)}</td>
                        <td>
                          <span className="badge badge-success">Active</span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-primary"
                              title="View Profile"
                              onClick={() => viewProfile(employer.id)}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              title="Send Message"
                            >
                              <i className="fas fa-envelope"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              title="View Jobs"
                            >
                              <i className="fas fa-briefcase"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              title="Deactivate"
                            >
                              <i className="fas fa-ban"></i>
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

      {/* Employer Profile Modal */}
      {viewing && (
        <div className="modal fade show" style={{display:'block', background: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Employer Profile</h5>
                <button type="button" className="close" onClick={() => setViewing(null)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {viewLoading ? (
                  <div>Loading...</div>
                ) : (
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Basic Info</h6>
                      <p><strong>Name:</strong> {viewing.employer.full_name}</p>
                      <p><strong>Email:</strong> {viewing.employer.email}</p>
                      <p><strong>Phone:</strong> {viewing.employer.phone || 'N/A'}</p>
                      <p><strong>Joined:</strong> {formatDate(viewing.employer.created_at)}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Company Profile</h6>
                      {viewing.profile ? (
                        <>
                          <p><strong>Company:</strong> {viewing.profile.company_name || '-'}</p>
                          <p><strong>Contact Person:</strong> {viewing.profile.contact_person || '-'}</p>
                          <p><strong>Website:</strong> {viewing.profile.website || '-'}</p>
                          <p><strong>Industry:</strong> {viewing.profile.industry || '-'}</p>
                          <p><strong>Company Size:</strong> {viewing.profile.company_size || '-'}</p>
                          <p><strong>Founded:</strong> {viewing.profile.founded_year || '-'}</p>
                        </>
                      ) : (
                        <p>No profile found.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Employers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {employers.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-building fa-2x text-gray-300"></i>
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
                    Active Employers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {employers.length}
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
                    This Month
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {employers.filter(e => {
                      const employerDate = new Date(e.created_at);
                      const currentDate = new Date();
                      return employerDate.getMonth() === currentDate.getMonth() &&
                             employerDate.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-calendar fa-2x text-gray-300"></i>
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
                    Premium Employers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    0
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-crown fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Employer Activity */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Recent Employer Activity</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Employer</th>
                      <th>Activity</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employers.slice(0, 5).map((employer) => (
                      <tr key={employer.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '24px', height: '24px' }}
                            />
                            {employer.full_name}
                          </div>
                        </td>
                        <td>Registered on platform</td>
                        <td>{formatDate(employer.created_at)}</td>
                        <td>
                          <span className="badge badge-success">Completed</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployersList;
