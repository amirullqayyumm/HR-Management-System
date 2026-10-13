
const prisma = require("../prisma");

// GET - Retrieve the logged-in employee's own profile
const getMyProfile = async (req, res) => {
  try {
    // Get employee ID securely from the login session
    const employeeId = req.authUser.employeeId;

    const employee = await prisma.employee.findUnique({
      where: {
        id: employeeId,
      },

      select: {
        id: true,
        employeeNo: true,
        name: true,
        email: true,
        joinDate: true,
        status: true,

        department: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },

        position: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },

        manager: {
          select: {
            id: true,
            employeeNo: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found.",
      });
    }

    return res.json(employee);
  } catch (error) {
    console.error("Get My Profile error:", error);

    return res.status(500).json({
      message: "Failed to retrieve employee profile.",
    });
  }
};

module.exports = {
  getMyProfile,
};
