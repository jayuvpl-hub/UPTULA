import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

const getStoredUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (_) {
        return {};
    }
};

const buildAbsoluteUrl = (value) => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('data:')) {
        return value;
    }
    return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const AUTH_TIMEOUT_MS = 12000;

        const fetchWithTimeout = (url, options = {}) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
            return fetch(url, { ...options, signal: controller.signal }).finally(() => {
                clearTimeout(timeoutId);
            });
        };

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUserRaw = localStorage.getItem('user');

            try {
                if (token && storedUserRaw) {
                    let parsedStoredUser = null;
                    try {
                        parsedStoredUser = JSON.parse(storedUserRaw);
                    } catch {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        return;
                    }

                    try {
                        const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const verifiedUser = data.user;

                            const profilePicture = localStorage.getItem('userProfilePicture');
                            if (profilePicture) {
                                verifiedUser.profilePictureUrl = profilePicture;
                            }

                            setUser(verifiedUser);
                            loadProfileData(token, verifiedUser.role).catch((err) => {
                                console.error('Error loading profile data:', err);
                            });
                        } else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            setUser(null);
                        }
                    } catch (error) {
                        console.error('Error verifying token:', error);

                        const isNetworkError =
                            error.name === 'AbortError' ||
                            error.message.includes('Failed to fetch');

                        if (isNetworkError) {
                            const profilePicture = localStorage.getItem('userProfilePicture');
                            if (profilePicture) {
                                parsedStoredUser.profilePictureUrl = profilePicture;
                            }

                            setUser(parsedStoredUser);
                            loadProfileData(token, parsedStoredUser.role).catch((err) => {
                                console.error('Error loading profile data:', err);
                            });
                        } else {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            setUser(null);
                        }
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (userData, token) => {
        const profilePicture = localStorage.getItem('userProfilePicture');
        if (profilePicture) {
            userData.profilePictureUrl = profilePicture;
        }

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        await loadProfileData(token, userData.role);
    };

    const loadProfileData = async (token, roleOverride) => {
        try {
            const storedUser = getStoredUser();
            const role = roleOverride || storedUser.role;

            if (role === 'provider') {
                const response = await fetch(`${API_BASE_URL}/api/employer/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const profile = data.profile || data;
                    const rawLogo = profile.logoUrl || profile.logo_url || '';
                    const logoUrl = buildAbsoluteUrl(rawLogo);

                    // FIX 6: whether a real company profile exists (gates job posting).
                    // Prefer the backend's explicit flag; fall back leniently (treat a
                    // present company name as complete) so we don't wrongly gate
                    // employers when running against a backend that predates this flag.
                    const hasFlag = typeof profile.hasCompanyProfile === 'boolean';
                    const companyProfileComplete = hasFlag
                        ? profile.hasCompanyProfile
                        : !!(profile.companyName || profile.company_name);

                    const employerProfile = {
                        type: 'employer',
                        companyName: profile.companyName || profile.company_name || storedUser.fullName || '',
                        contactPerson: profile.contactPerson || profile.contact_person || storedUser.fullName || '',
                        email: profile.email || profile.company_email || storedUser.email || '',
                        phone: profile.phone || storedUser.phone || '',
                        address: profile.address || '',
                        website: profile.website || '',
                        industry: profile.industry || '',
                        companySize: profile.companySize || profile.company_size || '',
                        description: profile.description || '',
                        linkedin: profile.linkedin || '',
                        twitter: profile.twitter || '',
                        facebook: profile.facebook || '',
                        google: profile.google || '',
                        foundedYear: profile.foundedYear || profile.founded_year || '',
                        companyType: profile.companyType || profile.company_type || '',
                        profilePictureUrl: logoUrl,
                        logoUrl,
                        rawLogoPath: rawLogo,
                        companyProfileComplete
                    };

                    if (logoUrl) {
                        localStorage.setItem('employerLogoUrl', logoUrl);
                    } else {
                        localStorage.removeItem('employerLogoUrl');
                    }

                    setProfileData(employerProfile);
                    return employerProfile;
                }

                return null;
            }

            const response = await fetch(`${API_BASE_URL}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const profile = data.profile;
                const profilePictureUrl = profile.profilePicture || localStorage.getItem('userProfilePicture') || '';
                const fullProfilePictureUrl = buildAbsoluteUrl(profilePictureUrl);

                const joinList = (val) =>
                    Array.isArray(val) ? val.join(', ') : (val || '');

                const candidateProfile = {
                    type: 'candidate',
                    name: profile.name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    address: profile.address || '',
                    gender: profile.gender || '',
                    languages: joinList(profile.languages),
                    dateOfBirth: profile.dateOfBirth || '',
                    profilePictureUrl: fullProfilePictureUrl,
                    facebook: profile.facebook || '',
                    twitter: profile.twitter || '',
                    linkedin: profile.linkedin || '',
                    google: profile.google || '',
                    preferredJobRole: profile.preferredJobRole || '',
                    preferredLocation: profile.preferredLocation || '',
                    bio: profile.bio || '',
                    resume: profile.resume || '',
                    skills: joinList(profile.skills),
                    experience: joinList(profile.experience),
                    education: joinList(profile.education),
                    currentSalary: profile.currentSalary || '',
                    expectedSalary: profile.expectedSalary || '',
                    noticePeriod: profile.noticePeriod || '',
                    employmentType: profile.employmentType || '',
                    categories: profile.categories || [],
                    subcategories: profile.subcategories || [],
                    profilePicture: null
                };

                if (fullProfilePictureUrl) {
                    localStorage.setItem('userProfilePicture', fullProfilePictureUrl);
                }

                setProfileData(candidateProfile);
                return candidateProfile;
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
        return null;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userProfilePicture');
        localStorage.removeItem('employerLogoUrl');
        setUser(null);
        setProfileData(null);
    };

    const value = {
        user,
        profileData,
        loadProfileData,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
