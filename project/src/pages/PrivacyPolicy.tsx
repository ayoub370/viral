import React from 'react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 transition-colors" style={{ color: 'var(--text-muted)' }}
        >
          ← Retour
        </button>

        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>

        <div className="space-y-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>1. Introduction</h2>
            <p>
              Viral s'engage à protéger la confidentialité de ses utilisateurs. Cette politique
              décrit comment nous collectons, utilisons et protégeons vos informations personnelles.
              Cette politique est conforme au Règlement Général sur la Protection des Données (RGPD)
              et à la Loi Informatique et Libertés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Responsable du Traitement</h2>
            <p>
              Le responsable du traitement des données est Viral. Pour toute question relative à la
              protection de vos données, vous pouvez nous contacter à : viewcoin.app@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Données Collectées</h2>
            <p>
              Nous collectons les informations suivantes lors de votre inscription :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Adresse email</li>
              <li>Nom d'utilisateur</li>
              <li>Nom complet</li>
              <li>Date de naissance (pour vérifier l'âge minimum requis)</li>
              <li>Photo de profil (optionnelle)</li>
              <li>Numéro de téléphone (optionnel, pour la sécurité et les notifications)</li>
              <li>Pays et langue préférée</li>
            </ul>
            <p className="mt-4">
              Nous collectons également des données d'utilisation :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Vidéos visionnées, likes, commentaires, recherches</li>
              <li>Publicités regardées et durée de visionnage</li>
              <li>Interactions sociales (abonnements, messages, lives regardés)</li>
              <li>Données techniques (appareil, navigateur, adresse IP, identifiant publicitaire)</li>
            </ul>
            <p className="mt-4">
              Ces données sont collectées pour améliorer nos services, assurer le bon fonctionnement
              de l'application, mesurer les performances publicitaires et prévenir les fraudes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Base Légale du Traitement</h2>
            <p>
              Conformément à l'article 6 du RGPD, nos traitements reposent sur les bases légales suivantes :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><span className="font-semibold">Exécution du contrat :</span> gestion de votre compte, traitement des gains et retraits, affichage de votre profil</li>
              <li><span className="font-semibold">Consentement :</span> collecte de la photo de profil, des notifications, des données d'utilisation, de l'identifiant publicitaire</li>
              <li><span className="font-semibold">Intérêt légitime :</span> sécurité de la plateforme, prévention des fraudes, mesure d'audience et performance publicitaire</li>
              <li><span className="font-semibold">Obligation légale :</span> conservation des données fiscales et de traçabilité</li>
            </ul>
            <p className="mt-4">
              Vous pouvez retirer votre consentement à tout moment en modifiant vos paramètres ou en
              nous contactant. Le retrait du consentement n'affecte pas la licéité des traitements
              antérieurs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Utilisation des Données</h2>
            <p>
              Vos données sont utilisées pour :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Traiter vos transactions et retraits via Stripe</li>
              <li>Personnaliser votre expérience (langue, thème, recommandations de vidéos)</li>
              <li>Afficher votre profil public aux autres utilisateurs</li>
              <li>Diffuser des publicités adaptées à votre appareil et votre pays</li>
              <li>Calculer vos gains liés au visionnage de publicités</li>
              <li>Communiquer avec vous concernant votre compte</li>
              <li>Assurer la sécurité et prévenir les fraudes</li>
              <li>Mesurer les performances publicitaires et l'audience</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Publicités et Régies Publicitaires</h2>
            <p>
              Viral diffuse des publicités via des régies publicitaires tierces, notamment Google
              AdMob, ExoClick et d'autres partenaires. Ces régies peuvent collecter les données
              suivantes pour mesurer les performances et diffuser des publicités pertinentes :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Identifiant publicitaire de votre appareil (IDFA/AAID — désactivable dans les paramètres de votre système)</li>
              <li>Modèle d'appareil, système d'exploitation et version</li>
              <li>Langue et localisation approximative (pays)</li>
              <li>Données de navigation au sein de l'application</li>
              <li>Adresse IP (pour la détection de fraude)</li>
            </ul>
            <p className="mt-4">
              Ces données sont traitées par les régies publicitaires conformément à leurs propres
              politiques de confidentialité, que nous vous invitons à consulter. Viral ne
              transmet pas vos informations personnelles (nom, email, téléphone) aux régies
              publicitaires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Partage des Données</h2>
            <p>
              Nous ne vendons ni ne louons vos informations personnelles à des tiers. Vos données
              peuvent être partagées uniquement avec :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Supabase — hébergement de la base de données et authentification</li>
              <li>Stripe — traitement des paiements et retraits</li>
              <li>LiveKit — streaming en direct</li>
              <li>Google AdMob, ExoClick et autres régies publicitaires — diffusion et mesure des publicités (données techniques et identifiant publicitaire uniquement)</li>
              <li>HaveIBeenPwned — vérification de la sécurité des mots de passe (sans transmettre votre mot de passe)</li>
              <li>Les autorités légales si la loi l'exige</li>
            </ul>
            <p className="mt-4">
              Ces prestataires sont soumis à des accords de traitement des données et ne peuvent
              utiliser vos données que pour fournir leurs services à Viral.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Transferts hors de l'EEE</h2>
            <p>
              Certains de nos prestataires (notamment Stripe, LiveKit, Google AdMob et ExoClick) peuvent
              traiter des données en dehors de l'Espace Économique Européen. Ces transferts sont
              encadrés par des clauses contractuelles types adoptées par la Commission européenne ou
              par des décisions d'adéquation, garantissant un niveau de protection adéquat de vos
              données.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Durée de Conservation</h2>
            <p>
              Vos données sont conservées pendant la durée d'utilisation de votre compte. Les données
              de transaction sont conservées 10 ans pour respecter les obligations fiscales. Les
              données de sécurité (historique de connexions, codes OTP) sont conservées 1 an. Les
              données de performance publicitaire sont conservées 13 mois. Les données de votre
              compte sont supprimées dans un délai de 30 jours après la demande de suppression, sauf
              obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Sécurité</h2>
            <p>
              Nous mettons en œuvre les mesures de sécurité suivantes pour protéger vos données :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Chiffrement des communications via HTTPS/TLS</li>
              <li>Mots de passe vérifiés contre les bases de fuites connues (HaveIBeenPwned)</li>
              <li>Authentification à double facteur (2FA) optionnelle</li>
              <li>Codes OTP à usage unique pour la vérification d'identité</li>
              <li>Row Level Security sur toutes les tables de la base de données</li>
              <li>Accès restreint aux données via des politiques de sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Cookies et Traceurs</h2>
            <p>
              Viral utilise des cookies essentiels pour assurer le bon fonctionnement de
              l'application et maintenir votre session active. Ces cookies sont nécessaires pour
              l'authentification et ne peuvent pas être désactivés. Nous n'utilisons pas de cookies
              publicitaires ni de traceurs de suivi tiers. Les régies publicitaires peuvent
              utiliser leur propre identifiant (IDFA/AAID) que vous pouvez désactiver dans les
              paramètres de votre appareil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Protection des Mineurs</h2>
            <p>
              L'inscription à Viral nécessite un âge minimum de 13 ans. Pour les utilisateurs de
              moins de 18 ans, le consentement parental est requis. Les données des mineurs sont
              traitées avec une attention particulière et ne sont pas utilisées à des fins de
              marketing. Les utilisateurs mineurs ne peuvent pas effectuer de transactions
              financières sans l'autorisation d'un responsable légal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Vos Droits</h2>
            <p>
              Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><span className="font-semibold">Droit d'accès</span> — obtenir une copie de vos données</li>
              <li><span className="font-semibold">Droit de rectification</span> — corriger des données inexactes</li>
              <li><span className="font-semibold">Droit à l'effacement</span> — demander la suppression de votre compte et de vos données</li>
              <li><span className="font-semibold">Droit à la limitation</span> — restreindre le traitement de vos données</li>
              <li><span className="font-semibold">Droit à la portabilité</span> — recevoir vos données dans un format structuré</li>
              <li><span className="font-semibold">Droit d'opposition</span> — vous opposer au traitement de vos données</li>
              <li><span className="font-semibold">Droit de retirer votre consentement</span> — à tout moment</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : viewcoin.app@gmail.com
            </p>
            <p className="mt-4">
              Vous avez également le droit d'introduire une réclamation auprès de l'autorité de
              contrôle compétente (la CNIL en France : www.cnil.fr) si vous estimez que le traitement
              de vos données porte atteinte à vos droits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Modifications</h2>
            <p>
              Cette politique peut être mise à jour périodiquement pour refléter les évolutions
              légales ou de nos services. Nous vous informerons de tout changement significatif par
              email ou via une notification sur l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos
              droits, contactez-nous à :
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
