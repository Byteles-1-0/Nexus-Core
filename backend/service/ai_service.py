import os
import json
import re

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

REGOLO_API_KEY = os.getenv("REGOLO_API_KEY")
REGOLO_BASE_URL = "https://api.regolo.ai/v1/"

client = None
if OpenAI and REGOLO_API_KEY:
    client = OpenAI(api_key=REGOLO_API_KEY, base_url=REGOLO_BASE_URL)

def analyze_contract_text(text):
    """Invia il testo all'AI e restituisce il JSON strutturato per Freader o CutAI."""
    if not client:
        raise ValueError("Client AI non configurato. Assicurati di avere la libreria openai e la REGOLO_API_KEY.")
        
    if not text or len(text.strip()) < 10:
        raise ValueError("Il testo estratto dal documento è vuoto o troppo corto per essere analizzato.")

    prompt = f"""
Agisci come il motore di "Contract Intelligence" della nostra piattaforma SaaS.
Analizza il seguente testo di un contratto B2B. Devi capire se si tratta del prodotto "Freader" o "CutAI" e popolare i campi pertinenti.

Estrai le entità ESCLUSIVAMENTE in formato JSON usando la struttura qui sotto. NON aggiungere nessun testo prima o dopo il JSON. I valori numerici devono essere numeri (float/int), non stringhe.

STRUTTURA JSON RICHIESTA:
{{
  "prodotto": "Freader" oppure "CutAI",
  "anagrafica": {{
    "cliente_ragione_sociale": "Nome azienda",
    "cliente_sede_legale": "Città o indirizzo completo"
  }},
  "dettagli_contratto": {{
    "data_firma": "DD/MM/YYYY",
    "durata_mesi": 12,
    "preavviso_giorni": 30
  }},
  "commerciale_freader": {{
    "canone_trimestrale": 0.0,
    "prezzo_fascia_1": 0.0,
    "prezzo_fascia_2": 0.0,
    "prezzo_fascia_3": 0.0
  }},
  "commerciale_cutai": {{
    "profilo_commerciale": "Standard" oppure "Premium",
    "canone_base_trimestrale": 0.0,
    "soglia_utenti_inclusi": 0,
    "fee_utente_extra": 0.0,
    "soglia_minima_servizio": 99.0
  }},
  "sla": {{
    "credito_uptime": 0.0,
    "credito_ticketing": 0.0,
    "tetto_crediti": 0.0
  }}
}}
Nota: popola solo "commerciale_freader" se il prodotto è Freader, oppure solo "commerciale_cutai" se è CutAI. Lascia i campi dell'altro a 0 o null.

Testo del Contratto:
{text[:20000]}
"""

    print(f"🧠 Testo ricevuto ({len(text)} caratteri). Inizio analisi semantica con LLM...")
    
    try:
        response = client.chat.completions.create(
            model="Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "Sei un estrattore dati JSON B2B. Rispondi SOLO con JSON valido e formattato correttamente."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0 # Temperatura a 0 per massima precisione deterministica
        )
        
        raw_response = response.choices[0].message.content
        
        # Estrazione sicura tramite Regex per pulire markdown (```json ... ```)
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        
        if match:
            clean_json = match.group(0)
        else:
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
            
        return json.loads(clean_json)
        
    except json.JSONDecodeError:
        print(f"❌ L'AI non ha restituito un JSON valido.")
        raise ValueError("Impossibile interpretare la risposta dell'AI come JSON.")
    except Exception as e:
        print(f"❌ Errore critico durante l'estrazione JSON: {e}")
        raise e


