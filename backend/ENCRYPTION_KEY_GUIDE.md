# 🔐 Encryption Key Setup Guide

## Why This Matters

Your biometric data (face embeddings and fingerprint templates) are encrypted using **AES-256-CBC** encryption. To ensure data can be decrypted later, you **MUST** set a consistent encryption key.

## ⚠️ CRITICAL: Set Your Encryption Key

1. **Open or create `.env` file in the `backend` folder:**
   ```bash
   cd backend
   nano .env
   # or
   code .env
   ```

2. **Add this line (generate a secure 64-character hex key):**
   ```env
   ENCRYPTION_KEY=your_64_character_hex_key_here_must_be_exactly_64_chars
   ```

3. **Generate a secure key:**
   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Or using OpenSSL
   openssl rand -hex 32
   ```

4. **Example `.env` file:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=voting_system
   JWT_SECRET=your_jwt_secret_here
   ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
   ```

## 🔒 Security Best Practices

- **Never commit `.env` to git** (it's in `.gitignore`)
- **Use different keys for development and production**
- **Store production keys securely** (use a secrets manager)
- **Rotate keys periodically** (requires re-encrypting all data)

## 🚨 If You Don't Set This

If `ENCRYPTION_KEY` is not set, the system will use a default key. **This is insecure and should only be used for development/testing.**

## ✅ Verification

After setting the key, restart your backend server:
```bash
cd backend
npm start
```

The system will now use your encryption key for all biometric data.

