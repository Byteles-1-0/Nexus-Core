# Analisi Funzionale: Freader (Product 1)

**Freader** è una piattaforma avanzata erogata in modalità **Software as a Service (SaaS)**, progettata per l'automazione dei processi di estrazione dati da documenti digitali.

## 1. Finalità del Servizio
Il prodotto è rivolto ad aziende che gestiscono elevati volumi di documenti (es. fatture, contratti, moduli tecnici) e che necessitano di trasformare dati non strutturati (PDF) in dati strutturati e pronti per l'integrazione in database o ERP aziendali.

## 2. Funzionamento Tecnico
- **Input**: Caricamento di file in formato **PDF**.
- **Elaborazione**: Utilizzo di algoritmi di Intelligenza Artificiale e OCR (Optical Character Recognition) per la lettura e l'interpretazione dei campi definiti.
- **Interfaccia**: Mette a disposizione un'interfaccia grafica (front-end) per la visualizzazione immediata dei risultati estratti.
- **Output**: Generazione di file in formato **JSON** scaricabili, ottimizzati per il consumo da parte di sistemi terzi.
- **Infrastruttura**: Basato su cluster GPU per l'inferenza IA, ospitato su Microsoft Azure (Regione West Europe).

## 3. Modello Commerciale
Freader adotta un sistema di tariffazione misto (Fixed + Usage-based):
- **Canone Fisso**: Licenza trimestrale anticipata (tipicamente tra 5.000€ e 10.000€).
- **Tariffe a Volume**: Prezzo per pagina variabile in base a tre fasce mensili:
    1.  **Fascia 1.001 - 10.000**: Prezzo più alto (es. 12-20 cent).
    2.  **Fascia 10.001 - 50.000**: Prezzo medio (es. 10-18 cent).
    3.  **Fascia Oltre 50.000**: Prezzo scontato (es. 6-16 cent).

## 4. Livelli di Servizio (SLA)
- **Disponibilità (Uptime)**: Soglia minima del **98%** su base trimestrale.
- **Supporto Tecnico**: Sistema di ticketing 24x7 con tempi di presa in carico differenziati:
    - **Critico**: 4 ore.
    - **Medio**: 8 ore.
    - **Basso**: 1 giorno.
- **Penali**: In caso di violazione dell'uptime o degli SLA di supporto, il cliente matura crediti di servizio (sconti sulla fattura successiva) fino a un massimo del **10-13%** del canone trimestrale.

## 5. Privacy e Data Management
- **Retention**: I dati sono conservati per un massimo di 180-365 giorni.
- **GDPR**: Rispetto rigoroso della normativa europea; i dati dei clienti **non** vengono utilizzati per l'addestramento o il fine-tuning dei modelli IA generali del fornitore.
