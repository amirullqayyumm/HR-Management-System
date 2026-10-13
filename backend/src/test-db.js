const prisma = require('./prisma');

async function testDatabase() {
    try {
        const departments = await prisma.department.findMany();

        console.log("Departments from database:");
        console.log(departments);
    }
    catch (error) {
        console.error("Database error:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}

testDatabase();