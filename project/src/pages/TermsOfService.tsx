import React from 'react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 transition-colors" style={{ color: 'var(--text-muted)' }}
        >
          ← Retour
        </button>

        <h1 className="text-4xl font-bold mb-8">Conditions d'Utilisation</h1>

        <div className="space-y-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptation des Conditions</h2>
            <p>
              En créant un compte ou en utilisant Viral, vous acceptez d'être lié par ces
              conditions d'utilisation ainsi que par notre Politique de Confidentialité. Si vous
              n'acceptez pas ces conditions, veuillez ne pas utiliser nos services. Lors de votre
              inscription, vous devez explicitement cocher une case acceptant ces conditions et
              notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description du Service</h2>
            <p>
              Viral est une plateforme sociale de vidéos courtes qui permet aux utilisateurs de
              visionner, créer et partager du contenu vidéo, interagir avec d'autres utilisateurs
              (likes, commentaires, abonnements, messages privés), regarder et créer des lives, et
              gagner de l'argent réel en visionnant des publicités. Les gains sont crédités
              directement en devise réelle et peuvent être retirés via Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Inscription et Compte</h2>
            <p>
              Pour utiliser Viral, vous devez :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Avoir au moins 13 ans (consentement parental requis pour les mineurs de moins de 18 ans)</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la sécurité de votre mot de passe</li>
              <li>Ne créer qu'un seul compte par personne</li>
              <li>Accepter les Conditions d'utilisation et la Politique de confidentialité lors de l'inscription</li>
            </ul>
            <p className="mt-4">
              Vous êtes responsable de toutes les activités effectuées via votre compte. La vérification
              de votre identité peut être requise via un code OTP envoyé par email ou SMS.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Contenu Utilisateur</h2>
            <p>
              Vous êtes seul responsable du contenu que vous publiez sur Viral (vidéos, commentaires,
              messages, photos de profil, lives). En publiant du contenu, vous déclarez que :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Vous en possédez les droits ou disposez des autorisations nécessaires</li>
              <li>Le contenu ne viole pas les droits de tiers (droits d'auteur, droit à l'image, marques)</li>
              <li>Le contenu ne contient pas de matériel illégal, diffamatoire, haineux ou explicite</li>
              <li>Le contenu respecte la dignité humaine et les lois en vigueur</li>
            </ul>
            <p className="mt-4">
              Nous nous réservons le droit de supprimer tout contenu ne respectant pas ces règles, sans
              préavis. La répétition de violations peut entraîner la fermeture définitive de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Publicités et Gains</h2>
            <p>
              Viral diffuse des publicités au sein de l'application. En regardant ces publicités,
              vous pouvez gagner des récompenses en devise réelle. Les conditions suivantes s'appliquent :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Les publicités sont fournies par des régies publicitaires tierces (Google AdMob, ExoClick et autres partenaires)</li>
              <li>Les gains dépendent du nombre de publicités visionnées dans leur intégralité</li>
              <li>Une publicité doit être regardée entièrement pour générer un gain</li>
              <li>Les régies publicitaires peuvent collecter des données techniques (identifiant publicitaire, appareil, langue) pour mesurer les performances, conformément à leur propre politique de confidentialité</li>
              <li>Vous pouvez désactiver l'identifiant publicitaire de votre appareil dans les paramètres de votre système</li>
              <li>Nous ne contrôlons pas le contenu des publicités affichées par les régies tierces</li>
            </ul>
            <p className="mt-4">
              Toute tentative de manipulation du système publicitaire (utilisation de bots, visionnage
              automatisé, fraude au clic) entraînera la fermeture immédiate du compte et la perte de
              tous les gains non retirés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Règles d'Utilisation</h2>
            <p>
              En utilisant Viral, vous vous engagez à :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Ne pas utiliser de robots, scripts ou méthodes automatisées</li>
              <li>Ne pas créer de comptes multiples</li>
              <li>Ne pas partager votre compte avec d'autres personnes</li>
              <li>Ne pas manipuler ou frauder le système de récompenses ou de publicités</li>
              <li>Ne pas harceler, menacer ou intimider d'autres utilisateurs</li>
              <li>Ne pas publier de contenu inapproprié, illégal ou protégé par des droits d'auteur sans autorisation</li>
              <li>Ne pas utiliser l'application à des fins commerciales sans autorisation</li>
              <li>Respecter les conditions des offres publicitaires</li>
            </ul>
            <p className="mt-4">
              Toute violation de ces règles peut entraîner la suspension ou la fermeture définitive
              de votre compte sans remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Gains et Retraits</h2>
            <p>
              Les gains sont crédités en devise réelle, adaptée automatiquement à votre pays.
              Le solde est convertible et retirable via Stripe.
            </p>
            <p className="mt-4">
              Pour effectuer un retrait :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Minimum de 10€ (ou équivalent dans votre devise) requis</li>
              <li>Compte Stripe Connect vérifié nécessaire</li>
              <li>Traitement sous 3 à 5 jours ouvrables</li>
            </ul>
            <p className="mt-4">
              Nous nous réservons le droit de refuser tout retrait en cas de suspicion de fraude ou
              d'activité non conforme à ces conditions. En cas de résiliation pour fraude, tous les
              gains non retirés seront perdus.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Lives et Streaming</h2>
            <p>
              Viral permet aux utilisateurs de diffuser et de regarder des lives en direct via
              LiveKit. En tant que créateur de live, vous êtes responsable du contenu diffusé et
              devez respecter les règles de contenu définies à la section 4. Les lives peuvent être
              enregistrés et conservés à des fins de modération et de sécurité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Suspension et Résiliation</h2>
            <p>
              Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment si :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Vous violez ces conditions d'utilisation</li>
              <li>Nous détectons une activité frauduleuse ou abusive</li>
              <li>Vous publiez du contenu inapproprié ou illégal</li>
              <li>Vous utilisez le service de manière abusive envers d'autres utilisateurs</li>
            </ul>
            <p className="mt-4">
              En cas de résiliation pour fraude, tous les gains non retirés seront perdus. Vous pouvez
              à tout moment demander la suppression de votre compte en nous contactant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation de Responsabilité</h2>
            <p>
              Viral est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas
              responsables :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Des pertes financières liées à l'utilisation du service</li>
              <li>Des interruptions de service ou de connexion</li>
              <li>Des erreurs ou bugs dans l'application</li>
              <li>Du contenu des publicités affichées par les régies tierces</li>
              <li>Du contenu publié par les utilisateurs (vidéos, lives, commentaires, messages)</li>
              <li>Des interactions entre utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Propriété Intellectuelle</h2>
            <p>
              Tous les contenus de Viral (logos, textes, graphiques, code, nom de marque) sont
              protégés par les droits d'auteur et appartiennent à Viral. Toute reproduction sans
              autorisation est interdite. Le contenu publié par les utilisateurs reste leur propriété,
              mais vous accordez à Viral une licence non exclusive pour l'afficher et le distribuer
              sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs
              seront informés des changements significatifs par email ou via une notification sur
              l'application. L'utilisation continue du service après modification constitue une
              acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Droit Applicable</h2>
            <p>
              Ces conditions sont régies par le droit français. Tout litige sera soumis aux
              tribunaux compétents français.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, contactez-nous à :
            </p>
            <p className="mt-2 font-semibold">viewcoin.app@gmail.com</p>
          </section>

          <p className="text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
            Dernière mise à jour : Septembre 2026
          </p>
        </div>
      </div>
    </div>
  );
};
