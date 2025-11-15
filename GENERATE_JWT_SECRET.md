# 🔐 How to Generate JWT Secret

## Quick Method (Recommended)

Run this command in your terminal:

```bash
cd backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This will output a 128-character random hex string. Copy it and use it as your JWT_SECRET.

## Alternative Methods

### Method 1: Using OpenSSL
```bash
openssl rand -hex 64
```

### Method 2: Using Node.js directly
```bash
node
> require('crypto').randomBytes(64).toString('hex')
```

### Method 3: Online Generator
Visit: https://randomkeygen.com/ (use the "CodeIgniter Encryption Keys" section)

## Steps to Update JWT Secret

1. **Generate a new secret** using one of the methods above

2. **Open the `.env` file:**
   ```bash
   cd backend
   nano .env
   # or use your preferred editor
   code .env
   ```

3. **Update the JWT_SECRET line:**
   ```env
   JWT_SECRET=your_generated_secret_here
   ```

4. **Save the file**

5. **Restart your backend server:**
   ```bash
   # Stop the current server (Ctrl+C if running)
   npm start
   ```

## Example

**Before:**
```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**After:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

## ⚠️ Important Notes

- **Never commit `.env` to git** (it's already in `.gitignore`)
- **Use different secrets for development and production**
- **Minimum 32 characters recommended** (64+ bytes = 128+ hex chars is ideal)
- **If you change the secret, all existing JWT tokens will become invalid**
- **Keep your secret secure** - don't share it publicly

## Production Best Practices

1. Use environment variables from your hosting platform (Heroku, AWS, etc.)
2. Rotate secrets periodically (every 90 days recommended)
3. Never share secrets in code, documentation, or chat
4. Use secrets management services:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Cloud Secret Manager

