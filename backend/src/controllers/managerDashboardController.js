
const prisma = require("../prisma");

// GET - Manager Dashboard statistics
const getManagerDashboard = async (req, res) => {
  try {
    const managerEmployeeId = req.authUser.employeeId;

    // Calculate today's date in Malaysia
    const malaysiaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const today = new Date(`${malaysiaDate}T00:00:00.000Z`);

    // Count active employees reporting to this Manager
    const myTeamCount = await prisma.employee.count({
      where: {
        managerId: managerEmployeeId,
        status: "ACTIVE",
      },
    });

    // Count team members who clocked in today
    const teamPresentToday = await prisma.attendance.count({
      where: {
        date: today,
        employee: {
          managerId: managerEmployeeId,
          status: "ACTIVE",
        },
      },
    });

    // Count pending leave applications from direct reports
    const pendingLeaveApprovals = await prisma.leaveApplication.count({
      where: {
        status: "PENDING",
        employee: {
          managerId: managerEmployeeId,
        },
      },
    });

    return res.json({
      myTeam: myTeamCount,
      teamPresentToday: teamPresentToday,
      pendingLeaveApprovals: pendingLeaveApprovals,
    });
  } catch (error) {
    console.error("Manager dashboard error:", error);

    return res.status(500).json({
      message: "Failed to load Manager Dashboard",
    });
  }
};

module.exports = {
  getManagerDashboard,
};
