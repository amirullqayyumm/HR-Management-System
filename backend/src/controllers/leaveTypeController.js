
const prisma = require("../prisma");

// GET - Retrieve all leave types
const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: {
        name: "asc"
      }
    });

    res.json(leaveTypes);

  } catch (error) {
    console.error("Get leave types error:", error);

    res.status(500).json({
      message: "Failed to retrieve leave types"
    });
  }
};

// POST - Create a new leave type
const createLeaveType = async (req, res) => {
  try {
    const { code, name, defaultDays } = req.body;

    // Validate required fields
    if (
      typeof code !== "string" ||
      !code.trim() ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        message: "Leave code and name are required"
      });
    }

    const days = Number(defaultDays);

    if (
      defaultDays === undefined ||
      defaultDays === null ||
      defaultDays === "" ||
      !Number.isInteger(days) ||
      days < 0
    ) {
      return res.status(400).json({
        message: "Default days must be a non-negative whole number"
      });
    }

    const leaveType = await prisma.leaveType.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        defaultDays: days
      }
    });

    res.status(201).json(leaveType);

  } catch (error) {
    console.error("Create leave type error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Leave type code already exists"
      });
    }

    res.status(500).json({
      message: "Failed to create leave type"
    });
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType
};
