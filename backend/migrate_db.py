#!/usr/bin/env python3
"""
Database Migration Script
Adds new fields to existing tables:
- original_filename to FreaderContract and CutAIContract
- change_reason to FreaderContractVersion and CutAIContractVersion
- lat, lng to FreaderContract and CutAIContract (for map visualization)
"""

import sys
import os

# Add backend directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import app, db
from sqlalchemy import text

def migrate():
    with app.app_context():
        print("🔄 Starting database migration...")
        
        try:
            # Check if columns already exist
            with db.engine.connect() as conn:
                # Add original_filename to freader_contracts
                try:
                    conn.execute(text("ALTER TABLE freader_contracts ADD COLUMN original_filename VARCHAR(255)"))
                    conn.commit()
                    print("✅ Added original_filename to freader_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  original_filename already exists in freader_contracts")
                    else:
                        print(f"⚠️  Error adding original_filename to freader_contracts: {e}")
                
                # Add original_filename to cutai_contracts
                try:
                    conn.execute(text("ALTER TABLE cutai_contracts ADD COLUMN original_filename VARCHAR(255)"))
                    conn.commit()
                    print("✅ Added original_filename to cutai_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  original_filename already exists in cutai_contracts")
                    else:
                        print(f"⚠️  Error adding original_filename to cutai_contracts: {e}")
                
                # Add change_reason to freader_contract_versions
                try:
                    conn.execute(text("ALTER TABLE freader_contract_versions ADD COLUMN change_reason VARCHAR(255)"))
                    conn.commit()
                    print("✅ Added change_reason to freader_contract_versions")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  change_reason already exists in freader_contract_versions")
                    else:
                        print(f"⚠️  Error adding change_reason to freader_contract_versions: {e}")
                
                # Add change_reason to cutai_contract_versions
                try:
                    conn.execute(text("ALTER TABLE cutai_contract_versions ADD COLUMN change_reason VARCHAR(255)"))
                    conn.commit()
                    print("✅ Added change_reason to cutai_contract_versions")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  change_reason already exists in cutai_contract_versions")
                    else:
                        print(f"⚠️  Error adding change_reason to cutai_contract_versions: {e}")
                
                # Add lat to freader_contracts
                try:
                    conn.execute(text("ALTER TABLE freader_contracts ADD COLUMN lat FLOAT"))
                    conn.commit()
                    print("✅ Added lat to freader_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  lat already exists in freader_contracts")
                    else:
                        print(f"⚠️  Error adding lat to freader_contracts: {e}")
                
                # Add lng to freader_contracts
                try:
                    conn.execute(text("ALTER TABLE freader_contracts ADD COLUMN lng FLOAT"))
                    conn.commit()
                    print("✅ Added lng to freader_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  lng already exists in freader_contracts")
                    else:
                        print(f"⚠️  Error adding lng to freader_contracts: {e}")
                
                # Add lat to cutai_contracts
                try:
                    conn.execute(text("ALTER TABLE cutai_contracts ADD COLUMN lat FLOAT"))
                    conn.commit()
                    print("✅ Added lat to cutai_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  lat already exists in cutai_contracts")
                    else:
                        print(f"⚠️  Error adding lat to cutai_contracts: {e}")
                
                # Add lng to cutai_contracts
                try:
                    conn.execute(text("ALTER TABLE cutai_contracts ADD COLUMN lng FLOAT"))
                    conn.commit()
                    print("✅ Added lng to cutai_contracts")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                        print("ℹ️  lng already exists in cutai_contracts")
                    else:
                        print(f"⚠️  Error adding lng to cutai_contracts: {e}")
            
            print("\n✨ Migration completed successfully!")
            print("\nℹ️  Note: If you prefer a fresh start, you can delete backend/instance/contracts.db")
            print("   and run 'python app.py' to recreate the database with the new schema.")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            sys.exit(1)

if __name__ == '__main__':
    migrate()
