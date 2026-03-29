# FOCO - Documentazione Tecnica

Sistema di Contract Intelligence per gestione contratti SaaS (Freader e CutAI).

---

## COMPONENTI FRONTEND E BACKEND

### 1. OVERVIEW (Dashboard Principale)

**Componente:** `frontend/src/components/views/OverviewView.jsx`

**Cosa mostra:**
- 4 KPI card: Fatturato, Margine, Contratti Attivi, Crescita
- Ultime Attivita: lista ultimi 5 contratti
- Prossime Scadenze: contratti in scadenza nei prossimi 90 giorni

**Backend:**
- `/api/kpi` (GET) - Calcola KPI da database
  - Somma canoni trimestrali * 4 per fatturato
  - Sottrae costi scalati per margine
  - Conta contratti attivi e in scadenza
  - Fonte: `backend/api/dashboard_routes.py`

- `/api/expiring` (GET) - Contratti in scadenza
  - Calcola scadenza da data_firma + durata_mesi
  - Filtra contratti con scadenza <= 90 giorni
  - Ordina per urgenza
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 2. REPARTO COSTI

**Componente:** `frontend/src/components/views/CostsView.jsx`

**Cosa mostra:**
- Toggle: Totale / Freader / CutAI
- 3 KPI: Costi Fissi, Variabili, Costo Medio per Contratto
- Tabella Costi Fissi (Personale, Cloud, Marketing, G&A)
- Tabella Costi Variabili (Inferenza AI, Storage)

**Backend:**
- `/api/costs/<prodotto>` (GET) - Calcola costi
  - Scala costi base (1.789.000€ per 40 clienti) in base a contratti reali
  - Ripartisce per prodotto (85.5% Freader, 14.5% CutAI)
  - Calcola costo unitario per contratto
  - Fonte dati: `analisi_costi_azienda_saas2.md`
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 3. CARICA CONTRATTO (Upload)

**Componente:** `frontend/src/components/upload/UploadView.jsx`

**Cosa fa:**
- Step 1: Upload file (PDF, DOCX, immagini)
- Step 2: Analisi AI + Analisi Pre-Firma
- Step 3: Conferma e salvataggio

**Backend:**
- `/api/v1/contracts/upload-and-analyze` (POST) - Upload singolo
  - Salva file in `backend/uploads/`
  - Estrae testo con `utils/parser.py`
  - Analizza con LLM (OpenAI via Regolo)
  - Fonte: `backend/api/contracts_routes.py`

- `/api/v1/contracts/upload-and-analyze-batch` (POST) - Upload multiplo
  - Processa N file in batch
  - Fonte: `backend/api/contracts_routes.py`

- `/api/v1/contracts/save` (POST) - Salva contratto
  - Crea record in `freader_contracts` o `cutai_contracts`
  - Crea prima versione in `*_contract_versions`
  - Fonte: `backend/api/contracts_routes.py` + `service/db_service.py`

- `/api/v1/contracts/pre-sign-analysis` (POST) - Analisi pre-firma
  - Confronta con contratti storici simili
  - LLM genera 3 livelli modifiche (soft/media/strong)
  - Calcola risk score e impatti
  - Fonte: `backend/api/contracts_routes.py` + `service/ai_service.py`

**Stato:** IMPLEMENTATO

---

### 4. CONTRATTI (Lista e Dettaglio)

**Componente:** `frontend/src/components/views/ContractsView.jsx`

**Cosa mostra:**
- 3 KPI: Totali, Attivi, Anomalie
- Alert anomalie (se presenti)
- Tabella contratti con ricerca
- Mappa geografica Italia

**Backend:**
- `/api/v1/contracts/list` (GET) - Lista contratti
  - Unifica Freader + CutAI
  - Include: id, cliente, prodotto, status, versioni
  - Fonte: `backend/api/contracts_routes.py`

- `/api/anomalies` (GET) - Anomalie
  - Rileva: contratti scaduti, scadenze imminenti, tetti crediti alti, crediti SLA elevati
  - Fonte: `backend/api/dashboard_routes.py`

- `/api/v1/contracts/map` (GET) - GeoJSON per mappa
  - Contratti con coordinate lat/lng
  - Fonte: `backend/api/contracts_routes.py`

**Componente:** `frontend/src/components/views/ContractDetailView.jsx`

