# API VolaConnect — démarrage pilote

API Node.js / Express avec PostgreSQL + PostGIS, authentification par jeton, comptes, fermes, produits, transactions et sauvegarde cloud versionnée.

## Configuration

- Node.js 20+ (ou Docker).
- Copier `.env.example` vers `.env` et définir des secrets uniques.
- En local : créer PostgreSQL/PostGIS, régler `DATABASE_URL`, puis `npm install`, `npm run db:migrate`, `npm start`.
- Avec Docker Compose : suivre le README à la racine.

Routes principales : `GET /health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`, `GET/PUT /api/sync/snapshot`, `GET/POST /api/farms`, `GET /api/market/products`.

La route snapshot synchronise une sauvegarde JSON de l'utilisateur avec un contrôle de version (HTTP 409 en cas de conflit). Les événements `/api/sync/events` restent un journal d'événements, pas un moteur de fusion métier.

Les intentions Mobile Money sont inactives sans adaptateur officiel. Le webhook n'est pas un connecteur de paiement prêt pour la production. Une revue de sécurité et des tests de déploiement sont obligatoires avant l'ouverture publique.
