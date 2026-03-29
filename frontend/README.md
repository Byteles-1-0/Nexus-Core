# 🎯 FOCO - Frontend React

Applicazione React moderna migrata da Vanilla JavaScript con **modularizzazione estrema**.

## 🚀 Quick Start

```bash
# 1. Installa dipendenze
npm install

# 2. Avvia (assicurati che il backend sia su porta 5001)
npm run dev

# 3. Apri browser
http://localhost:3000
```

## 📚 Documentazione

| File | Descrizione |
|------|-------------|
| **INSTALL.md** | 📦 Guida installazione passo-passo |
| **QUICK_START.md** | ⚡ Avvio rapido e troubleshooting |
| **STRUCTURE.md** | 📁 Struttura cartelle e file |
| **COMPONENTI_CREATI.md** | 🧩 Elenco completo 41 componenti |
| **ARCHITETTURA.md** | 🏛️ Diagrammi e pattern architetturali |
| **MIGRATION_SUMMARY.md** | 🔄 Dettagli migrazione da Vanilla JS |
| **BEFORE_AFTER.md** | 📊 Confronto prima/dopo |
| **TEST_CHECKLIST.md** | ✅ Checklist test completa |

## 📦 Struttura Progetto

```
src/
├── App.jsx              # ⭐ Componente principale
├── main.jsx             # Entry point
├── components/
│   ├── common/          # 10 componenti riutilizzabili
│   ├── layout/          # Sidebar + Topbar
│   ├── welcome/         # Welcome flow (3 fasi)
│   ├── upload/          # Upload pipeline (4 step)
│   └── views/           # 7 views principali
├── hooks/               # useApi, useToast
└── utils/               # api.js, helpers.js
```

## ✨ Caratteristiche

- ✅ **41 componenti** modulari e riutilizzabili
- ✅ **Design identico** all'originale
- ✅ **Logica backend invariata**
- ✅ **Hooks** per gestione stato
- ✅ **Vite** per build veloce
- ✅ **Hot Module Replacement**
- ✅ **Code splitting** automatico

## 🎯 Componenti Principali

### Common (10)
Badge, Button, Card, DataTable, Dropzone, EmptyState, LoadingOverlay, SearchBox, StatCard, ToastContainer

### Layout (2)
Sidebar, Topbar

### Welcome (4)
WelcomePage, WelcomeUpload, WelcomeProcessing, WelcomeGreeting

### Upload (6)
UploadView, PipelineSteps, UploadStep, ExtractionStep, AnalysisStep, ConfirmationStep

### Views (7)
OverviewView, CostsView, ContractsView, ContractDetailView, RadarView, TopClientsView, AdvisorView

## 🔧 Comandi

```bash
npm run dev      # Sviluppo (porta 3000)
npm run build    # Build produzione
npm run preview  # Preview build
```

## 📝 File Originali (Backup)

I file Vanilla JS originali sono stati preservati:
- `index_vanilla.html` - HTML originale
- `app_vanilla.js` - JavaScript originale

## 🎨 Tecnologie

- React 18.3.1
- Vite 5.4.2
- CSS puro (no framework)

## 💡 Prossimi Step

1. Leggi `INSTALL.md` per installazione
2. Leggi `QUICK_START.md` per avvio rapido
3. Leggi `STRUCTURE.md` per capire l'architettura
4. Usa `TEST_CHECKLIST.md` per testare tutto

## 🐛 Supporto

Per problemi o domande, consulta:
- `QUICK_START.md` → Troubleshooting
- `ARCHITETTURA.md` → Pattern e best practices
- `BEFORE_AFTER.md` → Confronto codice

---

**Migrazione completata con successo! 🎉**

Tutti i file sono in `frontend/` e l'applicazione è pronta per essere avviata.
