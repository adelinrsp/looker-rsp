# ⚡ Quick Start - Avant de Push sur GitHub

## 🚨 ÉTAPE 1: Régénérer les Secrets (10 min)

### Facebook Token
1. Allez sur https://developers.facebook.com/
2. Apps → Sélectionnez votre app
3. Tools → Graph API Explorer
4. Cliquez sur "Generate Access Token"
5. Copiez le nouveau token
6. Mettez à jour dans `.env.local`:
   ```env
   VITE_FACEBOOK_ACCESS_TOKEN=votre_nouveau_token
   ```

### Google Gemini API Key
1. Allez sur https://aistudio.google.com/
2. Cliquez sur "Get API Key"
3. Copiez votre clé
4. Mettez à jour dans `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=votre_clé_gemini
   ```

### Google Apps Script URL
1. Allez sur votre Google Apps Script
2. Copiez l'URL du déploiement
3. Mettez à jour dans `.env.local`:
   ```env
   VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```

---

## ✅ ÉTAPE 2: Refactoriser le Code (20 min)

Suivez exactement les instructions dans `REFACTORING_SECRETS.md`:

1. **App.tsx** (ligne 19)
   - Remplacez la hardcoded URL par `import.meta.env.VITE_GOOGLE_SCRIPT_URL`

2. **services/facebookAdsService.ts** (lignes 30-32)
   - Remplacez les 3 constantes par les variables d'environnement

3. **components/AnalysisPage.tsx**
   - Remplacez la hardcoded URL

4. **components/ResultsAnalysis.tsx**
   - Remplacez la hardcoded URL

**Vérification:**
```bash
grep -r "EAAB\|script.google.com" src/
# Doit retourner ZÉRO résultats!
```

---

## 🧪 ÉTAPE 3: Tester Localement (5 min)

```bash
# Arrêter le serveur s'il tourne
# Ctrl+C

# Redémarrer
npm run dev

# Vérifier dans le navigateur que tout fonctionne
# http://localhost:5173
```

---

## 📋 ÉTAPE 4: Vérifier Git (5 min)

```bash
# Voir l'état du repo
git status

# IMPORTANT: .env.local doit être en ROUGE (non-tracked)
# Si c'est en VERT, le .gitignore ne fonctionne pas!

# Vérifier le diff avant de commiter
git diff

# Vérifier les fichiers avant le commit
git add .
git diff --cached
# Ne doit PAS montrer vos secrets!

# Commit
git commit -m "security: externalize secrets to environment variables"
```

---

## 🚀 ÉTAPE 5: Préparer Netlify (5 min)

### Dans Netlify Dashboard:
1. Allez dans **Site Settings**
2. **Build & Deploy** → **Environment**
3. Cliquez sur **Edit Variables**
4. Ajoutez chaque variable:
   ```
   VITE_GOOGLE_SCRIPT_URL = https://script.google.com/...
   VITE_GEMINI_API_KEY = votre_clé
   VITE_FACEBOOK_ACCESS_TOKEN = votre_token
   VITE_FACEBOOK_AD_ACCOUNT_ID = 1459811254717955
   VITE_FACEBOOK_PAGE_ID = RhoneSolairePro
   ```

---

## 📤 ÉTAPE 6: Push et Déployer (5 min)

```bash
# Push vers GitHub
git push

# Netlify déploiera automatiquement
# Vérifiez dans le Dashboard que le déploiement réussit
```

---

## ✔️ Checklist Finale

Avant de cliquer sur "Push":

- [ ] Nouveau Facebook token régénéré
- [ ] `App.tsx` refactorisé (pas de hardcoded URL)
- [ ] `facebookAdsService.ts` refactorisé (pas de token hardcodé)
- [ ] `AnalysisPage.tsx` refactorisé
- [ ] `ResultsAnalysis.tsx` refactorisé
- [ ] Aucun résultat pour: `grep -r "EAAB\|script.google.com" src/`
- [ ] `.env.local` est en rouge dans `git status`
- [ ] Testé localement (`npm run dev`)
- [ ] Variables configurées dans Netlify
- [ ] Push effectué

---

## 🆘 Problèmes Courants

### "Mon app dit que les variables ne sont pas trouvées"
→ Redémarrez `npm run dev` après avoir modifié `.env.local`

### ".env.local s'affiche en vert dans git status"
→ Le .gitignore ne le couvre pas. Exécutez:
```bash
git rm --cached .env.local
git commit -m "remove .env.local from tracking"
```

### "Les tokens ne fonctionnent pas en production"
→ Vérifiez qu'ils sont configurés dans Netlify Dashboard (Build & Deploy → Environment)

### "Quelle URL Google Apps Script?"
→ Regardez dans `components/AnalysisPage.tsx` ou dans les paramètres du script déployé

---

## ⏱️ Temps Total: ~50 minutes

- Régénération secrets: 10 min
- Refactoring code: 20 min
- Tests: 5 min
- Vérification Git: 5 min
- Configuration Netlify: 5 min
- Push: 5 min

---

**Besoin de plus de détails?**
- Config: Voir `SECURITY_AND_ENV_SETUP.md`
- Refactoring: Voir `REFACTORING_SECRETS.md`
- Audit: Voir `SECURITY_AUDIT_REPORT.md`

**Good luck! 🚀**
