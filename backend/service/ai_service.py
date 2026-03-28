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

# Importa la funzione di analisi dinamica
from service.dynamic_ai_service import analyze_dynamic_contract

def analyze_contract_text(text):
    """
    Analizza il testo e determina automaticamente se è Freader, CutAI o un contratto dinamico.
    Restituisce il JSON strutturato appropriato.
    """
    if not client:
        raise ValueError("Client AI non configurato. Assicurati di avere la libreria openai e la REGOLO_API_KEY.")
        
    if not text or len(text.strip()) < 10:
        raise ValueError("Il testo estratto dal documento è vuoto o troppo corto per essere analizzato.")

    # FASE 1: Identificazione del tipo di contratto
    identification_prompt = f"""
Analizza questo testo di contratto e identifica di quale prodotto si tratta.

Rispondi SOLO con un JSON in questo formato:
{{
  "product_type": "freader" oppure "cutai" oppure "other",
  "product_name": "Nome esatto del prodotto se identificato",
  "confidence": 0.95
}}

REGOLE:
- Se il testo menziona esplicitamente "Freader" o termini correlati (document processing, OCR platform), rispondi "freader"
- Se il testo menziona esplicitamente "CutAI" o termini correlati (AI cutting, optimization platform), rispondi "cutai"  
- Se è un contratto di un prodotto diverso, rispondi "other" e indica il nome del prodotto
- Non inventare, usa solo informazioni presenti nel testo

Testo del contratto (primi 2000 caratteri):
{text[:2000]}
"""

    try:
        # Identifica il tipo di contratto
        print(f"🔍 Identificazione tipo di contratto...")
        
        response = client.chat.completions.create(
            model="Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "Sei un classificatore di contratti. Rispondi SOLO con JSON valido."},
                {"role": "user", "content": identification_prompt}
            ],
            temperature=0.0
        )
        
        raw_response = response.choices[0].message.content
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        identification = json.loads(match.group(0) if match else raw_response.strip())
        
        product_type = identification.get('product_type', 'other').lower()
        product_name = identification.get('product_name', 'Sconosciuto')
        
        print(f"   Tipo identificato: {product_type} ({product_name})")
        
        # FASE 2: Analisi specifica in base al tipo
        if product_type == 'freader' or product_type == 'cutai':
            # Usa l'analisi standard per Freader/CutAI
            print(f"   → Uso analisi standard per {product_type}")
            return analyze_standard_contract(text, product_type)
        else:
            # Usa l'analisi dinamica per altri contratti
            print(f"   → Uso analisi dinamica per contratto sconosciuto")
            return analyze_dynamic_contract(text)
            
    except Exception as e:
        print(f"❌ Errore durante l'identificazione: {e}")
        # In caso di errore, prova l'analisi dinamica
        print(f"   → Fallback su analisi dinamica")
        return analyze_dynamic_contract(text)


def analyze_standard_contract(text, product_type):
    """Analisi standard per Freader e CutAI (codice originale)"""
    
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

    print(f"🧠 Analisi standard in corso...")
    
    response = client.chat.completions.create(
        model="Llama-3.3-70B-Instruct",
        messages=[
            {"role": "system", "content": "Sei un estrattore dati JSON B2B. Rispondi SOLO con JSON valido e formattato correttamente."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0
    )
    
    raw_response = response.choices[0].message.content
    match = re.search(r'\{.*\}', raw_response, re.DOTALL)
    
    if match:
        clean_json = match.group(0)
    else:
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        
    return json.loads(clean_json)