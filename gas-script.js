// ============================================================
// RHÔNE SOLAIRE PRO — Script Google Apps Script unifié
// API Dashboard (doGet) + Mise à jour leads (doPost)
// + Webhook n8n sur modification Commercial (onEdit)
// Version 2.0
// ============================================================
//
// INSTALLATION :
//   1. Extensions → Apps Script → colle ce code → Ctrl+S
//   2. Déployer → Nouveau déploiement
//      Type        : Application Web
//      Exécuter en : Moi
//      Accès       : Tout le monde
//   3. Copie l'URL générée → remplace les 3 URLs dans App.tsx par celle-ci
//   4. Déclencheurs → Ajouter → onEdit → À la modification
// ============================================================

// ── CONFIGURATION ───────────────────────────────────────────
// Adapte les noms de feuilles si les tiens sont différents
var SHEETS = {
  LEADS:         'Master Acquisition',
  EXPENSES:      'Dépenses',
  DISCOVERY:     'Découverte Client',
  QUESTIONNAIRE: 'Questionnaire Social',
  PLANNING:      'Planning édito',
};

var WEBHOOK_URL  = 'https://n8n.srv1203276.hstgr.cloud/webhook/05e7383e-5592-4632-bb7e-1bbef34621c8';
var TIMEZONE     = 'Europe/Paris';
var CACHE_TTL    = 300; // secondes (5 min)

// Colonnes de "Master Acquisition" (index 0-based, ordre A→S)
var LEAD_COL = {
  dateEntry:       0,  // A
  fullName:        1,  // B
  phone:           2,  // C
  email:           3,  // D
  postalCode:      4,  // E
  dateContact:     5,  // F
  sms:             6,  // G
  mail:            7,  // H
  dateAppointment: 8,  // I
  status:          9,  // J
  infoLoss:       10,  // K
  salesperson:    11,  // L  ← déclenche le webhook onEdit
  notes:          12,  // M
  salesStatus:    13,  // N
  amount:         14,  // O
  source:         15,  // P
  canal:          16,  // Q
  campagne:       17,  // R
  creative:       18,  // S
};

// ── doGet — API principale ───────────────────────────────────
function doGet(e) {
  var type = (e && e.parameter && e.parameter.type) ? e.parameter.type : '';

  try {
    // Cache : retourner directement si disponible
    var cache  = CacheService.getScriptCache();
    var cached = cache.get('rsp_' + type);
    if (cached) {
      return jsonResponse(cached);
    }

    var data;
    if      (type === 'leads')              data = getLeads();
    else if (type === 'expenses')           data = getExpenses();
    else if (type === 'discovery')          data = getSheetAsObjects(SHEETS.DISCOVERY);
    else if (type === 'social_questionnaire') data = getSheetAsObjects(SHEETS.QUESTIONNAIRE);
    else if (type === 'planning')           data = getPlanningEdito();
    else return jsonResponse(JSON.stringify({ error: 'Type inconnu : ' + type }));

    var json = JSON.stringify(data);
    try { cache.put('rsp_' + type, json, CACHE_TTL); } catch (e) { /* données trop grandes pour le cache (>100 KB) */ }
    return jsonResponse(json);

  } catch (err) {
    console.error('doGet error [' + type + '] :', err.toString());
    return jsonResponse(JSON.stringify({ error: err.toString() }));
  }
}

