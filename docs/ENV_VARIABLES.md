# Environment Variables Reference

Copy this reference to create your own `.env` file. **Never commit `.env` to version control.**

```bash
# ============================================================
# DATABASE
# ============================================================
# MySQL 8 or TiDB connection string
DATABASE_URL=mysql://root:password@localhost:3306/restaurant_db

# ============================================================
# AUTHENTICATION
# ============================================================
# Secret used to sign JWT session cookies (min 32 chars)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-random-secret-here-min-32-chars

# Manus OAuth (if using Manus platform auth)
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Owner info (used for push notifications)
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Restaurant Owner Name

# ============================================================
# AI / LLM (for AI order parsing feature)
# ============================================================
# OpenAI-compatible API endpoint and key
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
BUILT_IN_FORGE_API_KEY=sk-your-openai-key-here

# Frontend LLM access
VITE_FRONTEND_FORGE_API_URL=https://api.openai.com/v1
VITE_FRONTEND_FORGE_API_KEY=sk-your-frontend-key-here

# ============================================================
# FILE STORAGE (S3)
# ============================================================
# AWS S3 or any S3-compatible storage (MinIO, Cloudflare R2, etc.)
S3_BUCKET=your-bucket-name
S3_REGION=eu-west-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
# Optional: custom endpoint for non-AWS S3 (MinIO, Cloudflare R2, etc.)
# S3_ENDPOINT=https://your-minio-server.com

# ============================================================
# PUBLIC API (WhatsApp / external integrations)
# ============================================================
# Secret token for the public REST API (/api/public/*)
# The WhatsApp bot must send: Authorization: Bearer <value>
RESERVATIONS_API_KEY=your-whatsapp-api-secret-here

# ============================================================
# ANALYTICS (optional)
# ============================================================
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com/api/send
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```
