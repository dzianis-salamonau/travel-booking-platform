-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin');
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'reserved', 'confirmed', 'cancelled');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE "BoardType" AS ENUM ('room_only', 'bed_and_breakfast', 'half_board', 'full_board', 'all_inclusive');
CREATE TYPE "SyncJobType" AS ENUM ('daily_sync', 'availability_verify', 'cleanup_expired');
CREATE TYPE "SyncJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 3,
    "address" TEXT,
    "description" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TravelPackage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "departureAirport" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "boardType" "BoardType" NOT NULL DEFAULT 'all_inclusive',
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TravelPackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "customerId" TEXT,
    "bookingReference" TEXT NOT NULL,
    "providerReference" TEXT,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'pending',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "depositAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "guestFirstName" TEXT NOT NULL,
    "guestLastName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DepositRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepositRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncJobRun" (
    "id" TEXT NOT NULL,
    "providerId" TEXT,
    "jobType" "SyncJobType" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'pending',
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "SyncJobRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiSummaryCache" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiSummaryCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");
CREATE UNIQUE INDEX "Destination_providerId_externalId_key" ON "Destination"("providerId", "externalId");
CREATE INDEX "Destination_slug_idx" ON "Destination"("slug");
CREATE UNIQUE INDEX "Hotel_providerId_externalId_key" ON "Hotel"("providerId", "externalId");
CREATE INDEX "Hotel_destinationId_idx" ON "Hotel"("destinationId");
CREATE INDEX "Hotel_stars_idx" ON "Hotel"("stars");
CREATE UNIQUE INDEX "TravelPackage_providerId_externalId_key" ON "TravelPackage"("providerId", "externalId");
CREATE INDEX "TravelPackage_destinationId_idx" ON "TravelPackage"("destinationId");
CREATE INDEX "TravelPackage_departureDate_idx" ON "TravelPackage"("departureDate");
CREATE INDEX "TravelPackage_basePrice_idx" ON "TravelPackage"("basePrice");
CREATE INDEX "TravelPackage_availability_idx" ON "TravelPackage"("availability");
CREATE INDEX "TravelPackage_isArchived_idx" ON "TravelPackage"("isArchived");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX "Booking_bookingStatus_idx" ON "Booking"("bookingStatus");
CREATE INDEX "SyncJobRun_jobType_status_idx" ON "SyncJobRun"("jobType", "status");
CREATE INDEX "SyncJobRun_startedAt_idx" ON "SyncJobRun"("startedAt");
CREATE UNIQUE INDEX "AiSummaryCache_slug_key" ON "AiSummaryCache"("slug");

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelPackage" ADD CONSTRAINT "TravelPackage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelPackage" ADD CONSTRAINT "TravelPackage_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelPackage" ADD CONSTRAINT "TravelPackage_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TravelPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SyncJobRun" ADD CONSTRAINT "SyncJobRun_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
