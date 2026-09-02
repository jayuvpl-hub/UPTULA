import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

const WishlistButton = ({ jobId, style = {} }) => {
    const { user } = useAuth();
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user && user.role === 'seeker' && jobId) {
            checkWishlistStatus();
        } else {
            setInWishlist(false);
        }
    }, [user, jobId]);

    const closeLoginPopup = () => {
        const signinModal = document.getElementById('signin');
        if (signinModal) {
            signinModal.classList.remove('in');
            signinModal.style.display = 'none';
            signinModal.removeEventListener('mousedown', handleOutsideClick);
        }
        document.body.classList.remove('modal-open');
        document.querySelectorAll('.modal-backdrop').forEach((b) => {
            b.removeEventListener('mousedown', closeLoginPopup);
            if (b.parentNode) b.parentNode.removeChild(b);
        });
    };

    const handleOutsideClick = (e) => {
        const signinModal = document.getElementById('signin');
        if (!signinModal) return;
        // Close only when the click is on the overlay, not inside the dialog.
        if (e.target === signinModal) closeLoginPopup();
    };

    const openLoginPopup = () => {
        if (typeof window === 'undefined') return;

        const signinModal = document.getElementById('signin');
        if (!signinModal) return;

        window.dispatchEvent(new Event('uptula:open-default-signin'));

        if (window.jQuery && typeof window.jQuery('#signin').modal === 'function') {
            window.jQuery('#signin').modal('show');
            return;
        }

        signinModal.style.display = 'block';
        signinModal.classList.add('in');
        document.body.classList.add('modal-open');

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.addEventListener('mousedown', closeLoginPopup);
        document.body.appendChild(backdrop);
        signinModal.addEventListener('mousedown', handleOutsideClick);

        const seekerPanel = document.getElementById('seeker-signin-panel');
        const providerPanel = document.getElementById('provider-signin-panel');
        if (seekerPanel) seekerPanel.style.display = 'block';
        if (providerPanel) providerPanel.style.display = 'none';

        const forgotPanel = document.getElementById('forgot-inline-panel');
        if (forgotPanel) forgotPanel.style.display = 'none';
    };

    const checkWishlistStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/wishlist/check/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setInWishlist(data.inWishlist);
            }
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    };

    const handleToggleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            openLoginPopup();
            return;
        }

        if (user.role !== 'seeker') {
            setMessage('Only candidates can save jobs to the wishlist.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                openLoginPopup();
                return;
            }

            if (inWishlist) {
                // Remove from wishlist
                const response = await fetch(`${API_BASE_URL}/api/wishlist/${jobId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setInWishlist(false);
                    setMessage('Removed from wishlist.');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    setMessage(errorData.message || 'Failed to remove from wishlist.');
                }
            } else {
                // Add to wishlist
                const response = await fetch(`${API_BASE_URL}/api/wishlist/${jobId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    setInWishlist(true);
                    setMessage('Added to wishlist!');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    setMessage(errorData.message || 'Failed to add to wishlist.');
                }
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            setMessage('An error occurred. Please try again.');
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <>
            {message && (
                <div className={`alert ${message.includes('Added') ? 'alert-success' : 'alert-info'}`}
                    style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, minWidth: '250px' }}>
                    {message}
                </div>
            )}
            <button
                onClick={handleToggleWishlist}
                disabled={loading}
                className="btn"
                style={{
                    ...style,
                    backgroundColor: 'transparent',
                    color: inWishlist ? '#ff4757' : '#999',
                    border: 'none',
                    borderRadius: '0',
                    width: 'auto',
                    height: 'auto',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: 'none',
                    outline: 'none'
                }}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <i className={`ti-heart ${inWishlist ? '' : '-outline'}`} style={{ fontSize: '20px', color: inWishlist ? '#ff4757' : '#999' }}></i>
            </button>
        </>
    );
};

export default WishlistButton;