**Cosa mostra:**
- Dettaglio contratto singolo
- Storico versioni
- Visualizzatore documento (iframe)
- Pulsante "Nuova Versione"

**Backend:**
- `/api/v1/contracts/<contract_id>` (GET) - Dettaglio contratto
  - Recupera contratto + storico versioni
  - Fonte: `backend/api/contracts_routes.py`

- `/api/v1/contracts/<contract_id>/versions` (POST) - Nuova versione
  - Crea nuova riga in `*_contract_versions`
  - Incrementa version_number
  - Fonte: `backend/api/contracts_routes.py`

**Stato:** IMPLEMENTATO

---

### 5. RISK RADAR (Reparto Rischi)

**Componente:** `frontend/src/components/views/RadarView.jsx`

**Cosa mostra:**
- Card anomalie con gravita (alta/media)
- Tipo anomalia, descrizione, cliente

**Backend:**
- `/api/anomalies` (GET) - Analisi rischi
  - Contratti scaduti
  - Scadenze imminenti (entro preavviso)
  - Tetto crediti > 15%
  - Crediti SLA > 5%
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 6. TOP CLIENTS

**Componente:** `frontend/src/components/views/TopClientsView.jsx`

**Cosa mostra:**
- Classifica clienti con rating 0-100
- Tabella: Rank, Cliente, Score, Prodotto, Canone

**Backend:**
- `/api/top-clients` (GET) - Classifica clienti
  - Rating calcolato da: canone (40%), durata (20%), giorni scadenza (20%), bassi crediti SLA (20%)
  - Ordinati per rating decrescente
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 7. AI ADVISOR

**Componente:** `frontend/src/components/views/AdvisorView.jsx`

**Cosa mostra:**
- Card consigli strategici
- Categoria, priorita, titolo, descrizione, azione

**Backend:**
- `/api/ai-advice` (GET) - Consigli strategici
  - Analizza portfolio e genera consigli:
    - Diversificazione (se CutAI < 20%)
    - Rinnovi (se contratti in scadenza)
    - Ottimizzazione SLA (se tetti alti)
    - Crescita (se < 30 clienti)
    - Pricing (se squilibrio revenue/cliente)
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 8. SIMULATORE SCENARI

**Componente:** `frontend/src/components/views/SimulatorView.jsx`

**Cosa mostra:**
- Form configurazione scenario
- Hero Insight con risultato principale
- Confronto Attuale vs Simulato
- Delta revenue, margine, contratti
- Azioni consigliate con timeline

**Backend:**
- `/api/simulate` (POST) - Simulazione scenari
  - Tipo 1: Aumenta % CutAI (calcola clienti necessari)
  - Tipo 2: Aggiungi N clienti a un prodotto
  - Calcola impatto su revenue, margini, costi
  - Stima timeline
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO

---

### 9. ANALISI PRE-FIRMA

**Componente:** `frontend/src/components/views/PreSignAnalysisView.jsx`

**Cosa mostra:**
- Risk Score circolare (0-100)
- Tabella confronto metriche vs storico
- 3 livelli modifiche (soft/media/strong) con toggle
- Per ogni modifica: clausola, valore attuale/suggerito, impatto, motivazione

**Backend:**
- `/api/v1/contracts/pre-sign-analysis` (POST) - Analisi pre-firma
  - Recupera contratti storici simili (stesso prodotto)
  - Calcola medie storiche (tetto crediti, preavviso, etc)
  - LLM confronta e genera 3 livelli di modifiche
  - Fonte: `backend/api/contracts_routes.py` + `service/ai_service.py`

**Stato:** IMPLEMENTATO

---

### 10. MAPPA GEOGRAFICA

**Componente:** `frontend/src/components/common/ItalyMap.jsx`

**Cosa mostra:**
- Mappa Italia con marker contratti
- Aggregazione per citta

**Backend:**
- `/api/map-data` (GET) - Dati mappa
  - Aggrega contratti per coordinate lat/lng
  - Conta contratti per location
  - Fonte: `backend/api/dashboard_routes.py`

**Stato:** IMPLEMENTATO (mappa usa dati reali se lat/lng presenti)

---

## COSA MANCA DA IMPLEMENTARE

### ALTA PRIORITA

1. **Hero Insight in Overview**
   - Banner evidenziato con problema principale
   - Esempio: "Concentrazione 69% su Freader - Rischio elevato"
   - Call-to-action immediata
   - Posizione: Top della dashboard Overview

