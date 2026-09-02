import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
const inputStyle = {
  padding: '10px 12px',
  border: '2px solid #e8eaf6',
  borderRadius: 8,
  fontSize: 14,
  minWidth: 160,
};

function CategoryManagement() {
  const [tab, setTab] = useState('categories');
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [catForm, setCatForm] = useState({ id: null, name: '', description: '', status: 'active', type: 'technical' });
  const [subForm, setSubForm] = useState({
    id: null,
    categoryId: '',
    name: '',
    description: '',
    status: 'active',
  });

  const token = () => localStorage.getItem('adminToken');
  const headers = () => ({
    Authorization: `Bearer ${token()}`,
    'Content-Type': 'application/json',
  });

  const loadStats = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/categories/admin/stats`, { headers: headers() });
    if (res.ok) setStats(await res.json());
  }, []);

  const loadCategories = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`${API_BASE_URL}/api/categories/admin/categories?${params}`, {
      headers: headers(),
    });
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories || []);
    }
  }, [q, statusFilter]);

  const loadSubcategories = useCallback(async () => {
    const params = new URLSearchParams({ limit: '200' });
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    if (filterCategoryId) params.set('categoryId', filterCategoryId);
    const res = await fetch(`${API_BASE_URL}/api/categories/admin/subcategories?${params}`, {
      headers: headers(),
    });
    if (res.ok) {
      const data = await res.json();
      setSubcategories(data.subcategories || []);
    }
  }, [q, statusFilter, filterCategoryId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([loadStats(), loadCategories(), loadSubcategories()]);
    } catch (e) {
      setMessage('Failed to load data');
    }
    setLoading(false);
  }, [loadStats, loadCategories, loadSubcategories]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  const saveCategory = async (e) => {
    e.preventDefault();
    const body = {
      name: catForm.name,
      description: catForm.description,
      status: catForm.status,
      type: catForm.type,
    };
    const url = catForm.id
      ? `${API_BASE_URL}/api/categories/admin/categories/${catForm.id}`
      : `${API_BASE_URL}/api/categories/admin/categories`;
    const res = await fetch(url, {
      method: catForm.id ? 'PUT' : 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? 'Category saved' : data.message || 'Save failed');
    if (res.ok) {
      setCatForm({ id: null, name: '', description: '', status: 'active', type: 'technical' });
      refresh();
    }
  };

  const saveSubcategory = async (e) => {
    e.preventDefault();
    if (!subForm.categoryId) {
      setMessage('Select a parent category');
      return;
    }
    const body = {
      name: subForm.name,
      description: subForm.description,
      status: subForm.status,
      categoryId: Number(subForm.categoryId),
    };
    let url;
    let method;
    if (subForm.id) {
      url = `${API_BASE_URL}/api/categories/admin/subcategories/${subForm.id}`;
      method = 'PUT';
    } else {
      url = `${API_BASE_URL}/api/categories/admin/categories/${subForm.categoryId}/subcategories`;
      method = 'POST';
    }
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? 'Subcategory saved' : data.message || 'Save failed');
    if (res.ok) {
      setSubForm({ id: null, categoryId: '', name: '', description: '', status: 'active' });
      refresh();
    }
  };

  const toggleCategoryStatus = async (cat) => {
    const next = cat.status === 'active' ? 'inactive' : 'active';
    await fetch(`${API_BASE_URL}/api/categories/admin/categories/${cat.id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: next }),
    });
    refresh();
  };

  const toggleSubStatus = async (sub) => {
    const next = sub.status === 'active' ? 'inactive' : 'active';
    await fetch(`${API_BASE_URL}/api/categories/admin/subcategories/${sub.id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ status: next }),
    });
    refresh();
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Delete/deactivate "${cat.name}"?`)) return;
    await fetch(`${API_BASE_URL}/api/categories/admin/categories/${cat.id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    refresh();
  };

  const deleteSubcategory = async (sub) => {
    if (!window.confirm(`Delete/deactivate "${sub.name}"?`)) return;
    await fetch(`${API_BASE_URL}/api/categories/admin/subcategories/${sub.id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    refresh();
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>Category Management</h2>
      {message && <p style={{ color: '#2c5282' }}>{message}</p>}
      {stats?.stats && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <Stat label="Categories" value={stats.stats.total_categories} />
          <Stat label="Active categories" value={stats.stats.active_categories} />
          <Stat label="Subcategories" value={stats.stats.total_subcategories} />
          <Stat label="Users tagged" value={stats.stats.users_with_category} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setTab('categories')} style={tabBtn(tab === 'categories')}>
          Categories
        </button>
        <button type="button" onClick={() => setTab('subcategories')} style={tabBtn(tab === 'subcategories')}>
          Subcategories
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} style={inputStyle} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {tab === 'subcategories' && (
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            style={inputStyle}
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button type="button" onClick={refresh} style={{ ...inputStyle, background: '#36b9cc', color: '#fff', border: 0 }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : tab === 'categories' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <form onSubmit={saveCategory} style={{ background: '#f8f9fc', padding: 16, borderRadius: 12 }}>
            <h3>{catForm.id ? 'Edit category' : 'New category'}</h3>
            <input
              required
              placeholder="Name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            />
            <textarea
              placeholder="Description"
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            />
            <select
              value={catForm.type}
              onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            >
              <option value="technical">Technical</option>
              <option value="non_technical">Non Technical</option>
            </select>
            <select
              value={catForm.status}
              onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="submit" style={{ padding: '10px 16px', background: '#1cc88a', color: '#fff', border: 0, borderRadius: 8 }}>
              Save
            </button>
          </form>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#edf2f7' }}>
                <th style={th}>Name</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={th}>Subs</th>
                <th style={th}>Users</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={td}>{c.name}</td>
                  <td style={td}>{c.type === 'non_technical' ? 'Non Technical' : 'Technical'}</td>
                  <td style={td}>{c.status}</td>
                  <td style={td}>{c.subcategory_count}</td>
                  <td style={td}>{c.user_count}</td>
                  <td style={td}>
                    <button type="button" onClick={() => setCatForm({ id: c.id, name: c.name, description: c.description || '', status: c.status, type: c.type || 'technical' })}>Edit</button>
                    {' '}
                    <button type="button" onClick={() => toggleCategoryStatus(c)}>Toggle</button>
                    {' '}
                    <button type="button" onClick={() => deleteCategory(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          <form onSubmit={saveSubcategory} style={{ background: '#f8f9fc', padding: 16, borderRadius: 12 }}>
            <h3>{subForm.id ? 'Edit subcategory' : 'New subcategory'}</h3>
            <select
              required
              value={subForm.categoryId}
              onChange={(e) => setSubForm({ ...subForm, categoryId: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            >
              <option value="">Parent category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Name"
              value={subForm.name}
              onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            />
            <select
              value={subForm.status}
              onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
              style={{ ...inputStyle, width: '100%', marginBottom: 8 }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="submit" style={{ padding: '10px 16px', background: '#1cc88a', color: '#fff', border: 0, borderRadius: 8 }}>
              Save
            </button>
          </form>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#edf2f7' }}>
                <th style={th}>Category</th>
                <th style={th}>Subcategory</th>
                <th style={th}>Status</th>
                <th style={th}>Users</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s) => (
                <tr key={s.id}>
                  <td style={td}>{s.category_name}</td>
                  <td style={td}>{s.name}</td>
                  <td style={td}>{s.status}</td>
                  <td style={td}>{s.user_count}</td>
                  <td style={td}>
                    <button
                      type="button"
                      onClick={() =>
                        setSubForm({
                          id: s.id,
                          categoryId: String(s.category_id),
                          name: s.name,
                          description: s.description || '',
                          status: s.status,
                        })
                      }
                    >
                      Edit
                    </button>
                    {' '}
                    <button type="button" onClick={() => toggleSubStatus(s)}>Toggle</button>
                    {' '}
                    <button type="button" onClick={() => deleteSubcategory(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th = { padding: 10, textAlign: 'left', fontSize: 13 };
const td = { padding: 10, borderTop: '1px solid #e8eaf6', fontSize: 13 };
const tabBtn = (active) => ({
  padding: '10px 16px',
  border: 0,
  borderRadius: 8,
  background: active ? '#36b9cc' : '#e8eaf6',
  color: active ? '#fff' : '#333',
  cursor: 'pointer',
  fontWeight: 700,
});

function Stat({ label, value }) {
  return (
    <div style={{ background: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: 12, color: '#718096' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default CategoryManagement;
