import React from 'react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Retour
        </button>

        <h1 className="text-4xl font-bold mb-8">Conditions d'Utilisation</h1>

        <div className="space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptation des Conditions</h2>
            <p>
              En utilisant Viral, vous acceptez d'être lié par ces conditions d'utilisation.
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description du Service</h2>
            <p>
              Viral est une plateforme qui permet aux utilisateurs de gagner de l'argent réel en
              visionnant des publicités et en complétant des offres. Les gains sont crédités
              directement en devise réelle et peuvent être retirés via Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Inscription et Compte</h2>
            <p>
              Pour utiliser Viral, vous devez :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Avoir au moins 18 ans</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la sécurité de votre mot de passe</li>
              <li>Ne créer qu'un seul compte par personne</li>
            </ul>
            <p className="mt-4">
              Vous êtes responsable de toutes les activités effectuées via votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Règles d'Utilisation</h2>
            <p>
              En utilisant Viral, vous vous engagez à :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Ne pas utiliser de robots, scripts ou méthodes automatisées</li>
              <li>Ne pas créer de comptes multiples</li>
              <li>Ne pas partager votre compte avec d'autres personnes</li>
              <li>Ne pas manipuler ou frauder le système de récompenses</li>
              <li>Respecter les conditions des offres publicitaires</li>
            </ul>
            <p className="mt-4">
              Toute violation de ces règles peut entraîner la suspension ou la fermeture définitive
              de votre compte sans remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Gains et Retraits</h2>
            <p>
              Les gains sont crédités en devise réelle, adaptée automatiquement à votre pays.
              Le solde est convertible et retirable via Stripe.
            </p>
            <p className="mt-4">
              Pour effectuer un retrait :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Minimum de 10€ (ou équivalent dans votre devise) requis</li>
              <li>Compte Stripe vérifié nécessaire</li>
              <li>Traitement sous 3 à 5 jours ouvrables</li>
            </ul>
            <p className="mt-4">
              Nous nous réservons le droit de refuser tout retrait en cas de suspicion de fraude.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Suspension et Résiliation</h2>
            <p>
              Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment si :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Vous violez ces conditions d'utilisation</li>
              <li>Nous détectons une activité frauduleuse</li>
              <li>Vous utilisez le service de manière abusive</li>
            </ul>
            <p className="mt-4">
              En cas de résiliation pour fraude, tous les gains non retirés seront perdus.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation de Responsabilité</h2>
            <p>
              Viral est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas
              responsables :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Des pertes financières liées à l'utilisation du service</li>
              <li>Des interruptions de service</li>
              <li>Des erreurs ou bugs dans l'application</li>
              <li>Du contenu des offres publicitaires tierces</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Propriété Intellectuelle</h2>
            <p>
              Tous les contenus de Viral (logos, textes, graphiques, code) sont protégés par les
              droits d'auteur et appartiennent à Viral. Toute reproduction sans autorisation est
              interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs
              seront informés des changements significatifs. L'utilisation continue du service après
              modification constitue une acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Droit Applicable</h2>
            <p>
              Ces conditions sont régies par le droit français. Tout litige sera soumis aux
              tribunaux compétents français.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, contactez-nous à :
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
