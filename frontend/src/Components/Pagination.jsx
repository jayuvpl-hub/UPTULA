import React from 'react';

/** Pagination controls (same layout/styling as AllJobs job list pagination). */
export default function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="utf_flexbox_area padd-0" style={{ marginTop: '30px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (page > 1) setPage(page - 1);
          }}
          disabled={page === 1}
          className={`page-item ${page === 1 ? 'disabled' : ''}`}
          style={{
            padding: '8px 12px',
            backgroundColor: page === 1 ? '#f3f4f6' : 'white',
            color: page === 1 ? '#9ca3af' : '#4066D4',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            height: '36px'
          }}
          title="Previous"
        >
          <span aria-hidden="true" style={{ fontSize: '16px' }}>
            «
          </span>
        </button>

        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => setPage(idx + 1)}
            className={`page-item ${page === idx + 1 ? 'active' : ''}`}
            style={{
              padding: '8px 12px',
              backgroundColor: page === idx + 1 ? '#4066D4' : 'white',
              color: page === idx + 1 ? 'white' : '#4a5568',
              border: '1px solid',
              borderColor: page === idx + 1 ? '#4066D4' : '#e1e5e9',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              minWidth: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {idx + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            if (page < totalPages) setPage(page + 1);
          }}
          disabled={page === totalPages}
          className={`page-item ${page === totalPages ? 'disabled' : ''}`}
          style={{
            padding: '8px 12px',
            backgroundColor: page === totalPages ? '#f3f4f6' : 'white',
            color: page === totalPages ? '#9ca3af' : '#4066D4',
            border: '1px solid #e1e5e9',
            borderRadius: '6px',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '36px',
            height: '36px'
          }}
          title="Next"
        >
          <span aria-hidden="true" style={{ fontSize: '16px' }}>
            »
          </span>
        </button>
      </div>
    </div>
  );
}
