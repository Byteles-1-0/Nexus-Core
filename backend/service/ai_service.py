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