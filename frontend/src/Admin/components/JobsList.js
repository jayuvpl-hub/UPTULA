import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';

const JobsList = () => {
  const { jobs, fetchJobs, loading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    let filtered = jobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'active': 'badge-success',
      'inactive': 'badge-secondary',
      'expired': 'badge-warning',
      'draft': 'badge-info'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  const getJobTypeBadge = (jobType) => {
    const typeClasses = {
      'full-time': 'badge-primary',
      'part-time': 'badge-info',
      'contract': 'badge-warning',
      'internship': 'badge-success',
      'freelance': 'badge-secondary'
    };
    return `badge ${typeClasses[jobType] || 'badge-secondary'}`;
  };

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Jobs Management</h1>
        <div className="d-flex">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          <select
            className="form-control mr-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="draft">Draft</option>
          </select>
          <button className="btn btn-primary">
            <i className="fas fa-download fa-sm text-white-50"></i> Export
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Published Jobs</h6>
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
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Salary</th>
                    <th>Posted Date</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center">No jobs found</td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id}>
                        <td>{job.id}</td>
                        <td>
                          <div>
                            <strong>{job.title}</strong>
                            <br />
                            <small className="text-muted">
                              {job.description.length > 100 
                                ? `${job.description.substring(0, 100)}...` 
                                : job.description
                              }
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '32px', height: '32px' }}
                            />
                            {job.company_name}
                          </div>
                        </td>
                        <td>{job.location}</td>
                        <td>
                          <span className={getJobTypeBadge(job.job_type)}>
                            {job.job_type}
                          </span>
                        </td>
                        <td>
                          {job.salary_min && job.salary_max 
                            ? `$${job.salary_min} - $${job.salary_max}`
                            : 'Not specified'
                          }
                        </td>
                        <td>{formatDate(job.created_at)}</td>
                        <td>
                          <span className={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-info">
                            {job.application_count || 0}
                          </span>
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
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              title="View Applications"
                            >
                              <i className="fas fa-users"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-warning"
                              title="Toggle Status"
                            >
                              <i className="fas fa-toggle-on"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
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
                    Total Jobs
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {jobs.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-briefcase fa-2x text-gray-300"></i>
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
                    Active Jobs
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {jobs.filter(j => j.status === 'active').length}
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
                    {jobs.filter(j => {
                      const jobDate = new Date(j.created_at);
                      const currentDate = new Date();
                      return jobDate.getMonth() === currentDate.getMonth() &&
                             jobDate.getFullYear() === currentDate.getFullYear();
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
                    Total Applications
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {jobs.reduce((total, job) => total + (job.application_count || 0), 0)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Categories Breakdown */}
      <div className="row">
        <div className="col-lg-6">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Jobs by Type</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Job Type</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['full-time', 'part-time', 'contract', 'internship', 'freelance'].map(type => {
                      const count = jobs.filter(j => j.job_type === type).length;
                      const percentage = jobs.length > 0 ? ((count / jobs.length) * 100).toFixed(1) : 0;
                      return (
                        <tr key={type}>
                          <td>
                            <span className={getJobTypeBadge(type)}>
                              {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td>{count}</td>
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
              <h6 className="m-0 font-weight-bold text-primary">Recent Job Postings</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Posted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.slice(0, 5).map((job) => (
                      <tr key={job.id}>
                        <td>
                          <div>
                            <strong>{job.title}</strong>
                            <br />
                            <small className="text-muted">{job.location}</small>
                          </div>
                        </td>
                        <td>{job.company_name}</td>
                        <td>{formatDate(job.created_at)}</td>
                        <td>
                          <span className={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
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

export default JobsList;