def analyze_pre_sign(contract_data, historical_contracts):
    """
    Analizza un contratto pre-firma confrontandolo con lo storico.
    Restituisce 3 livelli di modifiche suggerite (soft, media, strong).
    
    Args:
        contract_data: dict con i dati del contratto da analizzare
        historical_contracts: list di dict con contratti storici simili
    
    Returns:
        dict con analisi e 3 livelli di suggerimenti
    """
    if not client:
        raise ValueError("Client AI non configurato.")
    
    # Calculate historical averages
    if len(historical_contracts) > 0:
        avg_tetto_crediti = sum(c.get('tetto_cred', 0) for c in historical_contracts) / len(historical_contracts)
        avg_credito_uptime = sum(c.get('credito_uptime', 0) for c in historical_contracts) / len(historical_contracts)
        avg_credito_ticketing = sum(c.get('credito_ticketing', 0) for c in historical_contracts) / len(historical_contracts)
        avg_preavviso = sum(c.get('preavviso_gg', 0) for c in historical_contracts) / len(historical_contracts)
        avg_durata = sum(c.get('durata_mesi', 0) for c in historical_contracts) / len(historical_contracts)
        avg_canone = sum(c.get('canone_trim', 0) for c in historical_contracts) / len(historical_contracts)
    else:
        # Default safe values
        avg_tetto_crediti = 12.0
        avg_credito_uptime = 4.0
        avg_credito_ticketing = 3.0
        avg_preavviso = 60
        avg_durata = 24
        avg_canone = 10000
    
    prompt = f"""
Sei un esperto di contratti SaaS B2B. Analizza questo nuovo contratto confrontandolo con lo storico aziendale.

NUOVO CONTRATTO:
- Prodotto: {contract_data.get('prodotto', 'N/A')}
- Cliente: {contract_data.get('cliente', 'N/A')}
- Canone trimestrale: €{contract_data.get('canone_trim', 0)}
- Durata: {contract_data.get('durata_mesi', 0)} mesi
- Preavviso: {contract_data.get('preavviso_gg', 0)} giorni
- Tetto crediti SLA: {contract_data.get('tetto_cred', 0)}%
- Credito uptime: {contract_data.get('credito_uptime', 0)}%
- Credito ticketing: {contract_data.get('credito_ticketing', 0)}%

STORICO AZIENDALE ({len(historical_contracts)} contratti simili):
- Tetto crediti medio: {avg_tetto_crediti:.1f}%
- Credito uptime medio: {avg_credito_uptime:.1f}%
- Credito ticketing medio: {avg_credito_ticketing:.1f}%
- Preavviso medio: {avg_preavviso:.0f} giorni
- Durata media: {avg_durata:.0f} mesi
- Canone medio: €{avg_canone:.0f}

COMPITO:
Identifica le clausole problematiche e suggerisci 3 livelli di modifiche:
1. SOFT: Modifiche minime, basso rischio di perdere il cliente
2. MEDIA: Modifiche equilibrate, rischio moderato
3. STRONG: Modifiche aggressive per massima protezione aziendale

Rispondi SOLO con questo JSON (nessun testo aggiuntivo):
{{
  "risk_score": 0-100,
  "summary": "Breve sintesi dei rischi principali",
  "comparison": [
    {{"metric": "Tetto crediti", "current": 20, "historical_avg": 12, "deviation": "+67%", "risk": "alto"}},
    {{"metric": "Preavviso", "current": 30, "historical_avg": 60, "deviation": "-50%", "risk": "medio"}}
  ],
  "soft": [
    {{"clause": "Tetto crediti SLA", "current": "20%", "suggested": "18%", "impact": "Riduce esposizione di €2k/anno", "rationale": "Avvicinamento graduale allo storico"}}
  ],
  "media": [
    {{"clause": "Tetto crediti SLA", "current": "20%", "suggested": "15%", "impact": "Riduce esposizione di €5k/anno", "rationale": "Allineamento allo storico aziendale"}}
  ],
  "strong": [
    {{"clause": "Tetto crediti SLA", "current": "20%", "suggested": "10%", "impact": "Riduce esposizione di €10k/anno", "rationale": "Best practice mercato"}},
    {{"clause": "Preavviso", "current": "30 giorni", "suggested": "90 giorni", "impact": "Maggiore prevedibilità churn", "rationale": "Standard Enterprise"}}
  ]
}}
"""

    try:
        response = client.chat.completions.create(
            model="Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "Sei un esperto di contratti SaaS. Rispondi SOLO con JSON valido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        raw_response = response.choices[0].message.content
        
        # Clean JSON
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if match:
            clean_json = match.group(0)
        else:
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        
        return json.loads(clean_json)
        
    except Exception as e:
        print(f"❌ Errore analisi pre-firma: {e}")
        raise e
