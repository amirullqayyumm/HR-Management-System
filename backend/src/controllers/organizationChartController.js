
const prisma = require("../prisma");

const getOrganizationChart = async (req, res) => {
  try {
    
const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE"
    },
    select: {
  
        id: true,
        name: true,
        managerId: true,
        status: true,
        department: {
          select: {
            name: true,
          },
        },
        position: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json(employees);
  } catch (error) {
    console.error("Organization chart error:", error);

    return res.status(500).json({
      message: "Failed to load organization chart",
    });
  }
};

module.exports = {
  getOrganizationChart,
};
