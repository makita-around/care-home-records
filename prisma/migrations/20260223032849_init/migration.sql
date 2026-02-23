-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameKana" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Resident" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "nameKana" TEXT NOT NULL DEFAULT '',
    "roomNumber" TEXT NOT NULL,
    "floor" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "moveInDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "careLevel" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "staffId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notice_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealChange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "changeDate" DATETIME NOT NULL,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "dinner" BOOLEAN NOT NULL DEFAULT false,
    "changeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealChange_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MealChange_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VitalRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "pulse" INTEGER,
    "temperature" REAL,
    "spo2" INTEGER,
    "comment" TEXT NOT NULL DEFAULT '',
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VitalRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VitalRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,
    "mainDish" INTEGER,
    "sideDish" INTEGER,
    "comment" TEXT NOT NULL DEFAULT '',
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MealRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "beforeBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "afterBreakfast" BOOLEAN NOT NULL DEFAULT true,
    "beforeLunch" BOOLEAN NOT NULL DEFAULT false,
    "afterLunch" BOOLEAN NOT NULL DEFAULT true,
    "beforeDinner" BOOLEAN NOT NULL DEFAULT false,
    "afterDinner" BOOLEAN NOT NULL DEFAULT true,
    "bedtime" BOOLEAN NOT NULL DEFAULT false,
    "eyeDrop" BOOLEAN NOT NULL DEFAULT false,
    "eyeDropTimes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MedicationConfig_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "beforeBreakfast" BOOLEAN,
    "afterBreakfast" BOOLEAN,
    "beforeLunch" BOOLEAN,
    "afterLunch" BOOLEAN,
    "beforeDinner" BOOLEAN,
    "afterDinner" BOOLEAN,
    "bedtime" BOOLEAN,
    "eyeDrop" BOOLEAN,
    "comment" TEXT NOT NULL DEFAULT '',
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MedicationRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NightPatrolRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "patrolTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NightPatrolRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NightPatrolRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentRecord_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CommentRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentSheet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "emergencyContact" TEXT NOT NULL DEFAULT '',
    "relationship" TEXT NOT NULL DEFAULT '',
    "emergencyPhone" TEXT NOT NULL DEFAULT '',
    "insuranceNumber" TEXT NOT NULL DEFAULT '',
    "insurer" TEXT NOT NULL DEFAULT '',
    "insuranceExpiry" DATETIME,
    "certPeriodStart" DATETIME,
    "certPeriodEnd" DATETIME,
    "primaryDoctor" TEXT NOT NULL DEFAULT '',
    "hospital" TEXT NOT NULL DEFAULT '',
    "consciousness" TEXT NOT NULL DEFAULT '',
    "vision" TEXT NOT NULL DEFAULT '',
    "hearing" TEXT NOT NULL DEFAULT '',
    "height" REAL,
    "weight" REAL,
    "bedsore" BOOLEAN NOT NULL DEFAULT false,
    "tubeFeed" BOOLEAN NOT NULL DEFAULT false,
    "catheter" BOOLEAN NOT NULL DEFAULT false,
    "insulin" BOOLEAN NOT NULL DEFAULT false,
    "dialysis" BOOLEAN NOT NULL DEFAULT false,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "familyStructure" TEXT NOT NULL DEFAULT '',
    "livingArrangement" TEXT NOT NULL DEFAULT '',
    "hometown" TEXT NOT NULL DEFAULT '',
    "education" TEXT NOT NULL DEFAULT '',
    "workHistory" TEXT NOT NULL DEFAULT '',
    "familyRequests" TEXT NOT NULL DEFAULT '',
    "specialNotes" TEXT NOT NULL DEFAULT '',
    "adlData" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssessmentSheet_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccidentReport" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "residentId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "accidentAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "accidentType" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "injury" TEXT NOT NULL DEFAULT '',
    "injuryParts" TEXT NOT NULL DEFAULT '',
    "response" TEXT NOT NULL DEFAULT '',
    "afterStatus" TEXT NOT NULL DEFAULT '',
    "familyReport" BOOLEAN NOT NULL DEFAULT false,
    "causeAnalysis" TEXT NOT NULL DEFAULT '',
    "prevention" TEXT NOT NULL DEFAULT '',
    "staffSignatures" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccidentReport_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AccidentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicationConfig_residentId_key" ON "MedicationConfig"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSheet_residentId_key" ON "AssessmentSheet"("residentId");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
