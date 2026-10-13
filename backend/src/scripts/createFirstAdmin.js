
require("dotenv").config();

const readline = require("node:readline");
const prisma = require("../prisma");
const { hashPassword } = require("../utils/password");

async function main() {
  const employee = await prisma.employee.findUnique({
    where: { employeeNo: "TEST001" },
  });

  if (!employee) {
    throw new Error("TEST001 employee not found.");
  }

  if (employee.id !== 8 || employee.status !== "ACTIVE") {
    throw new Error("TEST001 employee details do not match.");
  }

  const existingAccount = await prisma.user.findFirst({
    where: {
      OR: [
        { employeeId: employee.id },
        { email: employee.email },
      ],
    },
  });

  if (existingAccount) {
    throw new Error("A login account already exists.");
  }

  console.log("\nCreating HR Admin account for:");
  console.log("Employee:", employee.name);
  console.log("Employee No:", employee.employeeNo);
  console.log("Email:", employee.email);
  console.log("Role: HR_ADMIN");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const password = await new Promise((resolve) => {
    rl.question("\nEnter a new password (minimum 12 characters): ", resolve);
  });

  rl.close();

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: employee.email,
      passwordHash,
      role: "HR_ADMIN",
      employeeId: employee.id,
      isActive: true,
    },
  });

  console.log("\nHR Admin account created successfully!");
  console.log("User ID:", user.id);
  console.log("Email:", user.email);
  console.log("Role:", user.role);
}

main()
  .catch((error) => {
    console.error("\nError:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
