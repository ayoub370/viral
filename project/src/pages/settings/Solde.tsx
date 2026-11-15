import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, CreditCard, Wallet, TrendingUp, Info } from 'lucide-react';
import { formatBalance, getCurrencySymbol, getCurrencyForCountry } from '../../lib/currency';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface SoldeProps {
  onBack: () => void;
  balance: number;
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
}

export const Solde: React.FC<SoldeProps> = ({
  onBack,
  balance,
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
}) => {
  const { preferences } = useUserPreferences();
  const [showBalance, setShowBalance] = useState(false);
  const currency = getCurrencyForCountry(preferences?.country);
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--page-bg)' }}>
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-center"
        style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--card-border)' }}
      >
        <button onClick={onBack} className="mr-4">
          <ArrowLeft className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Solde</h1>
      </div>

      <div className="pt-6 px-4 overflow-y-auto scrollbar-hide">
        {/* Balance card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: 'var(--gradient-card)', border: '1px solid var(--card-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
              Solde total
            </p>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showBalance ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          <div className="text-4xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {showBalance ? formatBalance(balance, preferences?.country) : `${symbol}••••••`}
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {currency} · {preferences?.country || 'France'}
          </p>
        </div>

        {/* Withdrawal info */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-start gap-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Minimum {symbol}10 requis pour un retrait. Les retraits sont traités sous 3 à 5 jours ouvrables.
          </p>
        </div>

        {/* Error / Success messages */}
        {showWithdrawalError && (
          <div className="rounded-xl p-3 mb-4 bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">Minimum {symbol}10 requis pour un retrait.</p>
          </div>
        )}
        {withdrawalSuccess && (
          <div className="rounded-xl p-3 mb-4 bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 text-sm">Retrait de {symbol}10 envoyé avec succès !</p>
          </div>
        )}
        {stripeMessage && !stripeAccountId && (
          <div className={`rounded-xl p-3 mb-4 ${stripeMessage.includes('success') ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <p className={`text-sm ${stripeMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{stripeMessage}</p>
          </div>
        )}

        {/* Stripe section */}
        {stripeAccountId ? (
          <div className="space-y-3">
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Stripe connecté</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Statut: {stripeAccountStatus}</p>
              </div>
            </div>

            <button
              onClick={handleOpenOnboarding}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-primary)' }}
            >
              Compléter l'inscription Stripe
            </button>

            <button
              onClick={handleWithdrawal}
              disabled={withdrawalLoading || balance < 10}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1d6fe8, #0d47a1)' }}
            >
              {withdrawalLoading ? 'Traitement...' : `Retirer ${symbol}10`}
            </button>
            {balance < 10 && (
              <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                Solde insuffisant pour un retrait
              </p>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Connecter Stripe</p>
            </div>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              Connectez votre compte Stripe pour recevoir vos paiements par virement bancaire.
            </p>
            <button
              onClick={createStripeConnectAccount}
              disabled={loadingStripe}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--btn-secondary-border)', color: 'var(--text-primary)' }}
            >
              {loadingStripe ? 'Création...' : 'Connecter Stripe'}
            </button>
          </div>
        )}

        {/* Transaction stats placeholder */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <Wallet className="w-5 h-5 mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Gains totaux</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {showBalance ? formatBalance(balance, preferences?.country) : `${symbol}••••`}
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          >
            <TrendingUp className="w-5 h-5 mb-2" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Retirable</p>
            <p className="text-lg font-bold" style={{ color: balance >= 10 ? '#22c55e' : 'var(--text-tertiary)' }}>
              {showBalance ? formatBalance(balance >= 10 ? 10 : 0, preferences?.country) : `${symbol}••••`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
