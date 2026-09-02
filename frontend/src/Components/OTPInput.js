import React from 'react';

const OTPInput = ({ otp, onChange, onKeyDown, onPaste }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
      {otp.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          value={digit}
          onChange={(e) => onChange(index, e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          maxLength="1"
          style={{
            width: '40px',
            height: '40px',
            textAlign: 'center',
            border: '1.5px solid #e5e7eb',
            borderRadius: '7px',
            fontSize: '18px',
            background: '#f8fafc',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
};

export default OTPInput;