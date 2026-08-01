# Base de données et e-mails

La base SQLite est créée dans `database/bankso.sqlite`. Elle contient les produits, commandes, articles de commande, inscriptions au drop et messages de contact.

Pour recevoir les messages de contact, copiez `.env.example` en `.env` puis remplissez `CONTACT_EMAIL` et vos identifiants SMTP. Avec Gmail, utilisez un mot de passe d'application, pas votre mot de passe Gmail habituel.

Installez les dépendances avec `npm install`, puis lancez le site avec `npm start`. Le formulaire contact enregistre le message et l'envoie à `CONTACT_EMAIL`.
