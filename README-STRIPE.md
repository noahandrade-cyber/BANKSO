# Paiements BANKSO avec Stripe

1. Créez un compte Stripe et complétez sa vérification afin de recevoir les paiements.
2. Copiez `.env.example` vers `.env`, puis renseignez votre clé secrète Stripe. Ne publiez jamais ce fichier.
3. Dans Stripe, activez les e-mails clients pour les paiements réussis et les reçus dans **Settings > Customer emails**.
4. Installez le serveur avec `npm install`, puis démarrez-le avec `npm start`.
5. Pour les tests locaux, définissez `BASE_URL=http://localhost:4242`. Utilisez une clé `sk_test_...` et une carte de test Stripe.
6. Avant la mise en ligne, définissez `BASE_URL` avec votre véritable nom de domaine, utilisez une clé `sk_live_...` et créez un webhook Stripe vers `https://votre-domaine/webhook` pour l’événement `checkout.session.completed`. Copiez son secret dans `STRIPE_WEBHOOK_SECRET`.

La confirmation BANKSO n’est affichée que lorsque Stripe indique que le paiement est réglé. Stripe envoie ensuite le reçu à l’adresse fournie par le client lors du paiement.

7. Les e-mails Stripe

Dans Stripe :

Settings

↓

Customer emails

Active :

Payment successful
Receipts

Ainsi Stripe enverra automatiquement le reçu au client.

8. Lorsque tu mets ton site en ligne

Dans ton .env :

BASE_URL=https://bankso.com

(par exemple)

Puis remplace

STRIPE_SECRET_KEY=sk_test_...

par

STRIPE_SECRET_KEY=sk_live_...
9. Configurer le webhook

Dans Stripe :

Developers

↓

Webhooks

↓

Add endpoint

URL :

https://ton-domaine.com/webhook

Événement :

checkout.session.completed

Stripe te donnera un secret ressemblant à :

whsec_d6h4...

Ajoute-le dans ton .env :

STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxx
10. À quoi sert le webhook ?

Quand un client paie :

Client
      ↓
Stripe Checkout
      ↓
Paiement accepté
      ↓
Webhook
      ↓
Ton serveur
      ↓
Commande validée
      ↓
Confirmation affichée

Le webhook permet à ton serveur de confirmer que le paiement est bien terminé avant de marquer la commande comme payée.