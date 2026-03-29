# Analisi Economica: SaaS OCR & AI (CompletlyFake)

Questo documento analizza la struttura dei costi di un'azienda SaaS focalizzata sull'estrazione dati (come **Freader** e **CutAI**), confrontando i ricavi potenziali estratti dai contratti con i costi reali di mercato.

## 1. Stima dei Ricavi Annuali (Portfolio Attuale)

Basandoci sui circa 40 contratti presenti nelle cartelle Prodotto 1 e 2, possiamo stimare un fatturato annuo:

- **Prodotto 1 (Freader)**: ~20 clienti. Canone fisso (~640k€/anno) + Variabile volumi (stimato ~2M€/anno) = **~2.6M €**.
- **Prodotto 2 (CutAI)**: ~20 clienti. Canone fisso (~240k€/anno) + Variabile utenti (stimato ~120k€/anno) = **~0.36M €**.
- **Totale Ricavi Stimati**: **~3.0M € / anno**.

---

## 2. Analisi dei Costi Operativi (OPEX)

Per gestire una piattaforma del genere con 40+ clienti Enterprise, la struttura dei costi si divide in tre pilastri: Personale, Infrastruttura e Altri Oneri.

### A. Risorse Umane (Focus Mercato Italia 2024-2025)
In Italia, il costo del lavoro è influenzato da contributi previdenziali (INPS, INAIL) e TFR. Il **Costo Aziendale** stimato è circa **1,4 volte la RAL** (Retribuzione Annua Lorda).

| Ruolo | RAL Media (IT) | Costo Aziendale Anno | Note |
| :--- | :--- | :--- | :--- |
| **CTO / Tech Lead** | 90.000 € | 126.000 € | Seniority alta, gestione architettura |
| **2x AI/ML Engineers** | 130.000 € | 182.000 € | Media 65k€ RAL cad. (Senior) |
| **3x Backend Devs** | 135.000 € | 189.000 € | Media 45k€ RAL cad. (Mid) |
| **Sales / Account Mgr** | 45.000 € | 63.000 € | Esclusa parte variabile/bonus |
| **2x Customer Success** | 80.000 € | 112.000 € | Media 40k€ RAL cad. |
| **Totale Personale** | **480.000 €** | **~672.000 €** | |

*Nota: Gli stipendi per ruoli AI a Milano/Roma possono superare queste medie se l'azienda compete con player internazionali.*

### B. Infrastruttura Tecnologica (Cloud vs On-Prem)
L'estrazione dati tramite IA è "computational expensive".

- **Cloud (AWS/Azure/GCP)**: L'utilizzo di istanze GPU per l'inferenza in tempo reale costa circa il 15-20% del fatturato.
    - **Costo stimato**: **~500.000 € / anno**.
- **Energia (opzione On-Prem)**: Se l'azienda usasse server locali, il costo energetico per cluster GPU da 8-16 schede (A100/H100) sarebbe di circa **30.000 - 50.000 € / anno**, oltre al costo di acquisto hardware (~200k€).
- **Storage & Traffico**: Gestione di milioni di PDF e output JSON: **~40.000 € / anno**.

### C. Costi "Nascosti" e Strategici
- **Marketing & Sales (CAC)**: Acquisire clienti Enterprise costa. Budget stimato: **~250.000 € / anno**.
- **Conformità & Privacy (GDPR)**: Trattando documenti sensibili, le certificazioni (ISO 27001, SOC2) e l'audit legale sono fondamentali: **~40.000 € / anno**.
- **Assicurazione Cyber-Risk**: Protezione contro data breach: **~15.000 € / anno**.

---

## 3. Confronto e Redditività

| Voce | Valore Annuo | % sui Ricavi |
| :--- | :--- | :--- |
| **Ricavi Totali** | **3.000.000 €** | **100%** |
| Costo Personale (IT) | 672.000 € | 22% |
| Infrastruttura Cloud | 540.000 € | 18% |
| Sales & Marketing | 250.000 € | 8% |
| Admin / Legal / Office | 100.000 € | 3% |
| **EBITDA (Margine Operativo)** | **~1.438.000 €** | **~48%** |

### Conclusioni dell'Analisi
- **Margini**: Un'azienda di questo tipo ha margini molto alti (~50%) se riesce a mantenere il costo di calcolo (Infrastruttura) sotto controllo tramite l'ottimizzazione dei modelli.
- **Rischio**: Il rischio principale è il **Churn** (abbandono) di pochi grandi clienti, dato che i ricavi sono concentrati. Inoltre, l'aumento dei costi energetici o dei listini Cloud può erodere i margini rapidamente.
- **Scalabilità**: Il Prodotto 2 (CutAI) è più scalabile perché il costo marginale di un utente extra è inferiore al costo di processamento di migliaia di pagine (Prodotto 1).
