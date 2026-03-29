"""
Seed script: inserisce 5 contratti in scadenza entro 20 giorni per testare il re-pricing.
Eseguire con: python seed_repricing_test.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from extensions import db
from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
from datetime import datetime, timedelta
import uuid

TENANT_ID = 'tenant-test-123'

# 5 contratti che scadono tra 5-18 giorni da oggi
# Mix di Freader e CutAI, con diversi livelli di "apertura" nelle clausole
contracts = [
    {
        'tipo': 'freader',
        'cliente': 'Ciao',
        'sede': 'Milano',
        'canone': 10000,
        'durata_mesi': 12,
        'preavviso': 30,
        'tetto_cred': 10,
        'credito_uptime': 5,
        'credito_ticketing': 5,
        'giorni_scadenza': 8,
        'fasce': [12, 10, 9],
    },
    {
        'tipo': 'freader',
        'cliente': 'Bonjour',
        'sede': 'Roma',
        'canone': 7000,
        'durata_mesi': 12,
        'preavviso': 30,
        'tetto_cred': 15,
        'credito_uptime': 8,
        'credito_ticketing': 6,
        'giorni_scadenza': 12,
        'fasce': [15, 14, 13],
    },
    {
        'tipo': 'cutai',
        'cliente': 'Buonasera',
        'sede': 'Milano',
        'canone': 1000,
        'durata_mesi': 12,
        'preavviso': 30,
        'tetto_cred': 10,
        'credito_uptime': 5,
        'credito_ticketing': 5,
        'giorni_scadenza': 5,
        'profilo': 'Standard',
        'utenti': 70,
        'fee_extra': 20,
    },
    {
        'tipo': 'freader',
        'cliente': 'Hallo',
        'sede': 'Torino',
        'canone': 10000,
        'durata_mesi': 12,
        'preavviso': 60,
        'tetto_cred': 10,
        'credito_uptime': 10,
        'credito_ticketing': 5,
        'giorni_scadenza': 15,
        'fasce': [13, 11, 10],
    },
    {
        'tipo': 'cutai',
        'cliente': 'Guten Abend',
        'sede': 'Napoli',
        'canone': 2000,
        'durata_mesi': 12,
        'preavviso': 60,
        'tetto_cred': 9,
        'credito_uptime': 5,
        'credito_ticketing': 4,
        'giorni_scadenza': 18,
        'profilo': 'Standard',
        'utenti': 50,
        'fee_extra': 20,
    },
]

with app.app_context():
    inserted = 0
    for c in contracts:
        # Calculate data_firma so that it expires in c['giorni_scadenza'] days
        today = datetime.now()
        scadenza = today + timedelta(days=c['giorni_scadenza'])
        data_firma = scadenza - timedelta(days=c['durata_mesi'] * 30)
        data_firma_str = data_firma.strftime('%d/%m/%Y')
        
        contract_id = str(uuid.uuid4())
        
        if c['tipo'] == 'freader':
            # Check if already exists
            existing = FreaderContract.query.filter_by(
                tenant_id=TENANT_ID, 
                cliente_ragione_sociale=c['cliente']
            ).first()
            if existing:
                print(f"⏭️  {c['cliente']} (Freader) già presente, skip")
                continue
            
            contract = FreaderContract(
                id=contract_id, tenant_id=TENANT_ID,
                cliente_ragione_sociale=c['cliente'],
                cliente_sede_legale=c['sede'],
                status='ACTIVE'
            )
            db.session.add(contract)
            
            version = FreaderContractVersion(
                contract_id=contract_id, version_number=1,
                data_firma=data_firma_str,
                durata_mesi=c['durata_mesi'],
                preavviso_giorni=c['preavviso'],
                canone_trimestrale=c['canone'],
                prezzo_fascia_1=c['fasce'][0],
                prezzo_fascia_2=c['fasce'][1],
                prezzo_fascia_3=c['fasce'][2],
                credito_uptime=c['credito_uptime'],
                credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'],
                created_by='seed_script'
            )
            db.session.add(version)
            
        else:  # cutai
            existing = CutAIContract.query.filter_by(
                tenant_id=TENANT_ID,
                cliente_ragione_sociale=c['cliente']
            ).first()
            if existing:
                print(f"⏭️  {c['cliente']} (CutAI) già presente, skip")
                continue
            
            contract = CutAIContract(
                id=contract_id, tenant_id=TENANT_ID,
                cliente_ragione_sociale=c['cliente'],
                cliente_sede_legale=c['sede'],
                status='ACTIVE'
            )
            db.session.add(contract)
            
            version = CutAIContractVersion(
                contract_id=contract_id, version_number=1,
                data_sottoscrizione=data_firma_str,
                durata_mesi=c['durata_mesi'],
                preavviso_giorni=c['preavviso'],
                profilo_commerciale=c.get('profilo', 'Standard'),
                canone_base_trimestrale=c['canone'],
                soglia_utenti_inclusi=c.get('utenti', 50),
                fee_utente_extra=c.get('fee_extra', 20),
                soglia_minima_servizio=98.0,
                credito_uptime=c['credito_uptime'],
                credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'],
                created_by='seed_script'
            )
            db.session.add(version)
        
        inserted += 1
        print(f"✅ {c['cliente']} ({c['tipo']}) — scade tra {c['giorni_scadenza']}gg")
    
    db.session.commit()
    print(f"\n🎉 {inserted} contratti inseriti per test re-pricing")
