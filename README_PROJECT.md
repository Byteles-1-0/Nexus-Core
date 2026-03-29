# FOCO - Contract Intelligence Platform

Piattaforma di gestione contratti B2B con AI per l'estrazione automatica dei dati.

## 🏗️ Struttura Progetto

```
.
├── backend/          # Backend Python Flask (API REST)
├── frontend/         # Frontend React + Vite
│   ├── src/         # Codice sorgente React (41 componenti)
│   ├── index.html   # Entry point React
│   ├── app_vanilla.js    # Vanilla JS originale (backup)
│   └── index_vanilla.html # HTML originale (backup)
└── Cartelle prodotto 1 e 2/  # Dati di test contratti
```

## 🚀 Avvio Rapido

### 1. Backend (Python Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Backend disponibile su: `http://localhost:5001`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend disponibile su: `http://localhost:3000`

## 📚 Documentazione

### Frontend React
- **`frontend/README_REACT.md`** - Documentazione completa React
- **`frontend/MIGRATION_SUMMARY.md`** - Dettagli migrazione da Vanilla JS

### Analisi Business
- **`analisi_costi_azienda_saas2.md`** - Analisi economica
- **`analisi_freader.md`** - Analisi prodotto Freader
- **`analisi_cutai.md`** - Analisi prodotto CutAI

## 🎯 Tecnologie

### Backend
- Python 3.x
- Flask
- SQLite
- OpenAI API (per analisi AI)

### Frontend
- React 18.3
- Vite 5.4
- CSS puro (design system custom)

## 📦 Componenti React (41 file)

### Common (10)
Badge, Button, Card, DataTable, Dropzone, EmptyState, LoadingOverlay, SearchBox, StatCard, ToastContainer

### Layout (2)
Sidebar, Topbar

### Welcome Flow (4)
WelcomePage, WelcomeUpload, WelcomeProcessing, WelcomeGreeting

### Upload Pipeline (6)
UploadView, PipelineSteps, UploadStep, ExtractionStep, AnalysisStep, ConfirmationStep

### Views (7)
OverviewView, CostsView, ContractsView, ContractDetailView, RadarView, TopClientsView, AdvisorView

### Hooks & Utils (4)
useApi, useToast, api.js, helpers.js

## ✨ Funzionalità

- 📤 Upload contratti (PDF, DOCX, JPG, PNG)
- 🤖 Estrazione dati con AI
- 📊 Dashboard con KPI
- 💰 Analisi costi per prodotto
- 🎯 Risk radar e anomalie
- 👥 Top clients ranking
- 💡 AI Advisor strategico
- 🗺️ Mappa geografica clienti

## 🔧 Sviluppo

Il progetto è stato migrato da Vanilla JavaScript a React mantenendo:
- ✅ Design identico
- ✅ Struttura visiva invariata
- ✅ Logica backend identica
- ✅ Endpoint API identici

La migrazione ha introdotto:
- ✅ Modularizzazione estrema
- ✅ Componenti riutilizzabili
- ✅ Hooks per gestione stato
- ✅ Build ottimizzato con Vite

## 📝 Note

I file originali Vanilla JS sono stati preservati come backup:
- `frontend/index_vanilla.html`
- `frontend/app_vanilla.js`
