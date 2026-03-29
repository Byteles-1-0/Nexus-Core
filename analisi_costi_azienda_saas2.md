# Analisi Economica: SaaS OCR & AI (Completamente Revisionata)

Questo documento analizza la struttura dei costi di un'azienda SaaS focalizzata sull'estrazione dati (come **Freader** e **CutAI**), confrontando i ricavi potenziali estratti dai contratti con i costi reali di mercato. I dati sono stati normalizzati per riflettere le reali dinamiche aziendali e fiscali del mercato italiano ad oggi.

## 1. Stima dei Ricavi Annuali (Portfolio Attuale)

Basandoci sui circa 40 contratti presenti nelle cartelle Prodotto 1 e 2, possiamo stimare un fatturato annuo:

- **Prodotto 1 (Freader)**: ~20 clienti. Canone fisso (~640k€) + Variabile segmentata (stimata ~1.49M€/anno) = **~2.13M €**.
- **Prodotto 2 (CutAI)**: ~20 clienti. Canone fisso (~240k€) + Variabile utenti (stimato ~120k€/anno) = **~0.36M €**.
- **Totale Ricavi Stimati (Modello Prudenziale)**: **~2.49M € / anno**.

---

## 2. Analisi dei Costi Operativi (OPEX)

Per gestire una piattaforma del genere con 40+ clienti Enterprise, la struttura dei costi si divide in quattro pilastri: Personale, Infrastruttura, Marketing/Vendite e Spese Generali (G&A).

### A. Risorse Umane (Focus Mercato Italia)
In Italia, il costo del lavoro è influenzato da contributi previdenziali (INPS, INAIL) e TFR. Il **Costo Aziendale** stimato è circa **1,4 volte la RAL** (Retribuzione Annua Lorda). L'organigramma include ora la direzione strategica e i piani provvigionali.

| Ruolo | RAL Media (IT) | Costo Aziendale Anno | Note |
| :--- | :--- | :--- | :--- |
| **CEO / Founder** | 100.000 € | 140.000 € | Direzione generale e fund raising |
| **CTO / Tech Lead** | 90.000 € | 126.000 € | Seniority alta, gestione architettura |
| **2x AI/ML Engineers** | 130.000 € | 182.000 € | Media 65k€ RAL cad. (Rischio turnover alto) |
| **3x Backend Devs** | 135.000 € | 189.000 € | Media 45k€ RAL cad. (Mid) |
| **Sales / Account Mgr** | 45.000 € | 113.000 € | Inclusi ~50k€ di provvigioni/bonus stimati |
| **2x Customer Success** | 80.000 € | 112.000 € | Media 40k€ RAL cad. |
| **Totale Personale** | **580.000 €** | **~862.000 €** | |

### B. Infrastruttura Tecnologica (Cloud vs On-Prem)
L'estrazione dati tramite IA è "computational expensive".

- **Cloud (AWS/Azure/GCP)**: L'utilizzo di istanze GPU per l'inferenza in tempo reale cala proporzionalmente ai volumi (1.075M pagine/mese).
    - **Costo Variabile Inferenza**: ~387.000 € / anno (basato su ~0.03€/pagina).
    - **Costi Fissi Cloud (DB, Core)**: ~100.000 € / anno.
- **Storage & Traffico**: Gestione di milioni di PDF e output JSON: **~30.000 € / anno**.
- **TOTALE Infrastruttura Stimata**: **~517.000 € / anno**.

### C. Acquisizione e Vendite (Sales & Marketing)
Acquisire clienti Enterprise richiede un budget strutturato per eventi, lead generation e marketing B2B.
- **Budget Marketing & CAC**: **~250.000 € / anno**.

### D. Spese Generali, Amministrative e Tooling (G&A)
Per supportare il team e mantenere la conformità con i clienti Enterprise, ci sono costi fissi inevitabili:
- **Conformità, Privacy e Sicurezza**: Certificazioni (ISO 27001, SOC2), audit legale e assicurazione Cyber-Risk: **~55.000 € / anno**.
- **Software SaaS Interni**: Licenze (Workspace, CRM, GitHub, Jira, Figma, Zendesk): **~30.000 € / anno**.
- **Sede, Utenze e Trasferte**: Ufficio/Coworking di rappresentanza, rimborsi remote-working e viaggi per onboarding clienti: **~50.000 € / anno**.
- **Consulenze Professionali**: Commercialista, consulente del lavoro, revisione legale contratti: **~25.000 € / anno**.
- **TOTALE G&A**: **~160.000 € / anno**.

---

## 3. Confronto e Redditività

| Voce | Valore Annuo | % sui Ricavi |
| :--- | :--- | :--- |
| **Ricavi Totali** | **2.490.000 €** | **100%** |
| Costo Personale (IT) | 862.000 € | 34.6% |
| Infrastruttura (Accoppiata) | 517.000 € | 20.8% |
| Sales & Marketing | 250.000 € | 10.0% |
| Spese Generali (G&A) | 160.000 € | 6.4% |
| **EBITDA (Margine Operativo)** | **~701.000 €** | **~28.2%** |

### Conclusioni dell'Analisi
- **Margini Reali**: Un'azienda SaaS di questo tipo, a regime, viaggia su un EBITDA intorno al 28%. Questo è un dato molto più realistico rispetto alle proiezioni ottimistiche del 40-50%, in quanto assorbe i costi strutturali completi di gestione.
- **Carico Fiscale (Next Steps)**: L'EBITDA non rappresenta l'utile netto. Dal margine di 701.000 € andranno dedotti gli ammortamenti e soprattutto la fiscalità italiana (IRES al 24% e IRAP al 3,9%), che impatta pesantemente sui modelli ad alta intensità di personale.
- **Rischio**: Il rischio principale rimane il **Churn** (abbandono) di pochi grandi clienti. Inoltre, la competizione globale sugli stipendi degli ingegneri AI potrebbe costringere a rivedere al rialzo la voce "Costo Personale" per evitare un turnover paralizzante.
- **Scalabilità**: Il Prodotto 2 (CutAI) è il vero driver di crescita futura perché il costo marginale di un utente extra è drasticamente inferiore al costo di processamento di migliaia di documenti del Prodotto 1.