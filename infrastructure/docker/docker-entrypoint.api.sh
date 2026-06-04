#!/bin/sh
set -e

cd /app/apps/backend

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Checking if seed is needed..."
PROVIDER_COUNT=$(node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.provider.count().then((count) => { console.log(count); return prisma.\$disconnect(); }).catch((err) => { console.error(err); process.exit(1); });")

if [ "$PROVIDER_COUNT" = "0" ]; then
  echo "==> Seeding database..."
  npx prisma db seed
else
  echo "==> Database already seeded ($PROVIDER_COUNT providers), skipping."
fi

echo "==> Starting API..."
exec node dist/main.js
