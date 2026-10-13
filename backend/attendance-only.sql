
-- HRMS Attendance Management
-- Creates only the Attendance table and its constraints.
-- Does not modify existing Employee, Leave, or session tables.

CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attendance_employeeId_date_key"
ON "Attendance"("employeeId", "date");

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_employeeId_fkey"
FOREIGN KEY ("employeeId")
REFERENCES "Employee"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