function jsonResponse(json) {
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── doPost — Mise à jour d'un lead ──────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var rowIndex = payload.rowIndex;
    if (!rowIndex || rowIndex < 2) throw new Error('rowIndex invalide');

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.LEADS);
    if (!sheet) throw new Error('Feuille "' + SHEETS.LEADS + '" introuvable');

    var cols = LEAD_COL;
    // Met à jour uniquement les champs éditables
    var updates = [
      [cols.dateContact,     payload.dateContact     || ''],
      [cols.sms,             payload.sms             || ''],
      [cols.mail,            payload.mail            || ''],
      [cols.dateAppointment, payload.dateAppointment || ''],
      [cols.status,          payload.status          || ''],
      [cols.infoLoss,        payload.infoLoss        || ''],
      [cols.salesperson,     payload.salesperson     || ''],
      [cols.notes,           Array.isArray(payload.notes)
                               ? payload.notes.join(' | ')
                               : (payload.notes || '')],
      [cols.salesStatus,     payload.salesStatus     || ''],
      [cols.amount,          payload.amount          || ''],
    ];

    updates.forEach(function(u) {
      sheet.getRange(rowIndex, u[0] + 1).setValue(u[1]);
    });

    // Invalide le cache leads
    CacheService.getScriptCache().remove('rsp_leads');

    return jsonResponse(JSON.stringify({ success: true, rowIndex: rowIndex }));
  } catch (err) {
    console.error('doPost error :', err.toString());
    return jsonResponse(JSON.stringify({ error: err.toString() }));
  }
}

// ── LEADS ────────────────────────────────────────────────────
function getLeads() {
  var sheet = getSheet(SHEETS.LEADS);
  var rows  = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  var leads = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    // Ignore les lignes vides (pas de nom ni de téléphone)
    if (!r[LEAD_COL.fullName] && !r[LEAD_COL.phone]) continue;

    leads.push({
      id:              String(i + 1),
      rowIndex:        i + 1,
      dateEntry:       r[LEAD_COL.dateEntry]       || '',
      fullName:        r[LEAD_COL.fullName]        || '',
      phone:           r[LEAD_COL.phone]           || '',
      email:           r[LEAD_COL.email]           || '',
      postalCode:      r[LEAD_COL.postalCode]      || '',
      dateContact:     r[LEAD_COL.dateContact]     || '',
      sms:             r[LEAD_COL.sms]             || '',
      mail:            r[LEAD_COL.mail]            || '',
      dateAppointment: r[LEAD_COL.dateAppointment] || '',
      status:          r[LEAD_COL.status]          || '',
      infoLoss:        r[LEAD_COL.infoLoss]        || '',
      salesperson:     r[LEAD_COL.salesperson]     || '',
      notes:           r[LEAD_COL.notes]           || '',
      salesStatus:     r[LEAD_COL.salesStatus]     || '',
      amount:          r[LEAD_COL.amount]          || '',
      source:          r[LEAD_COL.source]          || '',
      canal:           r[LEAD_COL.canal]           || '',
      campagne:        r[LEAD_COL.campagne]        || '',
      creative:        r[LEAD_COL.creative]        || '',
    });
  }
  return leads;
}

// ── DÉPENSES ─────────────────────────────────────────────────
function getExpenses() {
  var sheet = getSheet(SHEETS.EXPENSES);
  var rows  = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return [];

  var headers  = rows[0];
  var expenses = [];

  for (var i = 1; i < rows.length; i++) {
    var r   = rows[i];
    var obj = { rowIndex: i + 1 };
    headers.forEach(function(h, idx) { obj[h] = r[idx] || ''; });
    // Normalise les champs attendus par le frontend
    obj.name        = obj.name        || obj['Nom']          || obj['Libellé']     || '';
    obj.description = obj.description || obj['Description']  || '';
    obj.provider    = obj.provider    || obj['Fournisseur']  || obj['Prestataire'] || '';
    obj.expenseType = obj.expenseType || obj['Type']         || obj['Catégorie']   || '';
    obj.date        = obj.date        || obj['Date']         || obj['Date début']  || '';
    obj.endDate     = obj.endDate     || obj['Date fin']     || obj['Fin']         || '';
    obj.amount      = Number((obj.amount || obj['Montant'] || '0').toString().replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    if (!obj.name && !obj.date) continue;
    expenses.push(obj);
  }
  return expenses;
}

// ── PLANNING ÉDITO ───────────────────────────────────────────
function getPlanningEdito() {
  var sheet = getSheet(SHEETS.PLANNING);
  var data  = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];

  var headers   = data[0];
  var statutIdx = headers.findIndex(function(h) {
    return h.toLowerCase().includes('statut') || h.toLowerCase() === 'status';
  });

  return data.slice(1)
    .filter(function(row) {
      if (statutIdx === -1) return true;
      return row[statutIdx] === 'Publié';
    })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return {
        titre:           obj['Titre']                || '',
        type:            obj['Type']                 || '',
        reseaux:         obj['Réseaux']              || '',
        datePublication: obj['Date de publication']  || '',
        boost:           obj['Boost']                || 'FALSE',
        montantEngage:   obj['Montant engagé']       || '',
      };
    })
    .filter(function(e) { return e.datePublication !== ''; });
}

