#!/usr/bin/env python
"""
Script per inizializzare le tabelle dei contratti dinamici nel database.
Esegui questo script per creare le nuove tabelle senza perdere i dati esistenti.
"""

import sys
import os

# Aggiungi il path corrente
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from flask import Flask
from extensions import db
from models import DynamicContract, DynamicContractVersion, Tenant

# Crea app Flask minima
app = Flask(__name__)

# Configura database
basedir = os.path.abspath(os.path.dirname(__file__))
INSTANCE_FOLDER = os.path.join(basedir, 'instance')
os.makedirs(INSTANCE_FOLDER, exist_ok=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(INSTANCE_FOLDER, 'contracts.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inizializza db
db.init_app(app)

with app.app_context():
    print("🔧 Inizializzazione tabelle contratti dinamici...")
    
    # Crea solo le nuove tabelle (non sovrascrive quelle esistenti)
    db.create_all()
    
    print("✅ Tabelle create con successo!")
    print("   - dynamic_contracts")
    print("   - dynamic_contract_versions")
    print("\n📊 Database pronto per gestire contratti dinamici!")
