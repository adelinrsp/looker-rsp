# 🔧 Guide de Refactoring - Externaliser les Secrets

## 📝 Résumé des Changements Nécessaires

Les secrets suivants sont actuellement **hardcodés** dans le code:

### 1. Google Apps Script URLs (3 occurrences)
   - `App.tsx` ligne 19
   - `components/AnalysisPage.tsx` (à vérifier)
   - `components/ResultsAnalysis.tsx` (à vérifier)

### 2. Facebook Access Token
   - `services/facebookAdsService.ts` ligne 30

### 3. Facebook IDs (exposés mais moins critiques)
   - `AD_ACCOUNT_ID = '1459811254717955'`
   - `PAGE_ID = 'RhoneSolairePro'`

---

## ✅ Changements à Effectuer

### Étape 1: App.tsx (ligne 19)

**AVANT:**
```typescript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrJZso0q9OdL2XTeCT3pLtDh7JqF349JJIAmRcrrLvl1z2XWHIi-78ygIX76SwhIiixw/exec';
```

**APRÈS:**
```typescript
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

// Avec validation en développement:
if (!SCRIPT_URL) {
  console.warn('⚠️ VITE_GOOGLE_SCRIPT_URL n\'est pas défini dans .env.local');
}
```

---

### Étape 2: services/facebookAdsService.ts (ligne 30-32)

**AVANT:**
```typescript
const ACCESS_TOKEN = 'EAALfZC8LaIfIBQg7xqoJ0IKnaMySZCyxUeEOLtrLaQpUZBJ6hZBCcKO4TwGzTCTpjgZAXZBiaE35T5h1ZAX4jTiBKHnEcnKZCa9lZCGqNR7xqclPBkPeVaGYaLq7ZAQJTPE9CLe44aAinzz3PC744nmGjMpQw1rso8MeE7ZCN2IS1hnRZARBi5pYSYV3NN0gDF9bpBPoYiyi5i2V';
const AD_ACCOUNT_ID = '1459811254717955';
const PAGE_ID = 'RhoneSolairePro';
```

**APRÈS:**
```typescript
const ACCESS_TOKEN = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
const AD_ACCOUNT_ID = import.meta.env.VITE_FACEBOOK_AD_ACCOUNT_ID;
const PAGE_ID = import.meta.env.VITE_FACEBOOK_PAGE_ID;

// Validation optionnelle:
if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
  console.warn('⚠️ Variables Facebook manquantes dans .env.local');
}
```

---

### Étape 3: components/AnalysisPage.tsx

**AVANT:**
```typescript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw1hSotHmN4tWfrrCcro00omsl30WbofXpqV5kckZT9romFC8RacxqJB3KWOyI_itvCNA/exec';
```

**APRÈS:**
```typescript
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
```

---

### Étape 4: components/ResultsAnalysis.tsx

**AVANT:**
```typescript
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzrJZso0q9OdL2XTeCT3pLtDh7JqF349JJIAmRcrrLvl1z2XWHIi-78ygIX76SwhIiixw/exec';
```

**APRÈS:**
```typescript
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
```

---

## 🔄 Syntaxe Vite pour les Variables d'Environnement

Vite expose automatiquement les variables `VITE_*` via `import.meta.env`:

```typescript
// C'est la bonne façon avec Vite + React + TypeScript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const token = import.meta.env.VITE_FACEBOOK_ACCESS_TOKEN;
```

---

## ✅ Checklist Refactoring

- [ ] Remplacer `App.tsx` ligne 19
- [ ] Remplacer `services/facebookAdsService.ts` lignes 30-32
- [ ] Remplacer `components/AnalysisPage.tsx`
- [ ] Remplacer `components/ResultsAnalysis.tsx`
- [ ] Tester en développement (`npm run dev`)
- [ ] Commiter les changements
- [ ] Configurer les variables dans Netlify

---

## 🧪 Vérification Rapide

Après refactoring, vérifie qu'aucun secret n'est plus dans le code:

```bash
# Recherche des URLs Google Scripts
grep -r "script.google.com" src/

# Recherche des tokens (long strings de caractères)
grep -r "EAAB\|EAAL" src/

# Ne doit rien retourner!
```

---

## ⚠️ Important: Différence entre App.tsx et AnalysisPage.tsx

Il y a **2 Google Script URLs différentes**:
- `App.tsx`: `AKfycbzrJZso0q9...` (analytics)
- `AnalysisPage.tsx`: `AKfycbw1hSotHmN4...` (unknown)

**Question**: Ces 2 endpoints sont-ils différents ou une erreur? À vérifier!

---

**Conseil**: Après avoir mis à jour le code, supprime ce fichier de documentation pour éviter de donner des indices sur la structure aux potentiels attaquants.
