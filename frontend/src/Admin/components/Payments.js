import React, { useEffect, useState } from 'react';
import { useAdmin } from '../AdminContext';
import { API_BASE_URL } from '../../config/api';

const Payments = () => {
  const { token } = useAdmin();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | boolean | resume

  const loadPayments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (query) params.set('q', query);

      if (filter === 'boolean') {
        params.set('q', (query ? query + ' ' : '') + 'boolean');
      }
      if (filter === 'resume') {
        params.set('q', (query ? query + ' ' : '') + 'resume scoring');
      }

      // 🔥 FIXED BASE URL
      const resp = await fetch(`${API_BASE_URL}/api/admin/payments?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resp.ok) {
        const data = await resp.json();
        setPayments(data.payments || []);
      } else {
        setMessage('Failed to load payments');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      setMessage('Failed to load payments');
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line
  }, [filter]);

  const onSearch = (e) => {
    e.preventDefault();
    loadPayments();
  };

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3 d-flex align-items-center justify-content-between">
        <h6 className="m-0 font-weight-bold text-primary">Payments</h6>
        <div>
          <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="boolean">Boolean Search</option>
            <option value="resume">Resume Scoring</option>
          </select>
        </div>
      </div>

      <div className="card-body">
        {message && <div className="alert alert-danger">{message}</div>}

        <form className="form-inline mb-3" onSubmit={onSearch}>
          <input
            className="form-control mr-2"
            placeholder="Search description, name, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered" width="100%" cellSpacing="0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan="8">No payments found.</td></tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.full_name}</td>
                      <td>{p.email}</td>
                      <td>{p.payment_type}</td>
                      <td>{p.status}</td>
                      <td>{p.amount} {p.currency}</td>
                      <td>{p.description}</td>
                      <td>{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