2. **Grafico Distribuzione Ricavi**
   - Visualizzazione % Freader vs CutAI
   - Grafico a torta o barre
   - Trend temporale (se storico disponibile)
   - Posizione: Overview o Costs

3. **Geocoding Automatico**
   - Convertire "Milano", "Roma" in lat/lng
   - Popolare campi lat/lng al salvataggio
   - API: Google Maps o OpenStreetMap Nominatim

### MEDIA PRIORITA

4. **AI Assistant Chat Interattivo**
   - Pannello laterale/drawer
   - Quick Actions: "Cosa dovrei fare?", "Simula scenario"
   - Chat per domande strategiche
   - Integrazione con dati dashboard

5. **Alert Predittivi**
   - "Se non intervieni, resterai sopra 65% per 6 mesi"
   - Notifiche proattive
   - Richiede storico temporale

6. **Storico Temporale KPI**
   - Salvare snapshot KPI mensili
   - Calcolare MoM e YoY reali (ora sono mock)
   - Grafici trend

### BASSA PRIORITA

7. **Action Engine**
   - Task operativi suggeriti
   - Checklist azioni
   - Tracking progressi

8. **Export Dati**
   - Export contratti in CSV/Excel
   - Export report PDF

9. **Notifiche Email**
   - Alert scadenze via email
   - Report settimanali

---

## STRUTTURA DATABASE

**Tabelle:**
- `tenants` - Multi-tenancy
- `freader_contracts` - Contratti Freader
- `freader_contract_versions` - Versioni Freader (audit trail)
- `cutai_contracts` - Contratti CutAI
- `cutai_contract_versions` - Versioni CutAI (audit trail)

**Campi chiave:**
- `original_filename` - Nome file caricato
- `lat`, `lng` - Coordinate geografiche
- `change_reason` - Motivo modifica versione
- `status` - DRAFT, ACTIVE, EXPIRED

---

## API ENDPOINTS

### Contracts (`/api/v1/contracts`)
- POST `/upload-and-analyze` - Upload + analisi singola
- POST `/upload-and-analyze-batch` - Upload batch
- POST `/save` - Salva contratto
- GET `/list` - Lista contratti
- GET `/<contract_id>` - Dettaglio contratto
- POST `/<contract_id>/versions` - Nuova versione
- GET `/map` - GeoJSON mappa
- POST `/pre-sign-analysis` - Analisi pre-firma
- GET `/download/<filename>` - Download file

### Dashboard (`/api`)
- GET `/kpi` - KPI dashboard
- GET `/contracts` - Lista contratti (duplicato, non usato)
- GET `/expiring` - Contratti in scadenza
- GET `/anomalies` - Anomalie e rischi
- GET `/costs/<prodotto>` - Costi per prodotto
- GET `/top-clients` - Classifica clienti
- GET `/ai-advice` - Consigli strategici
- GET `/map-data` - Dati mappa
- POST `/simulate` - Simulatore scenari

---

## SERVIZI BACKEND

### `service/ai_service.py`
- `analyze_contract_text(text)` - Estrae dati da contratto con LLM
- `analyze_pre_sign(contract_data, historical)` - Analisi pre-firma con 3 livelli

### `service/db_service.py`
- `save_contract_to_db(tenant_id, data, created_by, filename)` - Salva contratto nel DB

### `utils/parser.py`
- `parse_document(filepath)` - Estrae testo da PDF/DOCX/immagini

---

## CONFIGURAZIONE

**Backend:**
- `.env` - Variabili ambiente (REGOLO_API_KEY, DATABASE_URL)
- `requirements.txt` - Dipendenze Python
- Database: SQLite in `backend/instance/contracts.db`

**Frontend:**
- `package.json` - Dipendenze React
- API base URL: `http://localhost:5001`
- Tenant ID: `tenant-test-123`

---

## COME AVVIARE

**Backend:**
```bash
cd backend
python app.py
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## NOTE TECNICHE

- LLM: Llama-3.3-70B-Instruct via Regolo API
- Database: SQLite con SQLAlchemy ORM
- Frontend: React + Vite
- Mappa: Leaflet.js
- Costi scalati proporzionalmente a numero contratti (base 40 clienti)
- Versioning contratti: audit trail completo con change_reason
