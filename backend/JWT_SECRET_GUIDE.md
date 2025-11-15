# 🔐 How to Change JWT Secret

## Quick Steps

1. **Open the `.env` file:**
   ```bash
   cd backend
   nano .env
   # or
   code .env
   ```

2. **Find the JWT_SECRET line and change it:**
   ```env
   JWT_SECRET=your_new_super_secret_key_here_make_it_long_and_random
   ```

3. **Generate a Strong Secret (Recommended):**
   
   **Option A: Using Node.js**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   
   **Option B: Using OpenSSL**
   ```bash
   openssl rand -hex 64
   ```

4. **Restart the server:**
   ```bash
   # Stop the current server (Ctrl+C)
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

- **Never commit `.env` to git** (it's in `.gitignore`)
- **Use different secrets for development and production**
- **Minimum 32 characters recommended**
- **Use random, unpredictable strings**
- **If you change the secret, all existing JWT tokens will become invalid**

## Production Best Practices

1. Use environment variables from your hosting platform
2. Rotate secrets periodically
3. Never share secrets in code or documentation
4. Use secrets management services (AWS Secrets Manager, HashiCorp Vault, etc.)

