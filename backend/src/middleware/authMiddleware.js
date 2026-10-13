
const prisma = require("../prisma");

// Verify the user is logged in and still active
async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.session.userId,
      },
      include: {
        employee: true,
      },
    });

    if (
      !user ||
      !user.isActive ||
      !user.employee ||
      user.employee.status !== "ACTIVE"
    ) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    // Use the current database role, not a potentially
    // outdated role stored in the session.
    req.authUser = {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      message: "Unable to verify authentication.",
    });
  }
}

// Restrict access to specific roles
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
