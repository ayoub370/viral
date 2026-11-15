import React, { useState } from 'react';
import { Mail, Send } from 'lucide-react';

interface ContactProps {
  onBack: () => void;
  userEmail?: string;
}

export const Contact: React.FC<ContactProps> = ({ onBack, userEmail }) => {
  const [formData, setFormData] = useState({ name: '', email: userEmail || '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:viewcoin.app@gmail.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setFormData({ name: '', email: userEmail || '', subject: '', message: '' }); }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button onClick={onBack} className="mb-8 transition-colors" style={{ color: 'var(--text-muted)' }}>← Retour</button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 btn-primary">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Une question ? Un problème ? Notre équipe est là pour vous aider.</p>
        </div>

        {submitted ? (
          <div className="rounded-lg p-6 text-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Merci ! Votre client email va s'ouvrir.</p>
            <p className="mt-2" style={{ color: 'var(--text-tertiary)' }}>Envoyez le message pour que nous puissions vous répondre rapidement.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nom complet</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" placeholder="Votre nom" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Adresse email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="votre.email@exemple.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Sujet</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="input-field" placeholder="Objet de votre message" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} className="input-field resize-none" placeholder="Décrivez votre demande..." />
            </div>
            <button type="submit" className="w-full font-semibold py-4 px-6 rounded-full text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2 btn-primary">
              <Send className="w-4 h-4" />
              Envoyer le message
            </button>
          </form>
        )}

        <div className="mt-12 text-center">
          <p className="mb-2" style={{ color: 'var(--text-tertiary)' }}>Vous pouvez aussi nous contacter directement à :</p>
          <a href="mailto:viewcoin.app@gmail.com" className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>viewcoin.app@gmail.com</a>
        </div>

        <div className="mt-8 p-6 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Questions fréquentes :</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <li>• Temps de réponse moyen : 24-48 heures</li>
            <li>• Pour les problèmes de retrait, incluez votre email de compte</li>
            <li>• Consultez nos conditions d'utilisation avant de nous contacter</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
