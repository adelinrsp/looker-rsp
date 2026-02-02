# 🔒 Configuration des Secrets et Sécurité

## ⚠️ ACTIONS URGENTES REQUISES

### 1. **Régénérer le Facebook Access Token IMMÉDIATEMENT**
   - ❌ Le token précédent a été exposé dans le code source
   - Accédez à: [Meta Developers Console](https://developers.facebook.com/)
   - Allez dans Settings → Tokens → Generate New Token
   - Copiez le nouveau token et mettez-le à jour dans `.env.local`
   - **IMPORTANT**: Ne jamais mettre le token en dur dans le code!

### 2. **Vérifier votre dépôt Git**
   - Si tu as déjà commit ce code sur GitHub, le token est compromis
   - Solution:
     ```bash
     # 1. Invalide le token sur Meta (cf. ci-dessus)
     # 2. Nettoie l'historique Git (si possible)
     # 3. Force push vers GitHub
     ```

---

## 📋 Variables d'Environnement Requises

Crée un fichier `.env.local` à la racine du projet avec:

```env
# Google Services
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GEMINI_API_KEY=your_gemini_api_key

# Facebook / Meta Ads
VITE_FACEBOOK_ACCESS_TOKEN=your_new_facebook_token
VITE_FACEBOOK_AD_ACCOUNT_ID=1459811254717955
VITE_FACEBOOK_PAGE_ID=RhoneSolairePro
```

### Notes:
- ✅ Les variables `VITE_` sont visibles côté client (normal)
- ⚠️ Ces tokens seront exposés au navigateur - ils doivent avoir des permissions limitées
- 🔐 Jamais de secrets sensibles à long terme en variables Vite

---

## 🚀 Configuration pour Netlify

### 1. Variables d'Environnement dans Netlify
   - Aller dans: **Site Settings → Build & Deploy → Environment**
   - Ajouter chaque variable `VITE_*`:
     ```
     VITE_GOOGLE_SCRIPT_URL = https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
     VITE_GEMINI_API_KEY = votre_clé_gemini
     VITE_FACEBOOK_ACCESS_TOKEN = votre_nouveau_token
     VITE_FACEBOOK_AD_ACCOUNT_ID = 1459811254717955
     VITE_FACEBOOK_PAGE_ID = RhoneSolairePro
     ```

### 2. Redéployer
   ```bash
   git push
   ```

---

## 📁 Fichiers Configurés

- ✅ `.env.local` - Variables de développement (*.local est ignoré par Git)
- ✅ `.env.example` - Template pour collaborateurs (à commiter)
- ✅ `.gitignore` - Empêche les secrets d'être commités

---

## 🔑 Bonnes Pratiques

### ✅ À FAIRE:
- Utiliser des variables d'environnement pour tous les secrets
- Préfixer avec `VITE_` pour exposer au navigateur
- Garder `.env.local` hors de Git
- Utiliser `.env.example` pour la documentation

### ❌ À NE PAS FAIRE:
- ❌ Hardcoder les secrets dans le code
- ❌ Commiter `.env.local` sur Git
- ❌ Partager les tokens dans Slack/email
- ❌ Utiliser les mêmes tokens en dev et prod

---

## 🔐 Sécurité Additionnelle Recommandée

### 1. **Validation des Tokens**
   - Les tokens Facebook/Gemini n'ont accès qu'aux ressources minimum
   - Régénérer tous les 3-6 mois

### 2. **Google Apps Script**
   - Limiter les accès au script à l'email du service uniquement
   - Auditer qui a accès

### 3. **Monitoring**
   - Surveiller l'utilisation des APIs pour détecter les abus

---

## ✅ Checklist pour GitHub + Netlify

- [ ] Régénérer Facebook token
- [ ] Créer `.env.local` avec valeurs réelles
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] Faire un test: `git status` (ne doit pas montrer .env.local)
- [ ] Commiter les changements
- [ ] Push vers GitHub
- [ ] Configurer les variables dans Netlify
- [ ] Tester le déploiement

---

**Créé par:** Claude Code
**Date:** 2026-02-02
