import uuid
from extensions import db
from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion

# Dizionario città italiane → coordinate (lat, lng)
ITALIAN_CITIES = {
    "milano": (45.4654, 9.1859), "rome": (41.9028, 12.4964), "roma": (41.9028, 12.4964),
    "napoli": (40.8518, 14.2681), "naples": (40.8518, 14.2681),
    "torino": (45.0703, 7.6869), "turin": (45.0703, 7.6869),
    "palermo": (38.1157, 13.3615), "genova": (44.4056, 8.9463), "genoa": (44.4056, 8.9463),
    "bologna": (44.4949, 11.3426), "firenze": (43.7696, 11.2558), "florence": (43.7696, 11.2558),
    "bari": (41.1171, 16.8719), "catania": (37.5079, 15.0830), "venezia": (45.4408, 12.3155),
    "venice": (45.4408, 12.3155), "verona": (45.4384, 10.9916), "messina": (38.1938, 15.5540),
    "padova": (45.4064, 11.8768), "trieste": (45.6495, 13.7768), "taranto": (40.4644, 17.2470),
    "brescia": (45.5416, 10.2118), "prato": (43.8777, 11.1023), "reggio calabria": (38.1113, 15.6474),
    "modena": (44.6471, 10.9252), "reggio emilia": (44.6989, 10.6297), "perugia": (43.1107, 12.3908),
    "livorno": (43.5485, 10.3106), "ravenna": (44.4184, 12.2035), "cagliari": (39.2238, 9.1217),
    "foggia": (41.4621, 15.5444), "rimini": (44.0678, 12.5695), "salerno": (40.6824, 14.7681),
    "ferrara": (44.8381, 11.6197), "sassari": (40.7259, 8.5556), "latina": (41.4677, 12.9035),
    "giugliano": (40.9281, 14.1956), "monza": (45.5845, 9.2744), "siracusa": (37.0755, 15.2866),
    "pescara": (42.4618, 14.2160), "bergamo": (45.6983, 9.6773), "forlì": (44.2227, 12.0407),
    "trento": (46.0748, 11.1217), "vicenza": (45.5455, 11.5354), "terni": (42.5636, 12.6430),
    "bolzano": (46.4983, 11.3548), "novara": (45.4469, 8.6215), "piacenza": (45.0526, 9.6930),
    "ancona": (43.6158, 13.5189), "andria": (41.2278, 16.2952), "arezzo": (43.4633, 11.8797),
    "udine": (46.0711, 13.2350), "cesena": (44.1391, 12.2435), "lecce": (40.3516, 18.1750),
    "barletta": (41.3178, 16.2839), "alessandria": (44.9124, 8.6151), "la spezia": (44.1024, 9.8240),
    "pisa": (43.7228, 10.4017), "catanzaro": (38.9098, 16.5877), "como": (45.8080, 9.0852),
    "brindisi": (40.6326, 17.9417), "pistoia": (43.9330, 10.9170), "lucca": (43.8430, 10.5050),
}

def geocode_city(sede_legale):
    """Estrae lat/lng dalla sede legale cercando città italiane note."""
    if not sede_legale:
        return None, None
    text = sede_legale.lower()
    for city, coords in ITALIAN_CITIES.items():
        if city in text:
            return coords
    return None, None

def parse_int(val, default=0):
    try:
        return int(float(str(val)))
    except:
        return default

def parse_float(val, default=0.0):
    try:
        return float(str(val))
    except:
        return default

