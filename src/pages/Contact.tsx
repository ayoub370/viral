import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

interface ContactProps {
  onBack: () => void;
  userEmail?: string;
}

export const Contact: React.FC<ContactProps> = ({ onBack, userEmail }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mailtoLink = `mailto:viewcoin.app@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: userEmail || '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white transition-colors"
        >
          ← Retour
        </button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Mail className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-gray-400">
            Une question ? Un problème ? Notre équipe est là pour vous aider.
          </p>
        </div>

        {submitted ? (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 text-center">
            <p className="text-green-400 text-lg font-semibold">
              Merci ! Votre client email va s'ouvrir.
            </p>
            <p className="text-gray-400 mt-2">
              Envoyez le message pour que nous puissions vous répondre rapidement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="votre.email@exemple.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="Objet de votre message"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                placeholder="Décrivez votre demande..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Envoyer le message
            </button>
          </form>
        )}

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-2">Vous pouvez aussi nous contacter directement à :</p>
          <a
            href="mailto:viewcoin.app@gmail.com"
            className="text-white font-semibold hover:underline"
          >
            viewcoin.app@gmail.com
          </a>
        </div>

        <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="font-semibold text-white mb-3">Questions fréquentes :</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• Temps de réponse moyen : 24-48 heures</li>
            <li>• Pour les problèmes de retrait, incluez votre email de compte</li>
            <li>• Consultez nos conditions d'utilisation avant de nous contacter</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
