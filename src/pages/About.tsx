import React from 'react';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Retour
        </button>

        <h1 className="text-4xl font-bold mb-8">À propos de Viral</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
          <p>
            Viral est une plateforme innovante qui vous permet de gagner de l'argent réel en
            visionnant des publicités et en complétant des offres. Chaque action vous rapporte
            des gains directement en devise réelle, retirables via Stripe.
          </p>

          <p>
            Notre application est actuellement en production et se déploie progressivement auprès
            de notre communauté d'utilisateurs. Rejoignez-nous dès maintenant et commencez à
            gagner vos premiers gains !
          </p>

          <p>
            Simple, sécurisé et transparent — Viral vous offre une nouvelle façon de
            monétiser votre temps en ligne. La devise s'adapte automatiquement à votre pays.
          </p>

          <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">Comment ça marche ?</h2>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">1.</span>
                <span>Inscrivez-vous gratuitement sur Viral</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">2.</span>
                <span>Visionnez des publicités et complétez des offres</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">3.</span>
                <span>Accumulez des gains dans votre solde</span>
              </li>
              <li className="flex items-start">
                <span className="text-white font-bold mr-3">4.</span>
                <span>Retirez vos gains via Stripe (minimum 10€ ou équivalent dans votre devise)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
            <h2 className="text-2xl font-semibold text-white mb-4">Nos valeurs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-white font-semibold mb-2">Transparence</h3>
                <p className="text-gray-400 text-sm">
                  Système de gains clair et traçable. Vous savez toujours combien vous gagnez.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Sécurité</h3>
                <p className="text-gray-400 text-sm">
                  Vos données sont protégées et vos paiements sont sécurisés via Stripe.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Simplicité</h3>
                <p className="text-gray-400 text-sm">
                  Interface intuitive et processus de retrait simple en quelques clics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
