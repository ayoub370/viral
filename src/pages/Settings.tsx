import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  User,
  Mail,
  Globe,
  CreditCard,
  CheckCircle,
  LogOut,
  Trash2,
  Bell,
  Languages,
  Palette,
  Lock,
  Shield,
  Smartphone,
  History,
  FileText,
  Eye
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { supabase } from '../lib/api';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import Notifications from './settings/Notifications';
import Language from './settings/Language';
import Theme from './settings/Theme';
import Security from './settings/Security';
import TwoFactor from './settings/TwoFactor';
import ConnectedDevices from './settings/ConnectedDevices';
import LoginHistory from './settings/LoginHistory';
import Country from './settings/Country';
import Email from './settings/Email';
import { BottomNav } from '../components/BottomNav';
import { formatBalance, getCurrencySymbol, getCurrencyForCountry } from '../lib/currency';

interface SettingsProps {
  onBack: () => void;
  user: any;
  onSignOut: () => void;
  balance?: number;
  stripeAccountId?: string | null;
  stripeAccountStatus?: string | null;
  handleWithdrawal?: () => void;
  withdrawalLoading?: boolean;
  showWithdrawalError?: boolean;
  withdrawalSuccess?: boolean;
  createStripeConnectAccount?: () => void;
  loadingStripe?: boolean;
  stripeMessage?: string;
  handleOpenOnboarding?: () => void;
  onNavigate?: (page: string) => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  showChevron?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack, user, onSignOut,
  balance = 0,
  stripeAccountId,
  stripeAccountStatus,
  handleWithdrawal,
  withdrawalLoading,
  showWithdrawalError,
  withdrawalSuccess,
  createStripeConnectAccount,
  loadingStripe,
  stripeMessage,
  handleOpenOnboarding,
  onNavigate,
}) => {
  const { preferences, refreshPreferences, t } = useUserPreferences();
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u?.email) setUserEmail(u.email);
    });
  }, []);
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const MenuSection = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <div className="mb-8">
      <h3 className="text-sm font-medium px-6 mb-3 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        {title}
      </h3>
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '12px',
          marginLeft: '16px',
          marginRight: '16px',
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <button
              onClick={item.onClick}
              className="w-full flex items-center justify-between px-4 py-4 transition-colors"
              style={{
                borderTopLeftRadius: index === 0 ? '12px' : '0',
                borderTopRightRadius: index === 0 ? '12px' : '0',
                borderBottomLeftRadius: index === items.length - 1 ? '12px' : '0',
                borderBottomRightRadius: index === items.length - 1 ? '12px' : '0',
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{ color: 'var(--text-tertiary)' }}>{item.icon}</div>
                <div className="text-left">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                  {item.value && (
                    <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{item.value}</div>
                  )}
                </div>
              </div>
              {item.showChevron !== false && (
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-faint)' }} />
              )}
            </button>
            {index < items.length - 1 && (
              <div className="mx-4" style={{ borderTop: 'var(--divider-border)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const handleDeleteAccount = async () => {
    if (showDeleteConfirm) {
      try {
        await apiClient.deleteAccount();
        onSignOut();
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Erreur lors de la suppression du compte');
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const parametresItems: MenuItem[] = [
    {
      icon: <Mail className="w-5 h-5" />,
      label: t('email'),
      value: userEmail,
      onClick: () => setCurrentPage('email')
    },
    {
      icon: <Globe className="w-5 h-5" />,
      label: t('country'),
      value: preferences?.country || t('notDefined'),
      onClick: () => setCurrentPage('country')
    },
    {
      icon: <User className="w-5 h-5" />,
      label: 'ID ViewCoin',
      value: user?.numeric_user_id ? `#${user.numeric_user_id}` : 'Non disponible',
      onClick: () => {
        if (user?.numeric_user_id) {
          navigator.clipboard.writeText(user.numeric_user_id.toString());
          alert('ID copié!');
        }
      }
    },
    {
      icon: user?.stripe_verified ? <CheckCircle className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />,
      label: 'Stripe',
      value: user?.stripe_verified ? t('verified') : t('notVerified'),
      onClick: () => alert('Fonctionnalité à venir')
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Stripe',
      value: user?.withdrawal_method || t('notDefined'),
      onClick: () => alert('Fonctionnalité à venir')
    },
    {
      icon: <LogOut className="w-5 h-5" />,
      label: t('signOut'),
      onClick: onSignOut,
      showChevron: false
    },
    {
      icon: <Trash2 className="w-5 h-5" />,
      label: showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer mon compte',
      onClick: handleDeleteAccount,
      showChevron: false
    }
  ];

  const preferencesItems: MenuItem[] = [
    {
      icon: <Bell className="w-5 h-5" />,
      label: t('notifications'),
      value: preferences?.notifications_enabled === false ? t('disabled') : t('enabled'),
      onClick: () => setCurrentPage('notifications')
    },
    {
      icon: <Languages className="w-5 h-5" />,
      label: t('language'),
      value: preferences?.language === 'en' ? 'English' : preferences?.language === 'es' ? 'Español' : 'Français',
      onClick: () => setCurrentPage('language')
    },
    {
      icon: <Palette className="w-5 h-5" />,
      label: t('theme'),
      value: preferences?.theme === 'light' ? t('light') : t('dark'),
      onClick: () => setCurrentPage('theme')
    }
  ];

  const securiteItems: MenuItem[] = [
    {
      icon: <Lock className="w-5 h-5" />,
      label: t('security'),
      onClick: () => setCurrentPage('security')
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: t('twoFactor'),
      value: preferences?.two_factor_enabled ? t('enabled') : t('disabled'),
      onClick: () => setCurrentPage('2fa')
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      label: t('connectedDevices'),
      onClick: () => setCurrentPage('devices')
    },
    {
      icon: <History className="w-5 h-5" />,
      label: t('loginHistory'),
      onClick: () => setCurrentPage('history')
    }
  ];

  const confidentialiteItems: MenuItem[] = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: t('terms'),
      onClick: () => window.open('/terms', '_blank')
    },
    {
      icon: <Eye className="w-5 h-5" />,
      label: t('privacyPolicy'),
      onClick: () => window.open('/privacy-policy', '_blank')
    }
  ];

  if (currentPage === 'email') {
    return <Email onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'country') {
    return (
      <Country
        onBack={() => { setCurrentPage(null); refreshPreferences(); }}
        currentCountry={preferences?.country || 'France'}
      />
    );
  }

  if (currentPage === 'notifications') {
    return <Notifications onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'language') {
    return <Language onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'theme') {
    return <Theme onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'security') {
    return <Security onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === '2fa') {
    return <TwoFactor onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'devices') {
    return <ConnectedDevices onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  if (currentPage === 'history') {
    return <LoginHistory onBack={() => { setCurrentPage(null); refreshPreferences(); }} />;
  }

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center"
        style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--card-border)' }}
      >
        <button onClick={onBack} className="mr-4">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--text-primary)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{t('settings')}</h1>
      </div>

      <div className="pt-6 overflow-y-auto scrollbar-hide">

        <div className="mb-8 px-4">
          <h3 className="text-sm font-medium px-2 mb-3 uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Compte</h3>

          <div
            className="rounded-2xl p-5 mb-3"
            style={{ background: 'var(--gradient-card)', border: '1px solid var(--card-border)' }}
          >
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>Vos gains</p>
            <div className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{formatBalance(balance, preferences?.country)}</div>

            {showWithdrawalError && (
              <p className="text-red-400 text-xs mb-3">Minimum {getCurrencySymbol(getCurrencyForCountry(preferences?.country))}10 requis pour un retrait.</p>
            )}
            {withdrawalSuccess && (
              <p className="text-green-400 text-xs mb-3">Retrait de {getCurrencySymbol(getCurrencyForCountry(preferences?.country))}10 envoyé avec succès !</p>
            )}

            {stripeAccountId ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 text-xs">Stripe connecté — {stripeAccountStatus}</span>
                </div>
                <button
                  onClick={handleOpenOnboarding}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-primary)' }}
                >
                  Compléter l'inscription Stripe
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawalLoading}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #1d6fe8, #0d47a1)' }}
                >
                  {withdrawalLoading ? 'Traitement...' : `Retirer ${getCurrencySymbol(getCurrencyForCountry(preferences?.country))}10`}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Connectez Stripe pour recevoir vos paiements</p>
                {stripeMessage && (
                  <p className={`text-xs mb-2 ${stripeMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                    {stripeMessage}
                  </p>
                )}
                <button
                  onClick={createStripeConnectAccount}
                  disabled={loadingStripe}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-primary)' }}
                >
                  {loadingStripe ? 'Création...' : 'Connecter Stripe'}
                </button>
              </div>
            )}
          </div>
        </div>

        <MenuSection title={t('settings')} items={parametresItems} />
        <MenuSection title={t('preferences')} items={preferencesItems} />
        <MenuSection title={t('security')} items={securiteItems} />
        <MenuSection title={t('privacyPolicy')} items={confidentialiteItems} />
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-6" style={{ background: 'var(--overlay-bg)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: 'var(--modal-bg)' }}>
            <h3 className="text-lg font-semibold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
              Supprimer le compte
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 text-white font-semibold py-3 px-4 rounded-full hover:bg-red-700 transition-colors"
              >
                SUPPRIMER
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-white font-semibold py-3 px-4 rounded-full transition-colors"
                style={{ background: 'var(--btn-secondary-bg)' }}
              >
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav currentPage="settings" onNavigate={handleNavigate} />
    </div>
  );
};
