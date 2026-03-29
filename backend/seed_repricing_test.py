"""
Seed: 4 contratti in scadenza entro 20gg per test re-pricing.
2 confidenza ALTA, 2 confidenza BASSA.
Revenue annuo = canone_trim * 4.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from extensions import db
from models import FreaderContract, FreaderContractVersion, CutAIContract, CutAIContractVersion
from datetime import datetime, timedelta
import uuid

TENANT_ID = 'tenant-test-123'

# Pulisco seed precedenti
with app.app_context():
    for Model in [FreaderContract, CutAIContract]:
        for c in Model.query.filter_by(tenant_id=TENANT_ID).all():
            if c.versions and any(v.created_by == 'seed_script' for v in c.versions):
                for v in c.versions:
                    db.session.delete(v)
                db.session.delete(c)
    db.session.commit()
    print("🗑️  Vecchi seed rimossi")

contracts = [
    # ── CONFIDENZA ALTA (~75): clausole aperte, preavviso lungo, basso rischio ──
    {
        'tipo': 'freader', 'cliente': 'Ciao', 'sede': 'Milano',
        'canone': 10000, 'durata_mesi': 24, 'preavviso': 90,
        'tetto_cred': 8, 'credito_uptime': 3, 'credito_ticketing': 3,
        'giorni_scadenza': 10, 'fasce': [12, 10, 9],
        # Revenue annuo: 10000 * 4 = €40.000
    },
    # ── CONFIDENZA ALTA (~72): CutAI, durata lunga, SLA favorevoli ──
    {
        'tipo': 'cutai', 'cliente': 'Guten Abend', 'sede': 'Napoli',
        'canone': 3000, 'durata_mesi': 36, 'preavviso': 60,
        'tetto_cred': 9, 'credito_uptime': 4, 'credito_ticketing': 4,
        'giorni_scadenza': 16,
        'profilo': 'Premium', 'utenti': 80, 'fee_extra': 25,
        # Revenue annuo: 3000 * 4 = €12.000
    },
    # ── CONFIDENZA BASSA (~18): clausole molto restrittive, preavviso corto ──
    {
        'tipo': 'freader', 'cliente': 'Bonjour', 'sede': 'Roma',
        'canone': 7000, 'durata_mesi': 6, 'preavviso': 15,
        'tetto_cred': 20, 'credito_uptime': 12, 'credito_ticketing': 9,
        'giorni_scadenza': 7, 'fasce': [15, 14, 13],
        # Revenue annuo: 7000 * 4 = €28.000
    },
    # ── CONFIDENZA BASSA (~22): CutAI, canone basso, SLA pesanti ──
    {
        'tipo': 'cutai', 'cliente': 'Buonasera', 'sede': 'Milano',
        'canone': 1500, 'durata_mesi': 6, 'preavviso': 15,
        'tetto_cred': 18, 'credito_uptime': 10, 'credito_ticketing': 8,
        'giorni_scadenza': 12,
        'profilo': 'Standard', 'utenti': 70, 'fee_extra': 20,
        # Revenue annuo: 1500 * 4 = €6.000
    },
]

with app.app_context():
    inserted = 0
    for c in contracts:
        today = datetime.now()
        scadenza = today + timedelta(days=c['giorni_scadenza'])
        data_firma = scadenza - timedelta(days=c['durata_mesi'] * 30)
        data_firma_str = data_firma.strftime('%d/%m/%Y')
        cid = str(uuid.uuid4())

        # Skip if already exists
        if c['tipo'] == 'freader':
            if FreaderContract.query.filter_by(tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente']).first():
                print(f"⏭️  {c['cliente']} già presente"); continue
            db.session.add(FreaderContract(id=cid, tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente'], cliente_sede_legale=c['sede'], status='ACTIVE'))
            db.session.add(FreaderContractVersion(
                contract_id=cid, version_number=1, data_firma=data_firma_str,
                durata_mesi=c['durata_mesi'], preavviso_giorni=c['preavviso'], canone_trimestrale=c['canone'],
                prezzo_fascia_1=c['fasce'][0], prezzo_fascia_2=c['fasce'][1], prezzo_fascia_3=c['fasce'][2],
                credito_uptime=c['credito_uptime'], credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'], created_by='seed_script'))
        else:
            if CutAIContract.query.filter_by(tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente']).first():
                print(f"⏭️  {c['cliente']} già presente"); continue
            db.session.add(CutAIContract(id=cid, tenant_id=TENANT_ID, cliente_ragione_sociale=c['cliente'], cliente_sede_legale=c['sede'], status='ACTIVE'))
            db.session.add(CutAIContractVersion(
                contract_id=cid, version_number=1, data_sottoscrizione=data_firma_str,
                durata_mesi=c['durata_mesi'], preavviso_giorni=c['preavviso'],
                profilo_commerciale=c['profilo'], canone_base_trimestrale=c['canone'],
                soglia_utenti_inclusi=c['utenti'], fee_utente_extra=c['fee_extra'], soglia_minima_servizio=98.0,
                credito_uptime=c['credito_uptime'], credito_ticketing=c['credito_ticketing'],
                tetto_crediti=c['tetto_cred'], created_by='seed_script'))

        rev = c['canone'] * 4
        inserted += 1
        print(f"✅ {c['cliente']} ({c['tipo']}) — {c['giorni_scadenza']}gg — rev annuo €{rev:,} — conf {'ALTA' if c['tetto_cred'] <= 10 else 'BASSA'}")

    db.session.commit()
    print(f"\n🎉 {inserted} contratti inseriti")
