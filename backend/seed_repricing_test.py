"""
Seed script: inserisce 4 contratti in scadenza entro 20 giorni per testare il re-pricing.
2 con confidenza ALTA (clausole aperte) e 2 con confidenza BASSA (clausole restrittive).
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

# Prima pulisco i contratti seed precedenti
with app.app_context():
    for Model in [FreaderContract, CutAIContract]:
        old = Model.query.filter_by(tenant_id=TENANT_ID).all()
        for c in old:
            if c.versions:
                for v in c.versions:
                    if v.created_by == 'seed_script':
                        # Delete versions then contract
                        for vv in c.versions:
                            db.session.delete(vv)
                        db.session.delete(c)
                        break
    db.session.commit()
    print("🗑️  Vecchi seed rimossi")

contracts = [
    # ── CONFIDENZA ALTA: clausole aperte, cliente collaborativo ──
    {
        'tipo': 'freader',
        'cliente': 'Ciao',
        'sede': 'Milano',
        'canone': 10000,          # canone alto, sopra media
        'durata_mesi': 12,
        'preavviso': 60,          # preavviso lungo → stabile
        'tetto_cred': 8,          # basso → poca esposizione
        'credito_uptime': 3,      # basso → poche penali
        'credito_ticketing': 3,   # basso
        'giorni_scadenza': 10,
        'fasce': [12, 10, 9],
    },
    {
        'tipo': 'cutai',
        'cliente': 'Guten Abend',
        'sede': 'Napoli',
        'canone': 2000,
        'durata_mesi': 24,        # durata lunga → committed
        'preavviso': 90,          # preavviso molto lungo
        'tetto_cred': 9,          # basso
        'credito_uptime': 4,      # basso
        'credito_ticketing': 3,   # basso
        'giorni_scadenza': 16,
        'profilo': 'Standard',
        'utenti': 50,
        'fee_extra': 20,
    },
    # ── CONFIDENZA BASSA: clausole restrittive, cliente esigente ──
    {
        'tipo': 'freader',
        'cliente': 'Bonjour',
        'sede': 'Roma',
        'canone': 7000,
        'durata_mesi': 12,
        'preavviso': 15,          # preavviso cortissimo → rischio churn
        'tetto_cred': 18,         # molto alto → grande esposizione
        'credito_uptime': 10,     # alto → penali pesanti
        'credito_ticketing': 8,   # alto
        'giorni_scadenza': 7,
        'fasce': [15, 14, 13],
    },
    {
        'tipo': 'cutai',
        'cliente': 'Buonasera',
        'sede': 'Milano',
        'canone': 1000,           # canone basso, sotto media
        'durata_mesi': 6,         # durata corta → poco committed
        'preavviso': 15,          # preavviso corto
        'tetto_cred': 20,         # altissimo
        'credito_uptime': 12,     # molto alto
        'credito_ticketing': 8,   # alto
        'giorni_scadenza': 12,
        'profilo': 'Standard',
        'utenti': 70,
        'fee_extra': 20,
    },
]

with app.app_context():
    inserted = 0
    for c in contracts:
        today = datetime.now()
        scadenza = today + timedelta(days=c['giorni_scadenza'])
        data_firma = scadenza - timedelta(days=c['durata_mesi'] * 30)
        data_firma_str = data_firma.strftime('%d/%m/%Y')
        contract_id = str(uuid.uuid4())
        
        if c['tipo'] == 'freader':
            existing = FreaderContract.query.filter_by(
                tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente']
            ).first()
            if existing:
                print(f"⏭️  {c['cliente']} (Freader) già presente, skip")
                continue
            contract = FreaderContract(
                id=contract_id, tenant_id=TENANT_ID,
                cliente_ragione_sociale=c['cliente'], cliente_sede_legale=c['sede'], status='ACTIVE'
            )
            db.session.add(contract)
            db.session.add(FreaderContractVersion(
                contract_id=contract_id, version_number=1, data_firma=data_firma_str,
                durata_mesi=c['durata_mesi'], preavviso_giorni=c['preavviso'],
                canone_trimestrale=c['canone'],
                prezzo_fascia_1=c['fasce'][0], prezzo_fascia_2=c['fasce'][1], prezzo_fascia_3=c['fasce'][2],
                credito_uptime=c['credito_uptime'], credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'], created_by='seed_script'
            ))
        else:
            existing = CutAIContract.query.filter_by(
                tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente']
            ).first()
            if existing:
                print(f"⏭️  {c['cliente']} (CutAI) già presente, skip")
                continue
            contract = CutAIContract(
                id=contract_id, tenant_id=TENANT_ID,
                cliente_ragione_sociale=c['cliente'], cliente_sede_legale=c['sede'], status='ACTIVE'
            )
            db.session.add(contract)
            db.session.add(CutAIContractVersion(
                contract_id=contract_id, version_number=1, data_sottoscrizione=data_firma_str,
                durata_mesi=c['durata_mesi'], preavviso_giorni=c['preavviso'],
                profilo_commerciale=c.get('profilo', 'Standard'),
                canone_base_trimestrale=c['canone'], soglia_utenti_inclusi=c.get('utenti', 50),
                fee_utente_extra=c.get('fee_extra', 20), soglia_minima_servizio=98.0,
                credito_uptime=c['credito_uptime'], credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'], created_by='seed_script'
            ))
        
        conf_type = "ALTA" if c['tetto_cred'] <= 10 else "BASSA"
        inserted += 1
        print(f"✅ {c['cliente']} ({c['tipo']}) — scade tra {c['giorni_scadenza']}gg — confidenza {conf_type}")
    
    db.session.commit()
    print(f"\n🎉 {inserted} contratti inseriti per test re-pricing")
