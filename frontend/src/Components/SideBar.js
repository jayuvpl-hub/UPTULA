import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBriefcase,
  FaFileAlt,
  FaComments,
  FaHeart,
  FaUserEdit,
  FaKey,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { user, profileData, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const storedEmployerLogo = localStorage.getItem('employerLogoUrl');
  const storedCandidatePhoto = localStorage.getItem('userProfilePicture');

  // Determine avatar source with proper priority (same logic as Header)
  const getAvatarSrc = () => {
    if (imageError) {
      return "/assets/img/user-profile.png";
    }
    
    // Priority 1: profileData profilePictureUrl
    if (profileData?.profilePictureUrl) {
      return profileData.profilePictureUrl;
    }
    
    // Priority 2: Based on profile type
    if (profileData?.type === 'employer' && storedEmployerLogo) {
      return storedEmployerLogo;
    }
    if (profileData?.type === 'candidate' && storedCandidatePhoto) {
      return storedCandidatePhoto;
    }
    
    // Priority 3: Fallback to stored values
    if (storedEmployerLogo) {
      return storedEmployerLogo;
    }
    if (storedCandidatePhoto) {
      return storedCandidatePhoto;
    }
    
    // Priority 4: User profilePictureUrl
    if (user?.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    
    // Priority 5: Default image
    return "/assets/img/user-profile.png";
  };

  const avatarSrc = getAvatarSrc();

  // Reset image error when user or profileData changes
  useEffect(() => {
    setImageError(false);
  }, [user, profileData]);

  const handleLogout = (e) => {
    e?.preventDefault();
    logout();
    setTimeout(() => {
      navigate('/');
    }, 0);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    setShowProfileModal(true);
  };

  return (
    <>
      <style>{`
        .sidebar-transparent {
          width: 250px;
          min-height: calc(100vh - 140px);
          background: #2c3e50;
          border-right: 1px solid rgba(0, 0, 0, 0.1);
          padding: 0;
          position: fixed;
          left: 0;
          top: 140px;
          overflow-y: auto;
          z-index: 100;
          display: flex;
          flex-direction: column;
        }
        .sidebar-profile-section {
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .sidebar-profile-section:hover {
          background: rgba(38, 174, 97, 0.2);
        }
        .sidebar-profile-picture {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #26AE61;
          margin: 0 auto 10px;
          display: block;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .sidebar-profile-picture:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(38, 174, 97, 0.3);
        }
        .sidebar-profile-name {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }
        .sidebar-menu-item {
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ecf0f1;
          font-size: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-decoration: none;
        }
        .sidebar-menu-item:hover {
          background: rgba(38, 174, 97, 0.2);
          color: #26AE61;
        }
        .sidebar-menu-item svg {
          font-size: 16px;
          width: 20px;
          text-align: center;
          color: #ecf0f1;
        }
        .sidebar-menu-item:hover svg {
          color: #26AE61;
        }
        .sidebar-logout {
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ecf0f1;
          font-size: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          background: #2c3e50;
          border-left: none;
          border-right: none;
          border-bottom: none;
        }
        .sidebar-logout:hover {
          background: rgba(38, 174, 97, 0.2);
          color: #26AE61;
        }
        .sidebar-logout svg {
          font-size: 16px;
          color: #ecf0f1;
        }
        .sidebar-logout:hover svg {
          color: #26AE61;
        }
        .profile-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .profile-modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        .profile-modal-picture {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #26AE61;
          margin: 0 auto 20px;
          display: block;
        }
        .profile-modal-name {
          font-size: 20px;
          font-weight: 600;
          color: #334e6f;
          margin-bottom: 10px;
        }
        .profile-modal-email {
          font-size: 14px;
          color: #707f8c;
          margin-bottom: 20px;
        }
        .profile-modal-close {
          background: #26AE61;
          color: white;
          border: none;
          padding: 10px 30px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .profile-modal-close:hover {
          background: #1e8d4d;
          transform: translateY(-2px);
        }
        @media (max-width: 768px) {
          .sidebar-transparent {
            display: none;
          }
        }
      `}</style>

      <aside className="sidebar-transparent">
        {/* Profile Picture Section */}
        <div className="sidebar-profile-section" onClick={handleProfileClick}>
          <img
            src={avatarSrc}
            alt={user?.fullName || 'User'}
            className="sidebar-profile-picture"
            onError={(e) => {
              if (e.target.src !== "/assets/img/user-profile.png") {
                setImageError(true);
                e.target.src = "/assets/img/user-profile.png";
              }
            }}
            onLoad={() => {
              setImageError(false);
            }}
          />
          <p className="sidebar-profile-name">{user?.fullName || 'User'}</p>
        </div>

        {/* Menu */}
        <ul className="sidebar-menu">
          <li>
            <Link to="/" className="sidebar-menu-item">
              <FaHome /> Home
            </Link>
          </li>

          <li>
            <Link to="/candidate/applied-jobs" className="sidebar-menu-item">
              <FaBriefcase /> Applied Jobs
            </Link>
          </li>

          <li>
            <Link to="/candidate/create-resume" className="sidebar-menu-item">
              <FaFileAlt /> Create Resume
            </Link>
          </li>

          <li>
            <Link to="/candidate/profile-tools" className="sidebar-menu-item">
              <FaFileAlt /> Resume Parser & Category
            </Link>
          </li>

          <li>
            <Link to="/candidate/chat" className="sidebar-menu-item">
              <FaComments /> Chat Inbox
            </Link>
          </li>

          <li>
            <Link to="/candidate/wishlist" className="sidebar-menu-item">
              <FaHeart /> Wishlist
            </Link>
          </li>

          <li>
            <Link to="/profile" className="sidebar-menu-item">
              <FaUserEdit /> Edit Profile
            </Link>
          </li>

          <li>
            <Link to="/candidate/change-password" className="sidebar-menu-item">
              <FaKey /> Change Password
            </Link>
          </li>
        </ul>

        {/* Logout */}
        <div className="sidebar-logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </div>
      </aside>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={avatarSrc}
              alt={user?.fullName || 'User'}
              className="profile-modal-picture"
              onError={(e) => {
                if (e.target.src !== "/assets/img/user-profile.png") {
                  setImageError(true);
                  e.target.src = "/assets/img/user-profile.png";
                }
              }}
            />
            <h3 className="profile-modal-name">{user?.fullName || 'User'}</h3>
            <p className="profile-modal-email">{user?.email || ''}</p>
            <button className="profile-modal-close" onClick={() => setShowProfileModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
