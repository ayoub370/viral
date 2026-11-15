import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
import { CreditCard as Edit2, Settings as SettingsIcon, Search, Users, MessageCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'var(--page-bg)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>Une erreur est survenue</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}
            className="btn-primary rounded-full px-6 py-3 font-semibold cursor-pointer"
          >
            Retour au feed
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { apiClient } from './lib/api';
import { isPasswordLeaked } from './lib/hibp';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Contact } from './pages/Contact';
import PublicStories from './pages/PublicStories';
import { About } from './pages/About';
import { Settings } from './pages/Settings';
import VideoFeed from './components/VideoFeed';
import CreatorProfile from './pages/CreatorProfile';
import Comments from './pages/Comments';
import SearchPage from './pages/Search';
import MessagesPage from './pages/Messages';
import LiveSpectator from './pages/LiveSpectator';
import CameraPage from './pages/Camera';
import LikedVideoViewer from './components/LikedVideoViewer';
import { BottomNav } from './components/BottomNav';
import { StepProgress } from './components/StepProgress';
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
      '/': 'login', '/signup': 'signup', '/signin': 'signin', '/dashboard': 'dashboard',
      '/search': 'search', '/friends': 'friends', '/stories': 'stories', '/live': 'live',
      '/profile': 'profile', '/settings': 'settings', '/about': 'about',
      '/privacy-policy': 'privacy-policy', '/terms': 'terms', '/contact': 'contact'
    };
    return routes[path] || 'login';
  };

  const [currentPage, setCurrentPage] = useState(() => getPageFromPath(window.location.pathname));
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
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
  const [pendingVerificationData, setPendingVerificationData] = useState<{ email: string; username: string; fullName: string; } | null>(null);
  const [pendingLoginEmail, setPendingLoginEmail] = useState<string | null>(null);
  const [signupStep, setSignupStep] = useState(1);
  const [signinStep, setSigninStep] = useState(1);
  const [signupData, setSignupData] = useState<{ email: string; password: string; birthDate: string } | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  const [selectedCreatorName, setSelectedCreatorName] = useState<string>('');
  const [selectedCreatorImage, setSelectedCreatorImage] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'post' | 'like'>('post');
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loadingLikedVideos, setLoadingLikedVideos] = useState(false);
  const [likedViewerIndex, setLikedViewerIndex] = useState<number | null>(null);

  const navigate = (page: string) => {
    const pathMap: Record<string, string> = {
      'login': '/', 'signup': '/signup', 'signin': '/signin', 'dashboard': '/dashboard',
      'search': '/search', 'friends': '/friends', 'stories': '/stories', 'live': '/live',
      'profile': '/profile', 'settings': '/settings', 'about': '/about',
      'privacy-policy': '/privacy-policy', 'terms': '/terms', 'contact': '/contact',
      'creator-profile': '/creator-profile', 'comments': '/comments'
    };
    window.history.pushState({}, '', pathMap[page] || '/');
    setCurrentPage(page);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPage(getPageFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = {
      'login': 'Viral - Gagnez de l\'argent en ligne', 'signup': 'S\'inscrire - Viral',
      'signin': 'Se connecter - Viral', 'dashboard': 'Dashboard - Viral',
      'search': 'Recherche - Viral', 'friends': 'Amis - Viral', 'profile': 'Mon Profil - Viral',
      'settings': 'Paramètres - Viral', 'about': 'À propos - Viral',
      'privacy-policy': 'Politique de Confidentialité - Viral', 'terms': 'Conditions d\'Utilisation - Viral',
      'contact': 'Contact - Viral'
    };
    document.title = titles[currentPage] || 'Viral';
  }, [currentPage]);

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    try {
      const response = await apiClient.getUserProfile();
      if (response.user) await loadUserProfile(response.user);
    } catch (error) { setLoading(false); }
  };

  const loadStripeAccount = async () => {
    try {
      const response = await apiClient.getStripeAccount();
      if (response.account) { setStripeAccountId(response.account.stripeAccountId); setStripeAccountStatus(response.account.status); }
    } catch (error) { console.error('Error loading Stripe account:', error); }
  };

  const loadUserProfile = async (profile: User) => {
    try {
      setUserId(profile.id); setUsername(profile.username); setBalance(profile.balance); setUserEmail(profile.email); setUser(profile);
      if (profile.profilePhotoUrl) setProfilePhoto(profile.profilePhotoUrl);
      await loadStripeAccount(); await loadLikedVideos(); navigate('dashboard'); setLoading(false);
    } catch (error) { console.error('Error loading profile:', error); setLoading(false); }
  };

  const loadLikedVideos = async () => {
    try {
      setLoadingLikedVideos(true);
      const { likedVideos: videos } = await apiClient.getLikedVideos();
      setLikedVideos(videos);
    } catch (error) { console.log('Could not load liked videos'); }
    finally { setLoadingLikedVideos(false); }
  };

  const updateUserProfile = async (updates: any) => { try { await apiClient.updateUserProfile(updates); } catch (error) { console.error('Error updating profile:', error); } };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
      const leaked = await isPasswordLeaked(password);
      if (leaked) { setMessage('Ce mot de passe a été compromis dans une fuite de données. Veuillez en choisir un autre.'); setLoading(false); return; }
      setSignupData({ email, password }); setSignupStep(2); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  const handleSignUpStep2 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (!signupData) { setMessage('Données manquantes'); setLoading(false); return; }
    const formData = new FormData(e.currentTarget);
    const usernameInput = formData.get('username') as string;
    const fullName = formData.get('fullName') as string;
    const birthDateInput = formData.get('birthDate') as string;
    if (birthDateInput) {
      const birth = new Date(birthDateInput); const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 13) { setMessage('Vous devez avoir au moins 13 ans pour créer un compte'); setLoading(false); return; }
    }
    try {
      await apiClient.sendSignupOTP(signupData.email);
      setPendingVerificationData({ email: signupData.email, username: usernameInput, fullName });
      setSignupData({ ...signupData, birthDate: birthDateInput }); setSignupStep(3);
      setMessage('Un code de vérification a été envoyé à votre email');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (!pendingVerificationData) { setMessage('Données de vérification manquantes'); setLoading(false); return; }
    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get('otp') as string;
    const password = signupData?.password || '';
    try {
      const response = await apiClient.completeSignup(pendingVerificationData.email, password, pendingVerificationData.username, pendingVerificationData.fullName, otpCode, signupData?.birthDate || '');
      if (response.user) {
        setPendingVerificationData(null); setSignupData(null); setSignupStep(1); setMessage('Compte créé avec succès!');
        await loadUserProfile({ id: response.user.id, email: pendingVerificationData.email, username: response.user.username, fullName: response.user.fullName, balance: 0, createdAt: new Date().toISOString() } as User);
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Code de vérification invalide'); }
    finally { setLoading(false); }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try { await apiClient.sendLoginOTP(email, password); setPendingLoginEmail(email); setSigninStep(2); setMessage('Un code de vérification a été envoyé à votre email'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  const handleVerifyLoginOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setMessage('');
    if (!pendingLoginEmail) { setMessage('Email manquant'); setLoading(false); return; }
    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get('otp') as string;
    try {
      const response = await apiClient.verifyLoginOTPCode(pendingLoginEmail, otpCode);
      if (response.user) { setPendingLoginEmail(null); setSigninStep(1); setMessage('Connecté avec succès!'); await loadUserProfile(response.user as unknown as User); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Code de vérification invalide'); }
    finally { setLoading(false); }
  };

  const handleSignOut = async () => {
    if (showLogoutConfirm) {
      await apiClient.signOut(); navigate('login'); setUser(null); setUsername(''); setMessage(''); setShowLogoutConfirm(false); setUserId(null); setBalance(0); setStripeAccountId(null); setStripeAccountStatus(null);
    } else { setShowLogoutConfirm(true); }
  };

  const createStripeConnectAccount = async () => {
    if (!userId || !userEmail) { setStripeMessage('Email or user ID missing'); return; }
    setLoadingStripe(true); setStripeMessage('');
    try {
      const response = await apiClient.createStripeAccount(userEmail);
      if (response.success) {
        setStripeAccountId(response.accountId); setStripeAccountStatus('pending'); setStripeMessage('Stripe account created successfully!');
        const onboardingResponse = await apiClient.createOnboardingLink(response.accountId, window.location.origin + '/profile', window.location.origin + '/profile');
        if (onboardingResponse.success) window.open(onboardingResponse.url, '_blank');
      }
    } catch (error) { setStripeMessage(error instanceof Error ? error.message : 'Error creating Stripe account'); }
    finally { setLoadingStripe(false); }
  };

  const handleOpenOnboarding = async () => {
    try {
      if (stripeAccountId) {
        const response = await apiClient.createOnboardingLink(stripeAccountId, window.location.origin + '/profile', window.location.origin + '/profile');
        if (response.success) window.open(response.url, '_blank');
      }
    } catch (error) { console.error('Error opening onboarding:', error); }
  };

  const handleWithdrawal = async () => {
    if (balance < 10) { setShowWithdrawalError(true); setTimeout(() => setShowWithdrawalError(false), 3000); }
    else {
      setWithdrawalLoading(true); setShowWithdrawalError(false);
      try {
        const response = await apiClient.createPayout(10);
        setBalance(response.newBalance); await updateUserProfile({ balance: response.newBalance });
        await apiClient.createTransaction({ type: 'withdrawal', balanceChange: -10, description: `Withdrawal of ${getCurrencySymbol(getCurrencyForCountry(user?.country))}10 via Stripe (${response.transferId})` });
        setWithdrawalSuccess(true); setTimeout(() => setWithdrawalSuccess(false), 5000);
      } catch (error) { setStripeMessage(error instanceof Error ? error.message : 'Error during withdrawal'); }
      finally { setWithdrawalLoading(false); }
    }
  };

  /* ==================== PROFILE PAGE ==================== */
  const ProfilePage = () => {
    const isLoggedIn = !!user;
    return (
      <div className="min-h-screen flex flex-col overflow-y-auto scrollbar-hide" style={{ background: 'var(--page-bg)' }}>
        <div style={{ background: 'var(--gradient-card)' }}>
          <div className="flex items-center gap-3 px-5 pt-12 pb-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Profile</h1>
            <div className="flex-1" />
            <button onClick={() => navigate('settings')} className="p-2 rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--text-secondary)' }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
          <div className="flex items-center px-5 pt-3 pb-4 gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer border-2" style={{ borderColor: 'var(--card-border)' }} onClick={() => isLoggedIn && navigate('settings')}>
              {isLoggedIn ? <img src={profilePhoto} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--card-bg)' }}><svg className="w-9 h-9" style={{ color: 'var(--text-muted)' }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg></div>}
            </div>
            <span className="text-base" style={{ color: 'var(--text-muted)' }}>{isLoggedIn && username ? `@${username}` : 'Tap to add bio'}</span>
          </div>
          <div className="flex justify-around px-5 pb-5">
            <div className="text-center"><div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>0</div><div className="text-sm" style={{ color: 'var(--text-muted)' }}>Following</div></div>
            <div className="w-px self-stretch mx-2" style={{ background: 'var(--divider-border)' }} />
            <div className="text-center"><div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>0</div><div className="text-sm" style={{ color: 'var(--text-muted)' }}>Followers</div></div>
            <div className="w-px self-stretch mx-2" style={{ background: 'var(--divider-border)' }} />
            <div className="text-center"><div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>0</div><div className="text-sm" style={{ color: 'var(--text-muted)' }}>Likes</div></div>
          </div>
          <div className="px-5 pb-5">
            <button onClick={() => isLoggedIn ? navigate('settings') : navigate('signin')} className="w-full py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 btn-secondary">
              <Edit2 className="w-4 h-4" />Edit profile
            </button>
          </div>
        </div>
        <div className="flex border-b" style={{ borderColor: 'var(--divider-border)', background: 'var(--page-bg)' }}>
          <button onClick={() => setProfileActiveTab('post')} className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${profileActiveTab === 'post' ? '' : ''}`} style={{ color: profileActiveTab === 'post' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            Post
            {profileActiveTab === 'post' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--text-primary)' }} />}
          </button>
          <button onClick={() => setProfileActiveTab('like')} className={`flex-1 py-3 text-sm font-semibold transition-colors relative`} style={{ color: profileActiveTab === 'like' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
            Like
            {profileActiveTab === 'like' && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--text-primary)' }} />}
          </button>
        </div>
        <div className="flex-1" style={{ background: 'var(--page-bg)' }}>
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>Manage your account, check notifications,<br />comment on videos, and more.</p>
              <button onClick={() => navigate('signin')} className="w-44 py-3 rounded-full font-semibold text-sm transition-transform active:scale-95 btn-secondary">Log in</button>
            </div>
          ) : profileActiveTab === 'like' ? (
            loadingLikedVideos ? <div className="flex flex-col items-center justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--spinner-active)' }}></div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading likes...</p></div>
            : likedVideos.length === 0 ? <div className="flex flex-col items-center justify-center py-16"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No likes yet</p></div>
            : <div className="grid grid-cols-3 gap-1 p-1">{likedVideos.map((video: any, index: number) => (<div key={video.id} className="relative aspect-[9/16] rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" style={{ background: 'var(--card-bg)' }} onClick={() => setLikedViewerIndex(index)}><video src={video.videos.medium.url} className="w-full h-full object-cover" muted playsInline preload="metadata" /><div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"><div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"><svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div></div></div>))}</div>
          ) : <div className="flex flex-col items-center justify-center py-16"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No posts yet</p></div>}
        </div>
      </div>
    );
  };

  /* ==================== LOGIN PAGE ==================== */
  const LoginPage = () => (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <img src="/viral_logo_transparent.png" alt="Viral" className="absolute top-5 left-5 z-10" style={{ height: '56px', width: 'auto' }} />
      <div className="flex-1 flex flex-col items-center justify-center relative w-full">
        <div className="relative w-full" style={{ height: '280px', marginTop: '60px' }}>
          <div className="absolute overflow-hidden" style={{ top: '18px', left: '50%', width: '118px', height: '190px', borderRadius: '20px', transform: 'translateX(calc(-50% - 82px)) rotate(-10deg)', transformOrigin: 'bottom center', zIndex: 1, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}><img src="/card-filter-complete.png" alt="" className="w-full h-full object-cover" /></div>
          <div className="absolute overflow-hidden" style={{ top: '0', left: '50%', width: '118px', height: '190px', borderRadius: '20px', transform: 'translateX(-50%)', zIndex: 2, boxShadow: '0 14px 28px rgba(0,0,0,0.4), 0 0 30px rgba(16,185,129,0.15)' }}><img src="/card-feed-complete.png" alt="" className="w-full h-full object-cover" /></div>
          <div className="absolute overflow-hidden" style={{ top: '18px', left: '50%', width: '118px', height: '190px', borderRadius: '20px', transform: 'translateX(calc(-50% + 82px)) rotate(10deg)', transformOrigin: 'bottom center', zIndex: 1, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}><img src="/card-live-complete.png" alt="" className="w-full h-full object-cover" /></div>
        </div>
      </div>
      <div className="w-full" style={{ background: 'var(--modal-bg)', borderRadius: '32px 32px 0 0', padding: '28px 24px 24px', boxShadow: '0 -8px 24px rgba(0,0,0,0.1)', border: '1px solid var(--modal-border)', borderBottom: 'none' }}>
        <div className="w-full max-w-sm mx-auto">
          <h1 className="text-center text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>Earn money by <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>creating</span></h1>
          <p className="text-center text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Watch videos, go live, and get rewarded</p>
          {message && <p className="text-center text-sm mb-4" style={{ color: 'var(--danger)' }} role="alert">{message}</p>}
          <button className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 mb-2.5 text-sm font-medium transition-colors btn-secondary" onClick={() => alert('Apple sign-in coming soon')}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-primary)' }}><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.49-.93 4.01-.8 1.7.18 2.99.86 3.87 2.04-3.55 2.08-2.84 6.66.55 7.93-.62 1.54-1.41 3.06-2.51 4.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>Continue with Apple
          </button>
          <div className="flex items-center gap-2.5 my-4"><div className="flex-1 h-px" style={{ background: 'var(--divider-border)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span><div className="flex-1 h-px" style={{ background: 'var(--divider-border)' }} /></div>
          <button onClick={() => navigate('signup')} className="w-full rounded-full py-3 text-sm font-semibold transition-colors mb-3.5 btn-primary">Create Account</button>
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>Already have an account? <span className="font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }} onClick={() => navigate('signin')}>Log in</span></p>
        </div>
      </div>
    </div>
  );

  /* ==================== SIGNUP PAGE ==================== */
  const SignupPage = () => (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <StepProgress currentStep={signupStep} totalSteps={3} />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl p-8 mx-4" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
        {signupStep === 1 && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Créer un compte</h2>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Étape 1 sur 3 — Vos identifiants</p>
            {message && <div className="text-center mb-4 text-sm" style={{ color: 'var(--danger)' }}>{message}</div>}
            <form onSubmit={handleSignUp} className="space-y-5">
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label><input type="email" name="email" placeholder="Entrez votre email..." required className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Mot de passe</label><input type="password" name="password" placeholder="Entrez votre mot de passe..." required className="input-field" /></div>
              <button type="submit" disabled={loading} className="w-full font-semibold py-3.5 px-6 rounded-full text-sm transition-colors mt-2 disabled:opacity-50 btn-primary">{loading ? 'Chargement...' : 'Continuer'}</button>
            </form>
            <button onClick={() => navigate('login')} className="w-full text-sm underline mt-4 py-2" style={{ color: 'var(--text-muted)' }}>Retour</button>
          </>
        )}
        {signupStep === 2 && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Votre profil</h2>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Étape 2 sur 3 — Qui êtes-vous ?</p>
            {message && <div className="text-center mb-4 text-sm" style={{ color: 'var(--danger)' }}>{message}</div>}
            <form onSubmit={handleSignUpStep2} className="space-y-5">
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nom d'utilisateur</label><input type="text" name="username" placeholder="Choisissez un nom d'utilisateur..." required className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nom complet</label><input type="text" name="fullName" placeholder="Votre nom complet..." required className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Date de naissance</label><input type="date" name="birthDate" required className="input-field" /></div>
              <label className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                <input type="checkbox" name="consent" required className="mt-0.5 w-4 h-4 rounded" style={{ accentColor: 'var(--text-primary)' }} />
                <span>J'accepte les <button type="button" onClick={() => navigate('terms')} className="underline font-medium" style={{ color: 'var(--text-primary)' }}>Conditions d'utilisation</button> et la <button type="button" onClick={() => navigate('privacy-policy')} className="underline font-medium" style={{ color: 'var(--text-primary)' }}>Politique de confidentialité</button>.</span>
              </label>
              <button type="submit" disabled={loading} className="w-full font-semibold py-3.5 px-6 rounded-full text-sm transition-colors mt-2 disabled:opacity-50 btn-primary">{loading ? 'Envoi du code...' : 'Continuer'}</button>
            </form>
            <button onClick={() => setSignupStep(1)} className="w-full text-sm underline mt-4 py-2" style={{ color: 'var(--text-muted)' }}>Retour</button>
          </>
        )}
        {signupStep === 3 && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Vérification</h2>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Étape 3 sur 3 — Code envoyé à {pendingVerificationData?.email}</p>
            {message && <div className={`text-center mb-4 text-sm`} style={{ color: message.includes('success') || message.includes('envoyé') ? 'var(--text-primary)' : 'var(--danger)' }}>{message}</div>}
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Code de vérification</label><input type="text" name="otp" placeholder="Code à 6 chiffres..." required maxLength={6} className="input-field text-center text-2xl tracking-widest" /></div>
              <button type="submit" disabled={loading} className="w-full font-semibold py-3.5 px-6 rounded-full text-sm transition-colors mt-2 disabled:opacity-50 btn-primary">{loading ? 'Vérification...' : 'Valider'}</button>
            </form>
            <button type="button" onClick={async () => { if (pendingVerificationData) { setLoading(true); try { await apiClient.resendOTP(pendingVerificationData.email); setMessage('Un nouveau code a été envoyé'); } catch (error) { setMessage('Erreur lors du renvoi'); } setLoading(false); } }} className="w-full text-sm underline mt-4 py-2" style={{ color: 'var(--text-muted)' }}>Renvoyer le code</button>
            <button onClick={() => setSignupStep(2)} className="w-full text-sm underline mt-2 py-2" style={{ color: 'var(--text-muted)' }}>Retour</button>
          </>
        )}
        </div>
      </div>
    </div>
  );

  /* ==================== SIGNIN PAGE ==================== */
  const SignInPage = () => (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <StepProgress currentStep={signinStep} totalSteps={2} />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl p-8 mx-4" style={{ background: 'var(--modal-bg)', border: '1px solid var(--modal-border)' }}>
        {signinStep === 1 && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Connexion</h2>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Étape 1 sur 2 — Vos identifiants</p>
            {message && <div className="text-center mb-4 text-sm" style={{ color: message.includes('success') || message.includes('envoyé') ? 'var(--text-primary)' : 'var(--danger)' }}>{message}</div>}
            <form onSubmit={handleSignIn} className="space-y-5">
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label><input type="email" name="email" placeholder="Entrez votre email..." required className="input-field" /></div>
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Mot de passe</label><input type="password" name="password" placeholder="Entrez votre mot de passe..." required className="input-field" /></div>
              <button type="submit" disabled={loading} className="w-full font-semibold py-3.5 px-6 rounded-full text-sm transition-colors mt-2 disabled:opacity-50 btn-primary">{loading ? 'Chargement...' : 'Continuer'}</button>
            </form>
            <button onClick={() => navigate('login')} className="w-full text-sm underline mt-4 py-2" style={{ color: 'var(--text-muted)' }}>Retour</button>
          </>
        )}
        {signinStep === 2 && (
          <>
            <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: 'var(--text-primary)' }}>Vérification</h2>
            <p className="text-center text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Étape 2 sur 2 — Code envoyé à {pendingLoginEmail}</p>
            {message && <div className="text-center mb-4 text-sm" style={{ color: message.includes('success') || message.includes('envoyé') ? 'var(--text-primary)' : 'var(--danger)' }}>{message}</div>}
            <form onSubmit={handleVerifyLoginOTP} className="space-y-5">
              <div><label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Code de vérification</label><input type="text" name="otp" placeholder="Code à 6 chiffres..." required maxLength={6} className="input-field text-center text-2xl tracking-widest" /></div>
              <button type="submit" disabled={loading} className="w-full font-semibold py-3.5 px-6 rounded-full text-sm transition-colors mt-2 disabled:opacity-50 btn-primary">{loading ? 'Vérification...' : 'Se connecter'}</button>
            </form>
            <button type="button" onClick={async () => { if (pendingLoginEmail) { setLoading(true); try { await apiClient.resendOTP(pendingLoginEmail); setMessage('Un nouveau code a été envoyé'); } catch (error) { setMessage('Erreur lors du renvoi'); } setLoading(false); } }} className="w-full text-sm underline mt-4 py-2" style={{ color: 'var(--text-muted)' }}>Renvoyer le code</button>
            <button onClick={() => setSigninStep(1)} className="w-full text-sm underline mt-2 py-2" style={{ color: 'var(--text-muted)' }}>Retour</button>
          </>
        )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
        <div className="text-lg" style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="dark-surface" style={{ display: currentPage === 'dashboard' ? 'block' : 'none' }}>
        <VideoFeed onNavigateToProfile={(userId, creatorName, creatorImageUrl) => { setSelectedCreatorId(userId); setSelectedCreatorName(creatorName); setSelectedCreatorImage(creatorImageUrl); setCurrentPage('creator-profile'); }} onNavigateToComments={(videoId) => { setSelectedVideoId(videoId); setCurrentPage('comments'); }} onRequireLogin={() => navigate('signin')} onNavigateToLive={() => navigate('live')} onNavigateToStories={() => navigate('stories')} />
      </div>
      {currentPage === 'profile' && <ProfilePage />}
      {currentPage === 'search' && <SearchPage onNavigateToCreator={(userId) => { setSelectedCreatorId(userId); navigate('creator-profile'); }} onNavigate={navigate} />}
      {currentPage === 'friends' && <MessagesPage onNavigateToCreator={(userId) => { setSelectedCreatorId(userId); navigate('creator-profile'); }} />}
      {currentPage === 'live' && <LiveSpectator onBack={() => navigate('dashboard')} userId={user?.id || undefined} username={user?.username || undefined} profilePhotoUrl={profilePhoto} onNavigateToStories={() => navigate('stories')} onNavigateToFeed={() => navigate('dashboard')} />}
      {currentPage === 'stories' && <PublicStories onBack={() => navigate('dashboard')} onNavigateToLive={() => navigate('live')} onNavigateToFeed={() => navigate('dashboard')} onNavigateToCamera={() => navigate('camera')} />}
      {currentPage === 'camera' && <CameraPage onBack={() => navigate('dashboard')} userId={user?.id || undefined} username={user?.username || undefined} profilePhotoUrl={profilePhoto} />}
      {currentPage === 'signup' && <SignupPage />}
      {currentPage === 'signin' && <SignInPage />}
      {currentPage === 'login' && <LoginPage />}
      {currentPage === 'settings' && (
        <Settings onBack={() => navigate('profile')} user={user} onSignOut={handleSignOut} balance={balance} stripeAccountId={stripeAccountId} stripeAccountStatus={stripeAccountStatus} handleWithdrawal={handleWithdrawal} withdrawalLoading={withdrawalLoading} showWithdrawalError={showWithdrawalError} withdrawalSuccess={withdrawalSuccess} createStripeConnectAccount={createStripeConnectAccount} loadingStripe={loadingStripe} stripeMessage={stripeMessage} handleOpenOnboarding={handleOpenOnboarding} onNavigate={navigate} />
      )}
      {currentPage === 'about' && <About onBack={() => navigate('login')} />}
      {currentPage === 'privacy-policy' && <PrivacyPolicy onBack={() => navigate('login')} />}
      {currentPage === 'terms' && <TermsOfService onBack={() => navigate('login')} />}
      {currentPage === 'contact' && <Contact onBack={() => navigate('login')} userEmail={userEmail} />}
      {currentPage === 'creator-profile' && selectedCreatorId && (
        <CreatorProfile userId={selectedCreatorId} creatorName={selectedCreatorName} creatorImageUrl={selectedCreatorImage} onBack={() => { setSelectedCreatorId(null); setCurrentPage('dashboard'); }} onNavigateToComments={(videoId) => { setSelectedVideoId(videoId); setCurrentPage('comments'); }} />
      )}
      {currentPage === 'comments' && selectedVideoId && (
        <Comments videoId={selectedVideoId} onBack={() => { setSelectedVideoId(null); setCurrentPage('dashboard'); }} />
      )}
      {likedViewerIndex !== null && likedViewerIndex < likedVideos.length && (
        <LikedVideoViewer
          initialVideos={likedVideos}
          startIndex={likedViewerIndex}
          onBack={() => setLikedViewerIndex(null)}
          onNavigateToProfile={(uid, name, img) => { setLikedViewerIndex(null); setSelectedCreatorId(uid); setSelectedCreatorName(name); setSelectedCreatorImage(img); setCurrentPage('creator-profile'); }}
          onNavigateToComments={(vid) => { setLikedViewerIndex(null); setSelectedVideoId(vid); setCurrentPage('comments'); }}
        />
      )}
      {['dashboard', 'search', 'camera', 'friends', 'profile', 'live', 'stories'].includes(currentPage) && (
        <BottomNav currentPage={currentPage} onNavigate={navigate} />
      )}
    </>
  );
}

export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
