import uuid
from extensions import db  # <-- Importa da qui
from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion

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

def save_contract_to_db(tenant_id, extracted_data, created_by="AI_Extraction_System"):
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
                status='ACTIVE'
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
                created_by=created_by,
                change_reason="Importazione automatica AI verificata da utente"
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
                status='ACTIVE'
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
                created_by=created_by,
                change_reason="Importazione automatica AI verificata da utente"
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