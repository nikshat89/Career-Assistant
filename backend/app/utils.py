# MIT License • Copyright (c) 2026 Pathfinder

import os
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken

# Get the key from environment or generate a temporary one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # In a real app, this should be set in .env
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print("WARNING: ENCRYPTION_KEY not found in .env. Using a temporary key. Keys stored with this will be lost on restart.")

fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> Optional[str]:
    """
    Safely decrypt data. Returns None if decryption fails (e.g. key mismatch).
    """
    if not encrypted_data:
        return None
    try:
        return fernet.decrypt(encrypted_data.encode()).decode()
    except (InvalidToken, Exception) as e:
        print(f"Decryption failed: {e}. The ENCRYPTION_KEY might have changed.")
        return None
