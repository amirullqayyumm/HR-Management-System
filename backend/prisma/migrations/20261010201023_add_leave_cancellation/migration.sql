-- AlterTable
ALTER TABLE "LeaveApplication" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancellationRemarks" TEXT,
ADD COLUMN     "cancellationRequestedAt" TIMESTAMP(3),
ADD COLUMN     "cancellationReviewedAt" TIMESTAMP(3),
ADD COLUMN     "cancellationStatus" TEXT NOT NULL DEFAULT 'NONE';
