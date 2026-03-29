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


def analyze_contract_risk(contract_data, testo_originale=''):
    """
    Analizza rischio contratto: risk score, punti critici, errori ortografici.
    Usa criteri standard + LLM per analisi testuale.
    """
    if not client:
        raise ValueError("Client AI non configurato.")
    
    sla = contract_data.get('sla', {})
    det = contract_data.get('dettagli_contratto', {})
    prodotto = contract_data.get('prodotto', 'N/A')
    
    tetto = sla.get('tetto_crediti', 0) or 0
    uptime = sla.get('credito_uptime', 0) or 0
    ticketing = sla.get('credito_ticketing', 0) or 0
    preavviso = det.get('preavviso_giorni', 30) or 30
    durata = det.get('durata_mesi', 12) or 12
    
    # Get canone
    if 'freader' in prodotto.lower():
        comm = contract_data.get('commerciale_freader', {})
        canone = comm.get('canone_trimestrale', 0) or 0
    else:
        comm = contract_data.get('commerciale_cutai', {})
        canone = comm.get('canone_base_trimestrale', 0) or 0

    # Rule-based critical points
    punti_critici = []
    
    if tetto > 12:
        punti_critici.append({
            'id': 'pc_tetto', 'sezione': 'SLA — Tetto Crediti', 'gravita': 'alta',
            'valore_attuale': f'{tetto}%', 'valore_riferimento': '12% (media portafoglio)',
            'spiegazione': f'Il tetto crediti al {tetto}% espone l\'azienda a rimborsi elevati. La media del portafoglio è 12%.',
            'testo_contratto_originale': f'Tetto crediti SLA: {tetto}%', 'testo_migliorato': None
        })
    elif tetto > 10:
        punti_critici.append({
            'id': 'pc_tetto', 'sezione': 'SLA — Tetto Crediti', 'gravita': 'media',
            'valore_attuale': f'{tetto}%', 'valore_riferimento': '10% (soglia consigliata)',
            'spiegazione': f'Tetto crediti al {tetto}%, leggermente sopra la soglia consigliata del 10%.',
            'testo_contratto_originale': f'Tetto crediti SLA: {tetto}%', 'testo_migliorato': None
        })
    
    if uptime > 7:
        punti_critici.append({
            'id': 'pc_uptime', 'sezione': 'SLA — Credito Uptime', 'gravita': 'alta',
            'valore_attuale': f'{uptime}%', 'valore_riferimento': '5% (media portafoglio)',
            'spiegazione': f'Credito uptime al {uptime}% è molto alto. Rischio rimborsi significativi in caso di downtime.',
            'testo_contratto_originale': f'Credito uptime: {uptime}%', 'testo_migliorato': None
        })
    elif uptime > 5:
        punti_critici.append({
            'id': 'pc_uptime', 'sezione': 'SLA — Credito Uptime', 'gravita': 'media',
            'valore_attuale': f'{uptime}%', 'valore_riferimento': '5% (media portafoglio)',
            'spiegazione': f'Credito uptime al {uptime}%, sopra la media del portafoglio.',
            'testo_contratto_originale': f'Credito uptime: {uptime}%', 'testo_migliorato': None
        })
    
    if ticketing > 6:
        punti_critici.append({
            'id': 'pc_ticketing', 'sezione': 'SLA — Credito Ticketing', 'gravita': 'alta' if ticketing > 8 else 'media',
            'valore_attuale': f'{ticketing}%', 'valore_riferimento': '5% (media portafoglio)',
            'spiegazione': f'Credito ticketing al {ticketing}% è elevato. Penale significativa per mancato SLA ticket.',
            'testo_contratto_originale': f'Credito ticketing: {ticketing}%', 'testo_migliorato': None
        })
    
    if preavviso < 30:
        punti_critici.append({
            'id': 'pc_preavviso_basso', 'sezione': 'Preavviso Disdetta', 'gravita': 'alta',
            'valore_attuale': f'{preavviso} giorni', 'valore_riferimento': '30-60 giorni (standard)',
            'spiegazione': f'Preavviso di soli {preavviso} giorni. Rischio churn improvviso senza tempo per retention.',
            'testo_contratto_originale': f'Preavviso disdetta: {preavviso} giorni', 'testo_migliorato': None
        })
    elif preavviso > 120:
        punti_critici.append({
            'id': 'pc_preavviso_alto', 'sezione': 'Preavviso Disdetta', 'gravita': 'media',
            'valore_attuale': f'{preavviso} giorni', 'valore_riferimento': '30-60 giorni (standard)',
            'spiegazione': f'Preavviso di {preavviso} giorni è un vincolo operativo elevato per entrambe le parti.',
            'testo_contratto_originale': f'Preavviso disdetta: {preavviso} giorni', 'testo_migliorato': None
        })
    
    if durata > 36:
        punti_critici.append({
            'id': 'pc_durata', 'sezione': 'Durata Contratto', 'gravita': 'media',
            'valore_attuale': f'{durata} mesi', 'valore_riferimento': '12-24 mesi (standard)',
            'spiegazione': f'Contratto a {durata} mesi limita la flessibilità di repricing e adeguamento condizioni.',
            'testo_contratto_originale': f'Durata contratto: {durata} mesi', 'testo_migliorato': None
        })
    
    # Use LLM for text-based analysis if text is available
    errori_ortografici = []
    if testo_originale and len(testo_originale.strip()) > 50:
        try:
            text_prompt = f"""Analizza questo testo di contratto B2B e restituisci SOLO un JSON con:
1. "errori_ortografici": lista di errori di battitura/grammatica trovati
2. "clausole_rischiose": clausole testuali che presentano rischi (uso dati, esclusiva, responsabilità, rinnovo)

JSON richiesto:
{{
  "errori_ortografici": [
    {{"posizione": "Art. X.Y", "originale": "parola errata", "corretto": "parola corretta"}}
  ],
  "clausole_rischiose": [
    {{"id": "pc_xxx", "sezione": "Nome sezione", "gravita": "alta|media|bassa", "valore_attuale": "descrizione", "valore_riferimento": "standard", "spiegazione": "perché è rischioso", "testo_contratto_originale": "testo esatto dal contratto", "testo_migliorato": null}}
  ]
}}

Testo contratto:
{testo_originale[:10000]}"""

            response = client.chat.completions.create(
                model="Llama-3.3-70B-Instruct",
                messages=[
                    {"role": "system", "content": "Sei un analista legale di contratti B2B. Rispondi SOLO con JSON valido."},
                    {"role": "user", "content": text_prompt}
                ],
                temperature=0.1
            )
            raw = response.choices[0].message.content
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                ai_result = json.loads(match.group(0))
                errori_ortografici = ai_result.get('errori_ortografici', [])
                ai_clausole = ai_result.get('clausole_rischiose', [])
                for cl in ai_clausole:
                    cl['id'] = cl.get('id', f'pc_ai_{len(punti_critici)}')
                    punti_critici.append(cl)
        except Exception as e:
            print(f"⚠️ LLM text analysis failed, using rule-based only: {e}")
    
    # Calculate risk score based on entire contract, not just critical points count
    # Base score starts at 15 (every contract has some inherent risk)
    risk_score = 15
    
    # SLA risk component (0-30 points)
    sla_risk = 0
    sla_risk += min(15, tetto * 1.0)        # tetto 10% = 10pts, 20% = 15pts cap
    sla_risk += min(8, uptime * 1.2)         # uptime 5% = 6pts, 7% = 8pts cap
    sla_risk += min(7, ticketing * 1.0)      # ticketing 5% = 5pts, 7% = 7pts cap
    risk_score += sla_risk
    
    # Contract terms risk component (0-25 points)
    terms_risk = 0
    if preavviso < 30:
        terms_risk += 12                      # very short notice = high risk
    elif preavviso < 60:
        terms_risk += 5
    if durata > 36:
        terms_risk += 8                       # long lock-in
    elif durata > 24:
        terms_risk += 3
    if canone > 0 and canone < 3000:
        terms_risk += 5                       # very low revenue contract
    risk_score += terms_risk
    
    # Critical points severity bonus (0-20 points)
    weights = {'alta': 4, 'media': 2, 'bassa': 1}
    critical_bonus = sum(weights.get(p.get('gravita', 'bassa'), 1) for p in punti_critici)
    risk_score += min(20, critical_bonus)
    
    # Spelling errors add minor risk (0-5 points)
    risk_score += min(5, len(errori_ortografici) * 2)
    
    # If no critical points found, risk is negligible
    if not punti_critici and not errori_ortografici:
        risk_score = 0
    elif not punti_critici:
        risk_score = min(risk_score, 1)
    
    # Cap at 95
    risk_score = min(95, max(0, round(risk_score)))
    
    return {
        'risk_score': risk_score,
        'errori_ortografici': errori_ortografici,
        'punti_critici': punti_critici
    }


def improve_contract_clause(clausola_originale, tipo_problema, contesto, valore_riferimento):
    """AI riscrive una clausola critica con termini migliori."""
    if not client:
        raise ValueError("Client AI non configurato.")
    
    prompt = f"""Sei un esperto legale di contratti SaaS B2B. Riscrivi questa clausola contrattuale migliorandola per il fornitore, mantenendo il tono formale e restando nel contesto corretto. Non fare richieste irrealistiche.

CLAUSOLA ORIGINALE:
{clausola_originale}

PROBLEMA IDENTIFICATO: {tipo_problema}
CONTESTO: {contesto}
VALORE DI RIFERIMENTO: {valore_riferimento}

Rispondi SOLO con questo JSON:
{{
  "clausola_migliorata": "testo della clausola riscritta",
  "motivazione": "breve spiegazione delle modifiche apportate"
}}"""

    try:
        response = client.chat.completions.create(
            model="Llama-3.3-70B-Instruct",
            messages=[
                {"role": "system", "content": "Sei un esperto legale. Rispondi SOLO con JSON valido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        raw = response.choices[0].message.content
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError("Risposta AI non valida")
    except Exception as e:
        print(f"❌ Errore improve clause: {e}")
        raise e
