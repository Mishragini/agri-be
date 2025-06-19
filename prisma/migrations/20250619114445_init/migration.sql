-- CreateEnum
CREATE TYPE "Role" AS ENUM ('lender', 'borrower');

-- CreateTable
CREATE TABLE "agri_user" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "email_verified" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" NOT NULL,
    "password" VARCHAR(255),
    "image" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agri_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agri_account" (
    "user_id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" VARCHAR(255),
    "scope" VARCHAR(255),
    "id_token" TEXT,
    "session_state" VARCHAR(255),

    CONSTRAINT "agri_account_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "agri_product" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "created_by" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "image" VARCHAR(255)[],
    "address" VARCHAR(255) NOT NULL,

    CONSTRAINT "agri_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agri_booking" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "product_id" VARCHAR(255) NOT NULL,
    "booking_query" VARCHAR(255),
    "from" TIMESTAMPTZ NOT NULL,
    "to" TIMESTAMPTZ NOT NULL,
    "contact_number" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agri_booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agri_session" (
    "session_token" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agri_session_pkey" PRIMARY KEY ("session_token")
);

-- CreateTable
CREATE TABLE "agri_verification_token" (
    "identifier" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "agri_verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "agri_user_email_key" ON "agri_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agri_user_phone_number_key" ON "agri_user"("phone_number");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "agri_account"("user_id");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "agri_session"("user_id");

-- AddForeignKey
ALTER TABLE "agri_account" ADD CONSTRAINT "agri_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "agri_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_product" ADD CONSTRAINT "agri_product_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "agri_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_booking" ADD CONSTRAINT "agri_booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "agri_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_booking" ADD CONSTRAINT "agri_booking_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "agri_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_session" ADD CONSTRAINT "agri_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "agri_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
