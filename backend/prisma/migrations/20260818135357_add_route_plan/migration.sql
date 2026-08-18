-- CreateTable
CREATE TABLE "RoutePlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startLocation" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "elevationGainM" INTEGER NOT NULL,
    "favorableWind" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoutePlan" ADD CONSTRAINT "RoutePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
