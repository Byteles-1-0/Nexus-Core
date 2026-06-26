# Nexus Core - Contract Intelligence Platform

> Piattaforma SaaS per gestione intelligente contratti B2B con AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-black.svg)](https://flask.palletsprojects.com/)

**[Link Presentazione](https://drive.google.com/file/d/1ApmxO1isl4cg6EODcL4PbDq5PAVhoEyA/view?usp=sharing)**

## 📋 Indice

- [Panoramica](#-panoramica)
- [Il Problema](#-il-problema)
- [La Soluzione](#-la-soluzione)
- [Funzionalità](#-funzionalità)
- [Architettura](#-architettura)
- [Installazione](#-installazione)
- [Workflow AI](#-workflow-ai)
- [API Endpoints](#-api-endpoints)
- [Tecnologie](#-tecnologie)
- [Roadmap](#-roadmap)
- [Licenza](#-licenza)

---

## 🎯 Panoramica

**Nexus Core** è una piattaforma di Contract Intelligence che automatizza l'analisi e la gestione di contratti B2B utilizzando AI avanzata. Riduce il tempo di analisi contrattuale del 95% (da 2 ore a 5 minuti) e aiuta le aziende a recuperare fino al 9.2% del fatturato perso per mismanagement contrattuale.

### Metriche Chiave
- **~40 contratti attivi** gestiti
- **€3M fatturato annuo** stimato
- **48% margine operativo**
- **95% riduzione tempo** analisi
- **€0.20 costo** per analisi AI

---

## 🚨 Il Problema

La gestione contratti è una crisi silenziosa che costa miliardi alle aziende:

### Perdite Finanziarie
- **9.2% fatturato** perso per mismanagement contratti ([fonte](https://procurementtactics.com/contract-management-statistics/))
- **PMI italiane**: perdita **15-25% fatturato** per mancanza dati strutturati ([fonte](https://www.giornaledellepmi.it/))
- **€270 miliardi** distrutti annualmente a livello globale

### Caos Operativo
- **71% aziende** non trova 10%+ dei propri contratti
- **95% organizzazioni** senza visibilità completa obblighi contrattuali
- **90% professionisti** trova contratti difficili o impossibili da capire

### Inefficienza Temporale
- **92 minuti** per revisione manuale contratto
- **97 giorni** per rinnovare un contratto
- **2 ore** per trovare clausole specifiche

---

## 💡 La Soluzione

FOCO risolve questi problemi con **4 pilastri tecnologici**:

### 1. 🤖 Estrazione Automatica
- AI estrae dati da PDF, DOCX, immagini
- OCR multi-formato (PyPDF2, python-docx, Tesseract)
- Accuratezza >95%
- **Da 2 ore a 5 minuti** (-95% tempo)

### 2. 📊 Analisi Predittiva
- **Risk score 0-100** con confronto storico
- **3 livelli modifiche** suggerite (soft/media/strong)
- Identificazione anomalie proattiva
- Alert scadenze e crediti SLA

### 3. 🎯 Visibilità Totale
- Dashboard KPI real-time
- Analisi costi per prodotto (Freader/CutAI)
- Mappa geografica clienti Italia
- Top clients ranking

### 4. 💰 Ottimizzazione Business
- **Simulatore scenari** strategici
- **Re-Pricing intelligente** per rinnovi
- AI Advisor con consigli data-driven
- Audit trail completo (versioning)

---

## ✨ Funzionalità

### Dashboard & Analytics
- **Overview**: KPI fatturato, margine, contratti attivi, crescita
- **Analisi Costi**: Breakdown fissi/variabili per prodotto
- **Top Clients**: Ranking 0-100 basato su canone, durata, SLA
- **Mappa Geografica**: Distribuzione clienti su mappa Italia

### Gestione Contratti
- **Upload Multiplo**: Batch processing PDF/DOCX/immagini
- **Estrazione AI**: Dati strutturati automatici (cliente, date, canoni, SLA)
- **Versioning Completo**: Audit trail immutabile con change reason
- **Ricerca Avanzata**: Full-text search e filtri multipli

### AI-Powered Features
- **Analisi Pre-Firma**: Confronto con storico + risk score + 3 livelli modifiche
- **Re-Pricing Intelligente**: Suggerimenti aumenti prezzo per rinnovi con probabilità accettazione
- **Risk Radar**: Rilevamento anomalie (scadenze, crediti SLA, tetti)
- **AI Advisor**: Consigli strategici su diversificazione, rinnovi, ottimizzazione
- **Simulatore Scenari**: Impatto economico decisioni (es. "aumenta CutAI al 40%")

---

## 🏗️ Architettura

```
Frontend React (41 componenti)
    ↓ HTTP/JSON REST API
Backend Flask
    ↓
├── API Layer (Routing & Validation)
├── Service Layer (Business Logic)
├── AI Layer (LLM Integration - Llama-3.3-70B)
└── Data Layer (SQLAlchemy ORM)
    ↓
Database SQLite (Multi-tenant)
```

### Struttura Directory

```
.
├── backend/
│   ├── api/
│   │   ├── contracts_routes.py    # Gestione contratti
│   │   └── dashboard_routes.py    # Analytics & KPI
│   ├── service/
│   │   ├── ai_service.py          # Integrazione LLM
│   │   └── db_service.py          # Operazioni database
│   ├── utils/
│   │   └── parser.py              # Estrazione testo documenti
│   ├── models.py                  # Modelli SQLAlchemy
│   ├── app.py                     # Entry point Flask
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # 10 componenti riutilizzabili
│   │   │   ├── layout/           # Sidebar, Topbar
│   │   │   ├── upload/           # Pipeline upload
│   │   │   └── views/            # 10 view principali
│   │   ├── hooks/                # Custom hooks
│   │   ├── utils/                # API client, helpers
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
└── Cartelle prodotto 1 e 2/      # Dati test (40 contratti)
```

### Database Schema

**Multi-tenant** con isolamento dati completo:

- `tenants` - Tenant management
- `freader_contracts` + `freader_contract_versions` - Contratti Freader con versioning
- `cutai_contracts` + `cutai_contract_versions` - Contratti CutAI con versioning

Ogni modifica crea una nuova versione (audit trail immutabile).

---

## 🚀 Installazione

### Prerequisiti
- Python 3.9+
- Node.js 18+
- pip e npm

### 1. Clone Repository
```bash
git clone https://github.com/your-org/foco.git
cd foco
```

### 2. Setup Backend
```bash
cd backend

# Crea virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installa dipendenze
pip install -r requirements.txt

# Configura variabili ambiente
cp .env.example .env
# Modifica .env con la tua REGOLO_API_KEY

# Avvia server
python app.py
```

Backend disponibile su `http://localhost:5001`

### 3. Setup Frontend
```bash
cd frontend

# Installa dipendenze
npm install

# Avvia dev server
npm run dev
```

Frontend disponibile su `http://localhost:3000`

### 4. Verifica Installazione
- Apri browser su `http://localhost:3000`
- Dovresti vedere la dashboard FOCO
- Prova upload contratto di test da `Cartelle prodotto 1 e 2/`

---

## 🤖 Workflow AI

### 1. Upload e Analisi Contratto

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: UPLOAD                                          │
└─────────────────────────────────────────────────────────┘
Utente carica file (PDF, DOCX, JPG, PNG)
    ↓
Backend salva in /uploads/
    ↓
┌─────────────────────────────────────────────────────────┐
│ FASE 2: ESTRAZIONE TESTO                                │
└─────────────────────────────────────────────────────────┘
Parser identifica formato:
    • PDF → PyPDF2 estrae testo
    • DOCX → python-docx estrae paragrafi
    • Immagini → Tesseract OCR
    ↓
Testo estratto (raw)
    ↓
┌─────────────────────────────────────────────────────────┐
│ FASE 3: ANALISI AI                                      │
└─────────────────────────────────────────────────────────┘
LLM (Llama-3.3-70B) analizza testo e estrae:
    • Prodotto (Freader/CutAI)
    • Anagrafica cliente (ragione sociale, sede)
    • Date (firma, durata, preavviso)
    • Canoni e pricing (fisso, variabile, fasce)
    • SLA (crediti uptime, ticketing, tetti)
    ↓
JSON strutturato
    ↓
┌─────────────────────────────────────────────────────────┐
│ FASE 4: VALIDAZIONE & SALVATAGGIO                       │
└─────────────────────────────────────────────────────────┘
Utente verifica dati estratti
    ↓
[Opzionale] Analisi Pre-Firma
    ↓
Salvataggio in database (contratto + versione 1)
```

### 2. Analisi Pre-Firma (AI-Powered)

```
Contratto nuovo da firmare
    ↓
Query database: contratti storici simili (stesso prodotto)
    ↓
Calcolo medie storiche:
    • Tetto crediti medio
    • Preavviso medio
    • Durata media
    • Canone medio
    ↓
LLM confronta nuovo vs storico
    ↓
Genera 3 livelli modifiche:
    • SOFT: minime, basso rischio cliente
    • MEDIA: equilibrate, rischio moderato
    • STRONG: aggressive, massima protezione
    ↓
Per ogni modifica:
    • Clausola specifica
    • Valore attuale vs suggerito
    • Impatto economico
    • Motivazione data-driven
    ↓
Risk Score 0-100 + Report completo
```

### 3. Re-Pricing Intelligente

```
Identifica contratti in scadenza (≤20 giorni)
    ↓
Calcola indice confidenza cliente (0-100):
    • Tetto crediti (25%)
    • Credito uptime (20%)
    • Preavviso (20%)
    • Durata contratto (20%)
    • Credito ticketing (15%)
    ↓
Genera 3 proposte pricing:
    • Conservativa: +2-5% (prob. 90%+)
    • Raccomandata: +5-12% (prob. 70-85%)
    • Aggressiva: +10-20% (prob. 50-65%)
    ↓
Fornisce motivazioni:
    • Confronto media portfolio
    • Costi infrastruttura
    • Profilo cliente
    • Clausole restrittive
    ↓
Output: Revenue a rischio + Delta potenziale + Strategia raccomandata
```

---

## 🔌 API Endpoints

### Contracts API (`/api/v1/contracts`)

| Endpoint | Method | Descrizione |
|----------|--------|-------------|
| `/upload-and-analyze` | POST | Upload singolo + analisi AI |
| `/upload-and-analyze-batch` | POST | Upload multiplo batch |
| `/save` | POST | Salva contratto validato |
| `/list` | GET | Lista tutti i contratti |
| `/<contract_id>` | GET | Dettaglio contratto + versioni |
| `/<contract_id>/versions` | POST | Crea nuova versione |
| `/pre-sign-analysis` | POST | Analisi pre-firma con AI |
| `/map` | GET | GeoJSON per mappa |
| `/download/<filename>` | GET | Download file |

### Dashboard API (`/api`)

| Endpoint | Method | Descrizione |
|----------|--------|-------------|
| `/kpi` | GET | KPI dashboard (fatturato, margine, contratti) |
| `/expiring` | GET | Contratti in scadenza ≤90 giorni |
| `/anomalies` | GET | Rilevamento anomalie e rischi |
| `/costs/<prodotto>` | GET | Analisi costi per prodotto |
| `/top-clients` | GET | Classifica clienti (rating 0-100) |
| `/ai-advice` | GET | Consigli strategici AI |
| `/simulate` | POST | Simulatore scenari business |
| `/repricing` | GET | Proposte re-pricing contratti in scadenza |
| `/map-data` | GET | Dati mappa geografica |

---

## 🛠️ Tecnologie

### Backend
- **Python 3.9+** - Linguaggio principale
- **Flask 3.0** - Web framework
- **SQLAlchemy 2.0** - ORM
- **SQLite** - Database (multi-tenant)
- **OpenAI API** - LLM integration (Llama-3.3-70B via Regolo)
- **PyPDF2** - Parsing PDF
- **python-docx** - Parsing DOCX
- **Tesseract OCR** - Estrazione testo immagini
- **ReportLab** - Generazione PDF

### Frontend
- **React 18.3** - UI framework
- **Vite 5.4** - Build tool & dev server
- **Leaflet.js** - Mappa geografica interattiva
- **CSS puro** - Design system custom (no framework)
- **Remix Icon** - Icon library

### AI & ML
- **LLM**: Llama-3.3-70B-Instruct (via Regolo API)
- **NLP**: Natural Language Processing per estrazione clausole
- **Temperature**: 0.0 (estrazione), 0.2 (analisi pre-firma)
- **Costo**: ~€0.20 per contratto

---

## 📦 Funzionalità Dettagliate

### 1. Dashboard Overview
- **KPI Cards**: Fatturato, Margine, Contratti Attivi, Crescita
- **Ultime Attività**: Lista ultimi 5 contratti caricati
- **Prossime Scadenze**: Contratti in scadenza ≤90 giorni
- **Endpoint**: `/api/kpi`, `/api/expiring`

### 2. Upload & Analisi Contratto
- **Upload singolo/batch**: Drag & drop o file picker
- **Formati supportati**: PDF, DOCX, JPG, PNG
- **Pipeline 3 step**: Upload → Analisi AI → Conferma
- **Estrazione automatica**: Cliente, date, canoni, SLA, crediti
- **Endpoint**: `/api/v1/contracts/upload-and-analyze`

### 3. Analisi Pre-Firma
- **Confronto storico**: Query contratti simili (stesso prodotto)
- **Calcolo medie**: Tetto crediti, preavviso, durata, canone
- **Risk Score**: 0-100 basato su deviazioni da storico
- **3 Livelli Modifiche**:
  - **Soft**: Minime, basso rischio cliente
  - **Media**: Equilibrate, rischio moderato
  - **Strong**: Aggressive, massima protezione
- **Endpoint**: `/api/v1/contracts/pre-sign-analysis`

### 4. Re-Pricing Intelligente
- **Target**: Contratti in scadenza ≤20 giorni
- **Indice Confidenza**: 0-100 basato su 5 fattori
- **3 Strategie Pricing**:
  - **Conservativa**: +2-5% (prob. 90%+)
  - **Raccomandata**: +5-12% (prob. 70-85%)
  - **Aggressiva**: +10-20% (prob. 50-65%)
- **Output**: Revenue a rischio, delta potenziale, motivazioni
- **Endpoint**: `/api/repricing`

### 5. Risk Radar
- **Anomalie rilevate**:
  - Contratti scaduti
  - Scadenze imminenti (≤preavviso)
  - Tetto crediti >15%
  - Crediti SLA >5%
- **Gravità**: Alta/Media con colori distintivi
- **Endpoint**: `/api/anomalies`

### 6. Simulatore Scenari
- **Scenario 1**: Aumenta % CutAI (calcola clienti necessari)
- **Scenario 2**: Aggiungi N clienti a prodotto
- **Output**: Current vs Simulated + Delta + Timeline + Azioni
- **Endpoint**: `/api/simulate`

### 7. AI Advisor
- **Analisi portfolio**: Diversificazione, rinnovi, SLA, crescita, pricing
- **Consigli contestuali**: Basati su dati reali dashboard
- **Priorità**: Alta/Media/Bassa
- **Azioni suggerite**: Timeline e step operativi
- **Endpoint**: `/api/ai-advice`

---

## 🔐 Privacy & GDPR

### Compliance
- **GDPR compliant**: Art. 5, 17, 32
- **Consenso esplicito**: Trattamento dati
- **Diritti utenti**: Accesso, cancellazione, portabilità
- **DPO designato**: Data Protection Officer

### Data Retention
- **Contratti attivi**: Conservazione illimitata (necessità operativa)
- **Contratti scaduti**: 10 anni (obbligo fiscale italiano)
- **Log audit**: 5 anni (tracciabilità)
- **Dati personali**: Cancellazione su richiesta (Art. 17)

### Data Protection
- **Encryption**: AES-256 at-rest e in-transit
- **Data Residency**: Server EU
- **Backup**: Geograficamente distribuiti
- **Pseudonimizzazione**: Dati sensibili

---

## 🔄 Workflow Completi

### Onboarding Nuovo Contratto
1. Utente carica PDF contratto
2. Backend salva in `/uploads/`
3. Parser estrae testo (PyPDF2/OCR)
4. AI analizza e struttura dati (JSON)
5. Frontend mostra dati per verifica
6. [Opzionale] Analisi pre-firma con risk score
7. Utente conferma dati
8. Backend salva in database (contratto + versione 1)
9. Contratto disponibile in dashboard

### Rinnovo con Re-Pricing
1. Sistema identifica contratti in scadenza ≤20 giorni
2. Calcola indice confidenza cliente (0-100)
3. Genera 3 proposte pricing con probabilità
4. Fornisce motivazioni data-driven
5. Utente seleziona strategia
6. Crea nuova versione contratto con nuovo canone
7. Tracking delta revenue potenziale

---

## 📊 Componenti React (41 totali)

### Common (10)
`Badge`, `Button`, `Card`, `DataTable`, `Dropzone`, `EmptyState`, `ItalyMap`, `LoadingOverlay`, `SearchBox`, `StatCard`, `ToastContainer`

### Layout (2)
`Sidebar`, `Topbar`

### Upload Pipeline (5)
`UploadView`, `PipelineSteps`, `UploadStep`, `AnalysisStep`, `ConfirmationStep`

### Views (10)
`OverviewView`, `CostsView`, `ContractsView`, `ContractDetailView`, `RadarView`, `TopClientsView`, `AdvisorView`, `SimulatorView`, `RepricingView`, `PreSignAnalysisView`

### Hooks & Utils (4)
`useApi`, `useToast`, `api.js`, `helpers.js`

---

## 🎨 Design System

### Colori
```css
--bg-primary: #0a0e1a        /* Sfondo principale */
--bg-card: #1a1f35           /* Card/Box */
--text-primary: #f1f5f9      /* Testo principale */
--text-secondary: #94a3b8    /* Testo secondario */
--accent: #6366f1            /* Accent indigo */
--gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6)
--color-success: #22c55e     /* Verde */
--color-danger: #ef4444      /* Rosso */
--color-warning: #f59e0b     /* Arancione */
--color-info: #3b82f6        /* Blu */
```

### Tipografia
- **Font**: Inter (Google Fonts)
- **Pesi**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

---

## 🗺️ Roadmap

### Q2 2026
- [ ] Hero Insight in Overview (problema principale evidenziato)
- [ ] Geocoding automatico (Milano → lat/lng)
- [ ] Grafico distribuzione ricavi (Freader vs CutAI)

### Q3 2026
- [ ] AI Assistant Chat interattivo
- [ ] Alert predittivi con timeline
- [ ] Storico temporale KPI (MoM/YoY reali)

### Q4 2026
- [ ] Action Engine (task operativi)
- [ ] Export dati (CSV/Excel/PDF)
- [ ] Notifiche email automatiche

---

## 📈 Metriche Business

### Costi Operativi (per 40 clienti)
- **Personale**: €672k/anno (22%)
- **Cloud/GPU**: €540k/anno (18%)
- **Sales & Marketing**: €250k/anno (8%)
- **Altri**: €155k/anno (5%)
- **Totale**: €1.56M/anno

### Revenue
- **Freader**: €2.6M/anno (85.5%)
- **CutAI**: €360k/anno (14.5%)
- **Totale**: €3M/anno
- **Margine**: 48%

---

## 🤝 Contribuire

Contributi benvenuti! Per favore:
1. Fork il repository
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi file `LICENSE` per dettagli.

---

## 📞 Contatti

- **Website**: [foco.ai](https://foco.ai)
- **Email**: info@foco.ai
- **GitHub**: [@foco-platform](https://github.com/foco-platform)

---

## 🙏 Riconoscimenti

- **LLM**: Llama-3.3-70B-Instruct via [Regolo API](https://regolo.ai)
- **Dati mercato**: [Procurement Tactics](https://procurementtactics.com/), [Giornale delle PMI](https://www.giornaledellepmi.it/)
- **Ispirazione**: Necessità reale di automatizzare gestione contratti B2B

---

**Made with ❤️ in Italy**
