import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Retour
        </button>

        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Viral s'engage à protéger la confidentialité de ses utilisateurs. Cette politique
              décrit comment nous collectons, utilisons et protégeons vos informations personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Collecte de Données</h2>
            <p>
              Nous collectons les informations suivantes lors de votre inscription :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Adresse email</li>
              <li>Nom d'utilisateur</li>
              <li>Nom complet</li>
              <li>Photo de profil (optionnelle)</li>
            </ul>
            <p className="mt-4">
              Nous collectons également des données d'utilisation pour améliorer nos services et
              assurer le bon fonctionnement de l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Utilisation des Données</h2>
            <p>
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Gérer votre compte utilisateur</li>
              <li>Traiter vos transactions et retraits</li>
              <li>Améliorer nos services</li>
              <li>Communiquer avec vous concernant votre compte</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Partage des Données</h2>
            <p>
              Nous ne vendons ni ne louons vos informations personnelles à des tiers. Vos données
              peuvent être partagées uniquement avec :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Les prestataires de services nécessaires au fonctionnement de l'application (hébergement, paiement)</li>
              <li>Les autorités légales si la loi l'exige</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données
              contre tout accès non autorisé, modification, divulgation ou destruction. Toutes les
              communications sensibles sont cryptées.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies</h2>
            <p>
              Viral utilise des cookies essentiels pour assurer le bon fonctionnement de
              l'application et maintenir votre session active. Ces cookies sont nécessaires pour
              l'authentification et ne peuvent pas être désactivés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Vos Droits</h2>
            <p>
              Vous disposez des droits suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Accès à vos données</li>
              <li>Rectification de vos données</li>
              <li>Suppression de votre compte</li>
              <li>Opposition au traitement de vos données</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : viral.app@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Modifications</h2>
            <p>
              Cette politique peut être mise à jour périodiquement. Nous vous informerons de tout
              changement significatif par email ou via une notification sur l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité, contactez-nous à :
            </p>
            <p className="mt-2 font-semibold">viral.app@gmail.com</p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : Janvier 2026
          </p>
        </div>
      </div>
    </div>
  );
};
