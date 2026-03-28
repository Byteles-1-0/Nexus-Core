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

def analyze_dynamic_contract(text):
    """
    Analizza un contratto con struttura sconosciuta usando un approccio dinamico.
    L'AI identifica il tipo di documento e estrae tutte le coppie chiave-valore rilevanti.
    """
    if not client:
        raise ValueError("Client AI non configurato. Assicurati di avere la libreria openai e la REGOLO_API_KEY.")
        
    if not text or len(text.strip()) < 10:
        raise ValueError("Il testo estratto dal documento è vuoto o troppo corto per essere analizzato.")

    prompt = f"""
Agisci come un estrattore universale di dati contrattuali per la piattaforma FOCO Contract Intelligence.

Analizza il seguente documento e:
1. Identifica il tipo di documento e il nome del prodotto/servizio ESATTAMENTE come appare nel testo
2. Estrai TUTTI i dati presenti nel documento sotto forma di coppie chiave-valore
3. Per ogni valore, usa ESATTAMENTE il valore che trovi nel testo, non inventare o modificare nulla
4. Assegna una label leggibile in italiano e il tipo di dato corretto

Restituisci ESCLUSIVAMENTE un JSON valido con questa struttura (NON aggiungere testo prima o dopo):

{{
  "metadata": {{
    "document_type": "Tipo di documento esattamente come appare nel testo",
    "product_name": "Nome del prodotto/servizio esattamente come appare nel testo",
    "confidence_score": 0.95
  }},
  "anagrafica": {{
    "cliente_ragione_sociale": "Nome azienda cliente ESATTO dal testo",
    "cliente_sede_legale": "Sede legale ESATTA dal testo"
  }},
  "extracted_data": [
    {{
      "key": "chiave_tecnica_snake_case",
      "label": "Etichetta Leggibile in Italiano",
      "value": "VALORE ESATTO DAL TESTO (numero, stringa, data, booleano)",
      "type": "string|number|date|percentage|boolean",
      "category": "commercial|technical|sla|legal|anagrafica"
    }}
  ]
}}

REGOLE CRITICHE:
- USA I VALORI ESATTI dal testo, non inventare o modificare
- Se trovi "€ 299,00" o "299 EUR", estrai il numero 299.00
- Se trovi "500 GB" o "500GB", estrai la stringa "500GB"
- Se trovi "99.5%" o "99,5%", estrai il numero 99.5 con type "percentage"
- Se trovi "12 mesi", estrai il numero 12
- Se trovi "01/02/2026" o "1 Febbraio 2026", estrai in formato "01/02/2026"
- Le chiavi devono essere in snake_case (es. canone_mensile, storage_incluso, uptime_garantito)
- Le label devono essere in italiano (es. "Canone Mensile", "Storage Incluso", "Uptime Garantito")
- I valori numerici devono essere numeri puri (299.00, non "299.00" o "€ 299,00")
- Categorizza correttamente:
  * commercial: prezzi, canoni, costi, sconti
  * technical: storage, utenti, limiti tecnici, API
  * sla: uptime, tempi di risposta, penali, garanzie
  * legal: durata, preavviso, clausole legali, rinnovo
  * anagrafica: dati cliente/fornitore aggiuntivi

ESEMPI DI ESTRAZIONE CORRETTA:

Testo: "Canone Mensile: € 299,00"
→ {{"key": "canone_mensile", "label": "Canone Mensile", "value": 299.00, "type": "number", "category": "commercial"}}

Testo: "Storage Incluso: 500 GB"
→ {{"key": "storage_incluso", "label": "Storage Incluso", "value": "500GB", "type": "string", "category": "technical"}}

Testo: "Uptime Garantito: 99.5%"
→ {{"key": "uptime_garantito", "label": "Uptime Garantito", "value": 99.5, "type": "percentage", "category": "sla"}}

Testo: "Durata: 12 mesi"
→ {{"key": "durata_mesi", "label": "Durata Contratto", "value": 12, "type": "number", "category": "legal"}}

Testo: "Data Inizio: 01 Febbraio 2026"
→ {{"key": "data_inizio", "label": "Data Inizio", "value": "01/02/2026", "type": "date", "category": "legal"}}

Testo del Contratto:
{text[:20000]}
"""

    print(f"🧠 Analisi dinamica in corso ({len(text)} caratteri)...")
    
    try:
        response = client.chat.completions.create(
            model="Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "Sei un estrattore universale di dati contrattuali. Rispondi SOLO con JSON valido e formattato correttamente."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0
        )
        
        raw_response = response.choices[0].message.content
        
        # Estrazione sicura tramite Regex per pulire markdown
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        
        if match:
            clean_json = match.group(0)
        else:
            clean_json = raw_response.replace("```json", "").replace("```", "").strip()
            
        result = json.loads(clean_json)
        
        # Validazione e pulizia dei dati estratti
        if 'extracted_data' in result:
            cleaned_data = []
            for item in result['extracted_data']:
                # Assicurati che tutti i campi richiesti siano presenti
                if all(k in item for k in ['key', 'label', 'value', 'type', 'category']):
                    # Pulisci i valori numerici se necessario
                    if item['type'] == 'number' or item['type'] == 'percentage':
                        try:
                            # Converti stringhe numeriche in numeri
                            if isinstance(item['value'], str):
                                # Rimuovi simboli di valuta e spazi
                                clean_val = item['value'].replace('€', '').replace(',', '.').strip()
                                item['value'] = float(clean_val)
                        except:
                            pass  # Mantieni il valore originale se la conversione fallisce
                    
                    cleaned_data.append(item)
            
            result['extracted_data'] = cleaned_data
        
        print(f"✅ Analisi dinamica completata: {result['metadata']['product_name']}")
        print(f"   Campi estratti: {len(result.get('extracted_data', []))}")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"❌ L'AI non ha restituito un JSON valido: {e}")
        raise ValueError("Impossibile interpretare la risposta dell'AI come JSON.")
    except Exception as e:
        print(f"❌ Errore critico durante l'analisi dinamica: {e}")
        raise e
