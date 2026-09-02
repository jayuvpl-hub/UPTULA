import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';

const CandidatesList = () => {
  const { candidates, fetchCandidates, loading } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    const filtered = candidates.filter(candidate =>
      candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.phone && candidate.phone.includes(searchTerm))
    );
    setFilteredCandidates(filtered);
  }, [candidates, searchTerm]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      {/* Page Heading */}
      <div className="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 className="h3 mb-0 text-gray-800">Candidates Management</h1>
        <div className="d-flex">
          <input
            type="text"
            className="form-control mr-2"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
          />
          <button className="btn btn-primary">
            <i className="fas fa-download fa-sm text-white-50"></i> Export
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="card shadow mb-4">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">Registered Candidates</h6>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Experience</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">No candidates found</td>
                    </tr>
                  ) : (
                    filteredCandidates.map((candidate) => (
                      <tr key={candidate.id}>
                        <td>{candidate.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              className="img-profile rounded-circle mr-2"
                              src="/img/undraw_profile.svg"
                              alt="..."
                              style={{ width: '32px', height: '32px' }}
                            />
                            {candidate.full_name}
                          </div>
                        </td>
                        <td>{candidate.email}</td>
                        <td>{candidate.phone || 'N/A'}</td>
                        <td>
                          <span className={`badge ${candidate.experience === 'experience' ? 'badge-success' : 'badge-info'}`}>
                            {candidate.experience || 'N/A'}
                          </span>
                        </td>
                        <td>{formatDate(candidate.created_at)}</td>
                        <td>
                          <span className="badge badge-success">Active</span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-primary"
                              title="View Profile"
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

      {/* Statistics Cards */}
      <div className="row">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Candidates
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
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
                    Experienced
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => c.experience === 'experience').length}
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
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Freshers
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => c.experience === 'fresher').length}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-graduation-cap fa-2x text-gray-300"></i>
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
                    This Month
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {candidates.filter(c => {
                      const candidateDate = new Date(c.created_at);
                      const currentDate = new Date();
                      return candidateDate.getMonth() === currentDate.getMonth() &&
                             candidateDate.getFullYear() === currentDate.getFullYear();
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
      </div>
    </>
  );
};

export default CandidatesList;