def save_contract_to_db(tenant_id, extracted_data, created_by="AI_Extraction_System", filename=None):
    """
    Riceve il JSON estratto dall'AI (dopo l'approvazione umana) e lo salva nel database 
    generando il contratto radice e la Versione 1 (Audit-Ready).
    """
    try:
        prodotto = extracted_data.get('prodotto', '').lower()
        new_contract_id = str(uuid.uuid4())
        
        anagrafica = extracted_data.get('anagrafica', {})
        dettagli = extracted_data.get('dettagli_contratto', {})
        sla = extracted_data.get('sla', {})
        sede = anagrafica.get('cliente_sede_legale', '')
        lat, lng = geocode_city(sede)

        if "freader" in prodotto:
            commerciale = extracted_data.get('commerciale_freader', {})
            
            contract = FreaderContract(
                id=new_contract_id,
                tenant_id=tenant_id,
                cliente_ragione_sociale=anagrafica.get('cliente_ragione_sociale', 'Sconosciuto'),
                cliente_sede_legale=sede or 'Sconosciuta',
                status='ACTIVE',
                original_filename=filename,
                lat=lat,
                lng=lng
            )
            db.session.add(contract)
            
            version = FreaderContractVersion(
                contract_id=new_contract_id,
                version_number=1,
                data_firma=dettagli.get('data_firma', ''),
                durata_mesi=parse_int(dettagli.get('durata_mesi'), 12),
                preavviso_giorni=parse_int(dettagli.get('preavviso_giorni'), 30),
                canone_trimestrale=parse_float(commerciale.get('canone_trimestrale'), 0.0),
                prezzo_fascia_1=parse_float(commerciale.get('prezzo_fascia_1'), 0.0),
                prezzo_fascia_2=parse_float(commerciale.get('prezzo_fascia_2'), 0.0),
                prezzo_fascia_3=parse_float(commerciale.get('prezzo_fascia_3'), 0.0),
                credito_uptime=parse_float(sla.get('credito_uptime'), 0.0),
                credito_ticketing=parse_float(sla.get('credito_ticketing'), 0.0),
                tetto_crediti=parse_float(sla.get('tetto_crediti'), 0.0),
                created_by=created_by
            )
            db.session.add(version)
            
        elif "cutai" in prodotto:
            commerciale = extracted_data.get('commerciale_cutai', {})
            
            contract = CutAIContract(
                id=new_contract_id,
                tenant_id=tenant_id,
                cliente_ragione_sociale=anagrafica.get('cliente_ragione_sociale', 'Sconosciuto'),
                cliente_sede_legale=sede or 'Sconosciuta',
                status='ACTIVE',
                original_filename=filename,
                lat=lat,
                lng=lng
            )
            db.session.add(contract)
            
            version = CutAIContractVersion(
                contract_id=new_contract_id,
                version_number=1,
                data_sottoscrizione=dettagli.get('data_firma', ''),
                durata_mesi=parse_int(dettagli.get('durata_mesi'), 12),
                preavviso_giorni=parse_int(dettagli.get('preavviso_giorni'), 30),
                profilo_commerciale=commerciale.get('profilo_commerciale', 'Standard'),
                canone_base_trimestrale=parse_float(commerciale.get('canone_base_trimestrale'), 0.0),
                soglia_utenti_inclusi=parse_int(commerciale.get('soglia_utenti_inclusi'), 0),
                fee_utente_extra=parse_float(commerciale.get('fee_utente_extra'), 0.0),
                soglia_minima_servizio=parse_float(commerciale.get('soglia_minima_servizio'), 98.0),
                credito_uptime=parse_float(sla.get('credito_uptime'), 0.0),
                credito_ticketing=parse_float(sla.get('credito_ticketing'), 0.0),
                tetto_crediti=parse_float(sla.get('tetto_crediti'), 0.0),
                created_by=created_by
            )
            db.session.add(version)
            
        else:
            raise ValueError(f"Prodotto non riconosciuto o non supportato: {prodotto}")

        db.session.commit()
        return new_contract_id

    except Exception as e:
        db.session.rollback()
        raise e
    """
    Riceve il JSON estratto dall'AI (dopo l'approvazione umana) e lo salva nel database 
    generando il contratto radice e la Versione 1 (Audit-Ready).
    """
    try:
        prodotto = extracted_data.get('prodotto', '').lower()
        new_contract_id = str(uuid.uuid4())
        
        anagrafica = extracted_data.get('anagrafica', {})
        dettagli = extracted_data.get('dettagli_contratto', {})
        sla = extracted_data.get('sla', {})

        if "freader" in prodotto:
            commerciale = extracted_data.get('commerciale_freader', {})
            
            # 1. Crea Contratto Radice Freader
            contract = FreaderContract(
                id=new_contract_id,
                tenant_id=tenant_id,
                cliente_ragione_sociale=anagrafica.get('cliente_ragione_sociale', 'Sconosciuto'),
                cliente_sede_legale=anagrafica.get('cliente_sede_legale', 'Sconosciuta'),
                status='ACTIVE',
                original_filename=filename
            )
            db.session.add(contract)
            
            # 2. Crea Versione 1
            version = FreaderContractVersion(
                contract_id=new_contract_id,
                version_number=1,
                data_firma=dettagli.get('data_firma', ''),
                durata_mesi=parse_int(dettagli.get('durata_mesi'), 12),
                preavviso_giorni=parse_int(dettagli.get('preavviso_giorni'), 30),
                canone_trimestrale=parse_float(commerciale.get('canone_trimestrale'), 0.0),
                prezzo_fascia_1=parse_float(commerciale.get('prezzo_fascia_1'), 0.0),
                prezzo_fascia_2=parse_float(commerciale.get('prezzo_fascia_2'), 0.0),
                prezzo_fascia_3=parse_float(commerciale.get('prezzo_fascia_3'), 0.0),
                credito_uptime=parse_float(sla.get('credito_uptime'), 0.0),
                credito_ticketing=parse_float(sla.get('credito_ticketing'), 0.0),
                tetto_crediti=parse_float(sla.get('tetto_crediti'), 0.0),
                created_by=created_by
            )
            db.session.add(version)
            
        elif "cutai" in prodotto:
            commerciale = extracted_data.get('commerciale_cutai', {})
            
            # 1. Crea Contratto Radice CutAI
            contract = CutAIContract(
                id=new_contract_id,
                tenant_id=tenant_id,
                cliente_ragione_sociale=anagrafica.get('cliente_ragione_sociale', 'Sconosciuto'),
                cliente_sede_legale=anagrafica.get('cliente_sede_legale', 'Sconosciuta'),
                status='ACTIVE',
                original_filename=filename
            )
            db.session.add(contract)
            
            # 2. Crea Versione 1
            version = CutAIContractVersion(
                contract_id=new_contract_id,
                version_number=1,
                data_sottoscrizione=dettagli.get('data_firma', ''),
                durata_mesi=parse_int(dettagli.get('durata_mesi'), 12),
                preavviso_giorni=parse_int(dettagli.get('preavviso_giorni'), 30),
                profilo_commerciale=commerciale.get('profilo_commerciale', 'Standard'),
                canone_base_trimestrale=parse_float(commerciale.get('canone_base_trimestrale'), 0.0),
                soglia_utenti_inclusi=parse_int(commerciale.get('soglia_utenti_inclusi'), 0),
                fee_utente_extra=parse_float(commerciale.get('fee_utente_extra'), 0.0),
                soglia_minima_servizio=parse_float(commerciale.get('soglia_minima_servizio'), 98.0),
                credito_uptime=parse_float(sla.get('credito_uptime'), 0.0),
                credito_ticketing=parse_float(sla.get('credito_ticketing'), 0.0),
                tetto_crediti=parse_float(sla.get('tetto_crediti'), 0.0),
                created_by=created_by
            )
            db.session.add(version)
            
        else:
            raise ValueError(f"Prodotto non riconosciuto o non supportato: {prodotto}")

        # Commit della transazione
        db.session.commit()
        return new_contract_id

    except Exception as e:
        db.session.rollback()
        raise e