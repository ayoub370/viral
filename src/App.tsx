import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreditCard as Edit2, Settings as SettingsIcon, Search, Users, MessageCircle } from 'lucide-react';
import { apiClient } from './lib/api';
import { isPasswordLeaked } from './lib/hibp';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Settings } from './pages/Settings';
import VideoFeed from './components/VideoFeed';
import CreatorProfile from './pages/CreatorProfile';
import Comments from './pages/Comments';
import SearchPage from './pages/Search';
import FriendsPage from './pages/Friends';
import LiveSpectator from './pages/LiveSpectator';
import CameraPage from './pages/Camera';
import { BottomNav } from './components/BottomNav';
import { getCurrencySymbol, getCurrencyForCountry } from './lib/currency';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  balance: number;
  profilePhotoUrl?: string;
  createdAt: string;
  country?: string;
  language?: string;
  theme?: string;
  notifications_enabled?: boolean;
  two_factor_enabled?: boolean;
  withdrawal_method?: string;
  stripe_verified?: boolean;
  numeric_user_id?: number;
}



function App() {
  const getPageFromPath = (path: string): string => {
    const routes: Record<string, string> = {
      '/': 'login',
      '/signup': 'signup',
      '/signin': 'signin',
      '/verify-otp': 'verify-otp',
      '/verify-login-otp': 'verify-login-otp',
      '/dashboard': 'dashboard',
      '/search': 'search',
      '/friends': 'friends',
      '/live': 'live',
      '/profile': 'profile',
      '/settings': 'settings',
      '/about': 'about',
      '/privacy-policy': 'privacy-policy',
      '/terms': 'terms',
      '/contact': 'contact'
    };
    return routes[path] || 'login';
  };

  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('/raf,360x360,075,t,fafafa_ca443f4786.jpg');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [balance, setBalance] = useState(0);
  const [showWithdrawalError, setShowWithdrawalError] = useState(false);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('test@example.com');
  const [userId, setUserId] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeAccountStatus, setStripeAccountStatus] = useState<string | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeMessage, setStripeMessage] = useState('');
  const [pendingVerificationData, setPendingVerificationData] = useState<{
    email: string;
    username: string;
    fullName: string;
  } | null>(null);
  const [pendingLoginEmail, setPendingLoginEmail] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  const navigate = (page: string) => {
    const pathMap: Record<string, string> = {
      'login': '/',
      'signup': '/signup',
      'signin': '/signin',
      'verify-otp': '/verify-otp',
      'verify-login-otp': '/verify-login-otp',
      'dashboard': '/dashboard',
      'search': '/search',
      'friends': '/friends',
      'live': '/live',
      'profile': '/profile',
      'settings': '/settings',
      'about': '/about',
      'privacy-policy': '/privacy-policy',
      'terms': '/terms',
      'contact': '/contact',
      'creator-profile': '/creator-profile',
      'comments': '/comments'
    };
    const path = pathMap[page] || '/';
    window.history.pushState({}, '', path);
    setCurrentPage(page);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      'login': 'Viral - Gagnez de l\'argent en ligne',
      'signup': 'S\'inscrire - Viral',
      'verify-otp': 'Vérification - Viral',
      'signin': 'Se connecter - Viral',
      'verify-login-otp': 'Vérification - Viral',
      'dashboard': 'Dashboard - Viral',
      'search': 'Recherche - Viral',
      'friends': 'Amis - Viral',
      'profile': 'Mon Profil - Viral',
      'settings': 'Paramètres - Viral',
      'about': 'À propos - Viral',
      'privacy-policy': 'Politique de Confidentialité - Viral',
      'terms': 'Conditions d\'Utilisation - Viral',
      'contact': 'Contact - Viral'
    };
    document.title = titles[currentPage] || 'Viral';
  }, [currentPage]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.user) {
        await loadUserProfile(response.user);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const loadStripeAccount = async () => {
    try {
      const response = await apiClient.getStripeAccount();
      const account = response.account;

      if (account) {
        setStripeAccountId(account.stripeAccountId);
        setStripeAccountStatus(account.status);
      }
    } catch (error) {
      console.error('Error loading Stripe account:', error);
    }
  };

  const loadUserProfile = async (profile: User) => {
    try {
      setUserId(profile.id);
      setUsername(profile.username);
      setBalance(profile.balance);
      setUserEmail(profile.email);
      setUser(profile);
      if (profile.profilePhotoUrl) {
        setProfilePhoto(profile.profilePhotoUrl);
      }
      await loadStripeAccount();
      await loadLikedVideos();
      navigate('dashboard');
      setLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const loadLikedVideos = async () => {
    try {
      setLoadingLikedVideos(true);
      const { likedVideos: videos } = await apiClient.getLikedVideos();
      setLikedVideos(videos);
    } catch (error) {
      console.log('Could not load liked videos');
    } finally {
      setLoadingLikedVideos(false);
    }
  };

  const updateUserProfile = async (updates: any) => {
    try {
      await apiClient.updateUserProfile(updates);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const usernameInput = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;

    try {
      const leaked = await isPasswordLeaked(password);
      if (leaked) {
        setMessage('Ce mot de passe a été compromis dans une fuite de données. Veuillez en choisir un autre.');
        setLoading(false);
        return;
      }
      // Send OTP via Resend
      await apiClient.sendSignupOTP(email);

      // Store pending data and go to OTP verification
      setPendingVerificationData({ email, username: usernameInput, fullName });
      setCurrentPage('verify-otp');
      setMessage('Un code de vérification a été envoyé à votre email');
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!pendingVerificationData) {
      setMessage('Données de vérification manquantes');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get('otp') as string;
    const password = formData.get('password') as string;

    try {
      const response = await apiClient.completeSignup(
        pendingVerificationData.email,
        password,
        pendingVerificationData.username,
        pendingVerificationData.fullName,
        otpCode
      );

      if (response.user) {
        const newUser = response.user;
        setUsername(newUser.username);
        setBalance(0);
        setUserId(newUser.id);
        setUserEmail(pendingVerificationData.email);
        setUser({
          id: newUser.id,
          email: pendingVerificationData.email,
          username: newUser.username,
          fullName: newUser.fullName,
          balance: 0,
          createdAt: new Date().toISOString(),
        });
        setPendingVerificationData(null);
        setMessage('Compte créé avec succès!');
        navigate('dashboard');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Code de vérification invalide';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingVerificationData) {
      setMessage('Aucun email en attente de vérification');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiClient.resendOTP(pendingVerificationData.email);
      setMessage('Un nouveau code a été envoyé à votre email');
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de renvoi du code';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // Verify credentials and send OTP
      await apiClient.sendLoginOTP(email, password);

      // Store email and go to OTP verification
      setPendingLoginEmail(email);
      setCurrentPage('verify-login-otp');
      setMessage('Un code de vérification a été envoyé à votre email');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage('');

    try {
      await apiClient.signInWithGoogle();
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : 'Impossible de se connecter avec Google');
    }
  };

  const handleVerifyLoginOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!pendingLoginEmail) {
      setMessage('Email manquant');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get('otp') as string;

    try {
      const response = await apiClient.verifyLoginOTPCode(pendingLoginEmail, otpCode);

      if (response.user) {
        setUser(response.user);
        setUsername(response.user.username);
        setBalance(response.user.balance);
        setUserId(response.user.id);
        setUserEmail(pendingLoginEmail);
        setPendingLoginEmail(null);
        setMessage('Connecté avec succès!');
        navigate('dashboard');
      }
    } catch (error) {
      console.error('Login OTP verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Code de vérification invalide';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginOTP = async () => {
    if (!pendingLoginEmail) {
      setMessage('Aucun email en attente de vérification');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await apiClient.resendOTP(pendingLoginEmail);
      setMessage('Un nouveau code a été envoyé à votre email');
    } catch (error) {
      console.error('Resend login OTP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de renvoi du code';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (showLogoutConfirm) {
      await apiClient.signOut();
      navigate('login');
      setUser(null);
      setUsername('');
      setMessage('');
      setShowLogoutConfirm(false);
      setUserId(null);
      setBalance(0);
      setStripeAccountId(null);
      setStripeAccountStatus(null);
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const createStripeConnectAccount = async () => {
    if (!userId || !userEmail) {
      setStripeMessage('Email or user ID missing');
      return;
    }

    setLoadingStripe(true);
    setStripeMessage('');

    try {
      const response = await apiClient.createStripeAccount(userEmail);

      if (response.success) {
        setStripeAccountId(response.accountId);
        setStripeAccountStatus('pending');
        setStripeMessage('Stripe account created successfully!');

        const onboardingResponse = await apiClient.createOnboardingLink(
          response.accountId,
          window.location.origin + '/profile',
          window.location.origin + '/profile'
        );

        if (onboardingResponse.success) {
          window.open(onboardingResponse.url, '_blank');
        }
      }
    } catch (error) {
      setStripeMessage(error instanceof Error ? error.message : 'Error creating Stripe account');
      console.error('Error:', error);
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleOpenOnboarding = async () => {
    try {
      if (stripeAccountId) {
        const response = await apiClient.createOnboardingLink(
          stripeAccountId,
          window.location.origin + '/profile',
          window.location.origin + '/profile'
        );
        
        if (response.success) {
          window.open(response.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error opening onboarding:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (balance < 10) {
      setShowWithdrawalError(true);
      setTimeout(() => {
        setShowWithdrawalError(false);
      }, 3000);
    } else {
      setWithdrawalLoading(true);
      setShowWithdrawalError(false);

      try {
        const response = await apiClient.createPayout(10);
        
        const newBalance = response.newBalance;
        setBalance(newBalance);

        await updateUserProfile({ balance: newBalance });

        await apiClient.createTransaction({
          type: 'withdrawal',
          balanceChange: -10,
          description: `Withdrawal of ${getCurrencySymbol(getCurrencyForCountry(user?.country))}10 via Stripe (${response.transferId})`
        });

        setWithdrawalSuccess(true);
        setTimeout(() => {
          setWithdrawalSuccess(false);
        }, 5000);
      } catch (error) {
        console.error('Withdrawal error:', error);
        setStripeMessage(error instanceof Error ? error.message : 'Error during withdrawal');
      } finally {
        setWithdrawalLoading(false);
      }
    }
  };


  const [profileActiveTab, setProfileActiveTab] = useState<'post' | 'like'>('post');
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loadingLikedVideos, setLoadingLikedVideos] = useState(false);

  const ProfilePage = () => {
    const isLoggedIn = !!user;

    return (
      <div className="min-h-screen bg-black flex flex-col overflow-y-auto scrollbar-hide">
        {/* Glassmorphism header zone */}
        <div
          style={{
            background: 'linear-gradient(170deg, #1a1a1a 0%, #242424 40%, #111111 100%)',
          }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-3 px-5 pt-12 pb-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Profile</h1>
            <div className="flex-1" />
            <button
              onClick={() => navigate('settings')}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Avatar + bio row */}
          <div className="flex items-center px-5 pt-3 pb-4 gap-4">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border-2 border-gray-700 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(80,80,80,0.6) 0%, rgba(40,40,40,0.8) 100%)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={() => isLoggedIn && navigate('settings')}
            >
              {isLoggedIn ? (
                <img src={profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-9 h-9 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
            </div>

            <span className="text-gray-500 text-base">
              {isLoggedIn && username ? `@${username}` : 'Tap to add bio'}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex justify-around px-5 pb-5">
            <div className="text-center">
              <div className="text-xl font-bold text-white">0</div>
              <div className="text-gray-500 text-sm">Following</div>
            </div>
            <div className="w-px bg-gray-800 self-stretch mx-2" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">0</div>
              <div className="text-gray-500 text-sm">Followers</div>
            </div>
            <div className="w-px bg-gray-800 self-stretch mx-2" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">0</div>
              <div className="text-gray-500 text-sm">Likes</div>
            </div>
          </div>

          {/* Edit profile button */}
          <div className="px-5 pb-5">
            <button
              onClick={() => isLoggedIn ? navigate('settings') : navigate('signin')}
              className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              <Edit2 className="w-4 h-4" />
              Edit profile
            </button>
          </div>
        </div>

        {/* Post / Like tabs */}
        <div className="flex border-b border-gray-800 bg-black">
          <button
            onClick={() => setProfileActiveTab('post')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              profileActiveTab === 'post' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Post
            {profileActiveTab === 'post' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => setProfileActiveTab('like')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              profileActiveTab === 'like' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Like
            {profileActiveTab === 'like' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 bg-black">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Manage your account, check notifications,<br />comment on videos, and more.
              </p>
              <button
                onClick={() => navigate('signin')}
                className="w-44 py-3 rounded-full text-white font-semibold text-sm transition-transform active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                Log in
              </button>
            </div>
          ) : profileActiveTab === 'like' ? (
            loadingLikedVideos ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">Loading likes...</p>
              </div>
            ) : likedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <p className="text-gray-600 text-sm">No likes yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 p-1">
                {likedVideos.map((video: any) => (
                  <div
                    key={video.id}
                    className="relative aspect-[9/16] bg-gray-900 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setSelectedVideoId(video.id);
                      setSelectedCreatorId(video.user_id);
                    }}
                  >
                    <video
                      src={video.videos.medium.url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <p className="text-gray-600 text-sm">No posts yet</p>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-[1000]">
          <div
            className="flex justify-around items-center py-4 px-2"
            style={{
              background: 'rgba(0,0,0,0.9)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <button onClick={() => navigate('dashboard')} className="flex flex-col items-center gap-1 py-2">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button onClick={() => navigate('profile')} className="flex flex-col items-center gap-1 py-2">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DashboardPage = () => null;

  const LoginPage = () => (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative w-full">
        {/* Logo Viral - top left */}
        <img
          src="/viral_logo_transparent.png"
          alt="Viral"
          className="absolute top-5 left-5 z-10"
          style={{ height: '56px', width: 'auto' }}
        />

        {/* Three overlapping photo cards */}
        <div className="relative w-full" style={{ height: '280px', marginTop: '60px' }}>
          {/* Left card - rotated */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: '18px',
              left: '50%',
              width: '118px',
              height: '190px',
              borderRadius: '20px',
              transform: 'translateX(calc(-50% - 82px)) rotate(-10deg)',
              transformOrigin: 'bottom center',
              zIndex: 1,
              boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src="/card-filter-complete.png"
              alt="Filter"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
            <span className="absolute top-2 left-2 text-[9px] font-bold rounded-md px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>✨ Filter</span>
            <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-semibold">Live filters</span>
          </div>

          {/* Center card - straight, front */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: '0',
              left: '50%',
              width: '118px',
              height: '190px',
              borderRadius: '20px',
              transform: 'translateX(-50%)',
              zIndex: 2,
              boxShadow: '0 14px 28px rgba(0,0,0,0.22)',
            }}
          >
            <img
              src="/card-feed-complete.png"
              alt="Feed"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
            <span className="absolute top-2 left-2 text-[9px] font-bold rounded-md px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>🎬 Feed</span>
            <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-semibold">Watch & earn</span>
          </div>

          {/* Right card - rotated */}
          <div
            className="absolute overflow-hidden"
            style={{
              top: '18px',
              left: '50%',
              width: '118px',
              height: '190px',
              borderRadius: '20px',
              transform: 'translateX(calc(-50% + 82px)) rotate(10deg)',
              transformOrigin: 'bottom center',
              zIndex: 1,
              boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src="/card-live-complete.png"
              alt="Live"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)' }} />
            <span className="absolute top-2 left-2 text-[9px] font-bold rounded-md px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>🔴 Live</span>
            <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-semibold">Go live</span>
          </div>
        </div>

        {/* Bottom sheet */}
        <div
          className="w-full mt-auto"
          style={{
            background: '#fff',
            borderRadius: '32px 32px 0 0',
            padding: '28px 24px 24px',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <h1 className="text-center text-2xl font-bold text-black mb-1.5">
            Earn money by <span className="font-extrabold">creating</span>
          </h1>
          <p className="text-center text-sm mb-5" style={{ color: '#8a8a8a' }}>
            Watch videos, go live, and get rewarded
          </p>
          {message && (
            <p className="text-center text-sm text-red-600 mb-4" role="alert">{message}</p>
          )}

          {/* OAuth buttons */}
          <button
            className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 mb-2.5 text-sm font-medium transition-colors"
            style={{ border: '1px solid #e5e5e5', background: '#fff', color: '#222' }}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <button
            className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 mb-2.5 text-sm font-medium transition-colors"
            style={{ border: '1px solid #e5e5e5', background: '#fff', color: '#222' }}
            onClick={() => alert('Apple sign-in coming soon')}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.49-.93 4.01-.8 1.7.18 2.99.86 3.87 2.04-3.55 2.08-2.84 6.66.55 7.93-.62 1.54-1.41 3.06-2.51 4.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-4">
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
            <span className="text-xs" style={{ color: '#aaa' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
          </div>

          {/* Create account button */}
          <button
            onClick={() => navigate('signup')}
            className="w-full rounded-full py-3 text-sm font-semibold transition-colors mb-3.5"
            style={{ background: '#111', color: '#fff' }}
          >
            Create Account
          </button>

          {/* Login link */}
          <p className="text-center text-sm" style={{ color: '#777' }}>
            Already have an account?{' '}
            <span
              className="font-semibold cursor-pointer"
              style={{ color: '#111' }}
              onClick={() => navigate('signin')}
            >
              Log in
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  const SignupPage = () => (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8">
        {/* Title */}
        <h2 className="text-2xl font-semibold text-black text-center mb-8">
          Sign Up
        </h2>

        {/* Message */}
        {message && (
          <div className={`text-center mb-4 text-sm ${message.includes('success') || message.includes('register') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter email..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="Enter username..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter full name..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* Bouton SIGNUP */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-800 transition-colors mt-8 disabled:opacity-50"
          >
            {loading ? 'LOADING...' : 'SIGNUP'}
          </button>
        </form>
      </div>
    </div>
  );


  const SignInPage = () => (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-black text-center mb-8">
          Log In
        </h2>

        {message && (
          <div className={`text-center mb-4 text-sm ${message.includes('success') || message.includes('envoyé') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter email..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password..."
              required
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-800 transition-colors mt-8 disabled:opacity-50"
          >
            {loading ? 'CONNEXION...' : 'LOG IN'}
          </button>
        </form>

        <button
          onClick={() => navigate('login')}
          className="w-full bg-gray-200 text-black font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-300 transition-colors mt-4"
        >
          CANCEL
        </button>
      </div>
    </div>
  );

  const VerifyOTPPage = () => (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-black text-center mb-2">
          Verify Email
        </h2>
        <p className="text-gray-600 text-center text-sm mb-6">
          We sent a code to {pendingVerificationData?.email}
        </p>

        {message && (
          <div className={`text-center mb-4 text-sm ${message.includes('success') || message.includes('envoyé') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Verification Code
            </label>
            <input
              type="text"
              name="otp"
              placeholder="Enter 6-digit code..."
              required
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 text-center text-2xl tracking-widest"
            />
          </div>

          <input type="hidden" name="password" value="" />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-800 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'VERIFYING...' : 'VERIFY'}
          </button>
        </form>

        <button
          type="button"
          onClick={async () => {
            if (pendingVerificationData) {
              setLoading(true);
              try {
                await apiClient.resendOTP(pendingVerificationData.email);
                setMessage('Un nouveau code a été envoyé');
              } catch (error) {
                setMessage('Erreur lors du renvoi');
              }
              setLoading(false);
            }
          }}
          className="w-full text-gray-600 text-sm underline mt-4 py-2"
        >
          Resend code
        </button>

        <button
          onClick={() => {
            setPendingVerificationData(null);
            navigate('signup');
          }}
          className="w-full bg-gray-200 text-black font-semibold py-3 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-300 transition-colors mt-2"
        >
          BACK
        </button>
      </div>
    </div>
  );

  const VerifyLoginOTPPage = () => (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-black text-center mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600 text-center text-sm mb-6">
          We sent a verification code to {pendingLoginEmail}
        </p>

        {message && (
          <div className={`text-center mb-4 text-sm ${message.includes('success') || message.includes('envoyé') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerifyLoginOTP} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Verification Code
            </label>
            <input
              type="text"
              name="otp"
              placeholder="Enter 6-digit code..."
              required
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 text-center text-2xl tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-800 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'VERIFYING...' : 'VERIFY'}
          </button>
        </form>

        <button
          type="button"
          onClick={async () => {
            if (pendingLoginEmail) {
              setLoading(true);
              try {
                await apiClient.resendOTP(pendingLoginEmail);
                setMessage('Un nouveau code a été envoyé');
              } catch (error) {
                setMessage('Erreur lors du renvoi');
              }
              setLoading(false);
            }
          }}
          className="w-full text-gray-600 text-sm underline mt-4 py-2"
        >
          Resend code
        </button>

        <button
          onClick={() => {
            setPendingLoginEmail(null);
            navigate('signin');
          }}
          className="w-full bg-gray-200 text-black font-semibold py-3 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-300 transition-colors mt-2"
        >
          BACK
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Video Feed - affiché seulement sur dashboard */}
      <div style={{ display: currentPage === 'dashboard' ? 'block' : 'none' }}>
        <VideoFeed
          onNavigateToProfile={(userId) => {
            setSelectedCreatorId(userId);
            setCurrentPage('creator-profile');
          }}
          onNavigateToComments={(videoId) => {
            setSelectedVideoId(videoId);
            setCurrentPage('comments');
          }}
          onRequireLogin={() => navigate('signin')}
          onNavigateToLive={() => navigate('live')}
        />
      </div>

      {/* Pages */}
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'search' && (
        <SearchPage
          onNavigateToCreator={(userId) => {
            setSelectedCreatorId(userId);
            navigate('creator-profile');
          }}
          onNavigate={navigate}
        />
      )}
      {currentPage === 'friends' && (
        <FriendsPage
          onNavigateToCreator={(userId) => {
            setSelectedCreatorId(userId);
            navigate('creator-profile');
          }}
          onNavigate={navigate}
        />
      )}
      {currentPage === 'live' && (
        <LiveSpectator
          onBack={() => navigate('dashboard')}
          userId={user?.id || undefined}
          username={user?.username || undefined}
          profilePhotoUrl={profilePhoto}
        />
      )}
      {currentPage === 'camera' && (
        <CameraPage
          onBack={() => navigate('dashboard')}
          userId={user?.id || undefined}
          username={user?.username || undefined}
          profilePhotoUrl={profilePhoto}
        />
      )}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'signin' && <SignInPage />}
      {currentPage === 'verify-otp' && <VerifyOTPPage />}
      {currentPage === 'verify-login-otp' && <VerifyLoginOTPPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'settings' && (
        <Settings
          onBack={() => navigate('profile')}
          user={user}
          onSignOut={handleSignOut}
          balance={balance}
          stripeAccountId={stripeAccountId}
          stripeAccountStatus={stripeAccountStatus}
          handleWithdrawal={handleWithdrawal}
          withdrawalLoading={withdrawalLoading}
          showWithdrawalError={showWithdrawalError}
          withdrawalSuccess={withdrawalSuccess}
          createStripeConnectAccount={createStripeConnectAccount}
          loadingStripe={loadingStripe}
          stripeMessage={stripeMessage}
          handleOpenOnboarding={handleOpenOnboarding}
          onNavigate={navigate}
        />
      )}
      {currentPage === 'about' && <About onBack={() => navigate('login')} />}
      {currentPage === 'privacy-policy' && <PrivacyPolicy onBack={() => navigate('login')} />}
      {currentPage === 'terms' && <TermsOfService onBack={() => navigate('login')} />}
      {currentPage === 'contact' && <Contact onBack={() => navigate('login')} userEmail={userEmail} />}
      {currentPage === 'creator-profile' && selectedCreatorId && (
        <CreatorProfile
          userId={selectedCreatorId}
          onBack={() => {
            setSelectedCreatorId(null);
            setCurrentPage('dashboard');
          }}
          onNavigateToComments={(videoId) => {
            setSelectedVideoId(videoId);
            setCurrentPage('comments');
          }}
        />
      )}
      {currentPage === 'comments' && selectedVideoId && (
        <Comments
          videoId={selectedVideoId}
          onBack={() => {
            setSelectedVideoId(null);
            setCurrentPage('dashboard');
          }}
        />
      )}

      {/* Shared BottomNav for all main pages (not settings/auth/etc.) */}
      {['dashboard', 'search', 'camera', 'friends', 'profile', 'live'].includes(currentPage) && (
        <BottomNav currentPage={currentPage} onNavigate={navigate} />
      )}
    </>
  );
}

export default App;