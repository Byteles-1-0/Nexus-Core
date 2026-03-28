# backend/models.py
from datetime import datetime, timezone
from extensions import db  # <-- Importa db da qui!

class Tenant(db.Model):
    __tablename__ = 'tenants'
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# ==========================================
# PRODOTTO 1: FREADER
# ==========================================

class FreaderContract(db.Model):
    __tablename__ = 'freader_contracts'
    id = db.Column(db.String(36), primary_key=True)
    tenant_id = db.Column(db.String(36), db.ForeignKey('tenants.id'), nullable=False)
    cliente_ragione_sociale = db.Column(db.String(255), nullable=False)
    cliente_sede_legale = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='DRAFT')
    
    versions = db.relationship('FreaderContractVersion', backref='contract', lazy=True, order_by='desc(FreaderContractVersion.version_number)')

class FreaderContractVersion(db.Model):
    __tablename__ = 'freader_contract_versions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    contract_id = db.Column(db.String(36), db.ForeignKey('freader_contracts.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    
    # Dati Specifici Freader dal CSV
    data_firma = db.Column(db.String(20), nullable=False) # gg/mm/aaaa
    durata_mesi = db.Column(db.Integer, nullable=False)
    preavviso_giorni = db.Column(db.Integer, nullable=False)
    
    canone_trimestrale = db.Column(db.Float, nullable=False)
    prezzo_fascia_1 = db.Column(db.Float, nullable=False) # 1.001 a 10.000 (centesimi)
    prezzo_fascia_2 = db.Column(db.Float, nullable=False) # 10.001 a 50.000 (centesimi)
    prezzo_fascia_3 = db.Column(db.Float, nullable=False) # Oltre 50.000 (centesimi)
    
    # SLA
    credito_uptime = db.Column(db.Float, nullable=False) # % per uptime < 98.0%
    credito_ticketing = db.Column(db.Float, nullable=False) # % per mancato SLA ticket
    tetto_crediti = db.Column(db.Float, nullable=False) # Max crediti trimestrale
    
    # Audit
    valid_from = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.String(100), nullable=False)

# ==========================================
# PRODOTTO 2: CUTAI
# ==========================================

class CutAIContract(db.Model):
    __tablename__ = 'cutai_contracts'
    id = db.Column(db.String(36), primary_key=True)
    tenant_id = db.Column(db.String(36), db.ForeignKey('tenants.id'), nullable=False)
    cliente_ragione_sociale = db.Column(db.String(255), nullable=False)
    cliente_sede_legale = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='DRAFT')
    
    versions = db.relationship('CutAIContractVersion', backref='contract', lazy=True, order_by='desc(CutAIContractVersion.version_number)')

class CutAIContractVersion(db.Model):
    __tablename__ = 'cutai_contract_versions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    contract_id = db.Column(db.String(36), db.ForeignKey('cutai_contracts.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    
    # Dati Specifici CutAI dal CSV
    data_sottoscrizione = db.Column(db.String(20), nullable=False) # gg/mm/aaaa
    durata_mesi = db.Column(db.Integer, nullable=False)
    preavviso_giorni = db.Column(db.Integer, nullable=False)
    
    profilo_commerciale = db.Column(db.String(20), nullable=False) # Standard / Premium
    canone_base_trimestrale = db.Column(db.Float, nullable=False)
    soglia_utenti_inclusi = db.Column(db.Integer, nullable=False)
    fee_utente_extra = db.Column(db.Float, nullable=False)
    
    # SLA
    soglia_minima_servizio = db.Column(db.Float, nullable=False) # Tipicamente 98 o 99%
    credito_uptime = db.Column(db.Float, nullable=False) # %
    credito_ticketing = db.Column(db.Float, nullable=False) # %
    tetto_crediti = db.Column(db.Float, nullable=False) # %
    
    # Audit
    valid_from = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.String(100), nullable=False)

# ==========================================
# CONTRATTI DINAMICI (Schema-Agnostic)
# ==========================================

class DynamicContract(db.Model):
    __tablename__ = 'dynamic_contracts'
    id = db.Column(db.String(36), primary_key=True)
    tenant_id = db.Column(db.String(36), db.ForeignKey('tenants.id'), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)  # Nome prodotto rilevato dall'AI
    cliente_ragione_sociale = db.Column(db.String(255), nullable=False)
    cliente_sede_legale = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='DRAFT')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    versions = db.relationship('DynamicContractVersion', backref='contract', lazy=True, order_by='desc(DynamicContractVersion.version_number)')

class DynamicContractVersion(db.Model):
    __tablename__ = 'dynamic_contract_versions'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    contract_id = db.Column(db.String(36), db.ForeignKey('dynamic_contracts.id'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    
    # Dati estratti in formato JSON flessibile
    extracted_data = db.Column(db.JSON, nullable=False)  # Contiene tutte le coppie chiave-valore estratte dall'AI
    
    # Metadati dell'analisi
    document_type = db.Column(db.String(100))  # Tipo di documento identificato
    confidence_score = db.Column(db.Float)  # Score di confidenza dell'AI
    
    # Audit
    valid_from = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.String(100), nullable=False)