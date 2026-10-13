
const prisma = require("../prisma");

// ============================================
// VALIDATION HELPERS
// ============================================

const isValidText = (value) => {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
};

const isValidId = (value) => {
    const id = Number(value);

    return (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== "" &&
        Number.isSafeInteger(id) &&
        id > 0
    );
};

// ============================================
// READ - GET ALL POSITIONS
// ============================================

const getPositions = async (req, res) => {
    try {
        const positions = await prisma.position.findMany({
            include: {
                department: true
            }
        });

        return res.json(positions);

    } catch (error) {
        console.error("Get positions error:", error);

        return res.status(500).json({
            message: "Failed to get positions"
        });
    }
};

// ============================================
// CREATE POSITION
// ============================================

const createPosition = async (req, res) => {
    try {
        const { code, name, departmentId } = req.body || {};

        if (
            !isValidText(code) ||
            !isValidText(name) ||
            !isValidId(departmentId)
        ) {
            return res.status(400).json({
                message:
                    "Valid position code, name and department ID are required."
            });
        }

        const id = Number(departmentId);

        const department = await prisma.department.findUnique({
            where: { id }
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        const position = await prisma.position.create({
            data: {
                code: code.trim(),
                name: name.trim(),
                departmentId: id
            }
        });

        return res.status(201).json(position);

    } catch (error) {
        console.error("Create position error:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Position already exists or contains a duplicate value."
            });
        }

        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Invalid department reference."
            });
        }

        return res.status(500).json({
            message: "Failed to create position"
        });
    }
};

// ============================================
// UPDATE POSITION
// ============================================

const updatePosition = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid position ID"
            });
        }

        const id = Number(req.params.id);
        const { code, name, departmentId } = req.body || {};

        if (
            !isValidText(code) ||
            !isValidText(name) ||
            !isValidId(departmentId)
        ) {
            return res.status(400).json({
                message:
                    "Valid position code, name and department ID are required."
            });
        }

        const departmentIdNumber = Number(departmentId);

        const department = await prisma.department.findUnique({
            where: { id: departmentIdNumber }
        });

        if (!department) {
            return res.status(404).json({
                message: "Department not found"
            });
        }

        const position = await prisma.position.update({
            where: { id },
            data: {
                code: code.trim(),
                name: name.trim(),
                departmentId: departmentIdNumber
            },
            include: {
                department: true
            }
        });

        return res.json(position);

    } catch (error) {
        console.error("Update position error:", error);

        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Position not found"
            });
        }

        if (error.code === "P2002") {
            return res.status(409).json({
                message: "Position already exists or contains a duplicate value."
            });
        }

        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Invalid department reference."
            });
        }

        return res.status(500).json({
            message: "Failed to update position"
        });
    }
};

// ============================================
// DELETE POSITION
// ============================================

const deletePosition = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid position ID"
            });
        }

        const id = Number(req.params.id);

        const position = await prisma.position.findUnique({
            where: { id }
        });

        if (!position) {
            return res.status(404).json({
                message: "Position not found"
            });
        }

        const employeeCount = await prisma.employee.count({
            where: { positionId: id }
        });

        if (employeeCount > 0) {
            return res.status(409).json({
                message:
                    `Cannot delete ${position.name}. ` +
                    `${employeeCount} employee(s) are assigned to this position.`
            });
        }

        await prisma.position.delete({
            where: { id }
        });

        return res.json({
            message: "Position deleted successfully"
        });

    } catch (error) {
        console.error("Delete position error:", error);

        if (error.code === "P2003") {
            return res.status(409).json({
                message:
                    "Cannot delete position because related records exist."
            });
        }

        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Position not found"
            });
        }

        return res.status(500).json({
            message: "Failed to delete position"
        });
    }
};

module.exports = {
    getPositions,
    createPosition,
    updatePosition,
    deletePosition
};