// ── HELPER : lit une feuille et retourne un tableau d'objets ─
// Utilisé pour discovery et social_questionnaire
function getSheetAsObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var data  = sheet.getDataRange().getDisplayValues();
  if (data.length < 2) return [];

  var headers = data[0];
  return data.slice(1)
    .filter(function(row) { return row.some(function(v) { return v !== ''; }); })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i] || ''; });
      return obj;
    });
}

// ── HELPER : récupère une feuille ou lève une erreur claire ──
function getSheet(name) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Feuille introuvable : "' + name + '". Vérifie le nom dans SHEETS en haut du script.');
  return sheet;
}

// ── onEdit — Webhook n8n sur modification colonne Commercial ─
var COMMERCIAL_COL = 12; // L
var SHEET_NAME     = 'Master Acquisition';

var COLUMN_NAMES = [
  'date_entree', 'nom_prenom', 'telephone', 'email', 'code_postal',
  'date_prise_contact', 'sms', 'mail', 'date_rdv', 'statut_prospect',
  'info_perte', 'commercial', 'commentaire', 'statut_vente', 'montant_ht',
  'origine', 'canal', 'campagne', 'creative',
];

function formatDate(date) {
  return Utilities.formatDate(date, TIMEZONE, 'dd/MM/yyyy HH:mm:ss');
}

function onEdit(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();
    if (sheet.getName() !== SHEET_NAME) return;
    if (range.getColumn() !== COMMERCIAL_COL) return;
    var row = range.getRow();
    if (row <= 1) return;

    var lastCol = COLUMN_NAMES.length;
    var rowData = sheet.getRange(row, 1, 1, lastCol).getDisplayValues()[0];

    var payload = {
      row_number:     row,
      sheet:          SHEET_NAME,
      trigger_column: 'Commercial',
      new_value:      e.value    || '',
      old_value:      e.oldValue || '',
      timestamp:      formatDate(new Date()),
    };

    rowData.forEach(function(value, index) {
      var key = COLUMN_NAMES[index] || ('col_' + (index + 1));
      payload[key] = value;
    });

    var options = {
      method:             'post',
      contentType:        'application/json',
      payload:            JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var code     = response.getResponseCode();
    console.log('Webhook envoyé — Ligne ' + row + ' — HTTP ' + code);
    if (code < 200 || code >= 300) {
      console.error('Réponse webhook : ' + response.getContentText());
    }
  } catch (err) {
    console.error('Erreur onEdit : ' + err.toString());
  }
}

// ── Test webhook ─────────────────────────────────────────────
function testWebhook() {
  var payload = {
    row_number: 999, sheet: SHEET_NAME, trigger_column: 'Commercial',
    new_value: 'Test Commercial', old_value: '', timestamp: formatDate(new Date()),
    nom_prenom: 'Test Prospect', telephone: '0600000000', email: 'test@rsp.fr',
    code_postal: '69000', statut_prospect: 'TEST', commercial: 'Test Commercial',
    origine: 'Test', canal: 'Test',
  };
  var response = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true,
  });
  console.log('Test webhook — HTTP ' + response.getResponseCode());
  console.log(response.getContentText());
}

// ── Vide manuellement le cache (utile après un import de données) ─
function clearCache() {
  var cache = CacheService.getScriptCache();
  ['leads', 'expenses', 'discovery', 'social_questionnaire', 'planning'].forEach(function(t) {
    cache.remove('rsp_' + t);
  });
  console.log('Cache vidé.');
}
