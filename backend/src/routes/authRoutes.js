
const express = require("express");
const crypto = require("node:crypto");

const prisma = require("../prisma");
const { verifyPassword } = require("../utils/password");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    employeeName: user.employee.name,
  };
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Limit unexpectedly large input.
    if (
      normalizedEmail.length > 254 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { employee: true },
    });

    // Use the same message for invalid credentials.
    if (
      !user ||
      !user.isActive ||
      user.employee.status !== "ACTIVE"
    ) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordValid = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Regenerate the session ID after successful login.
    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError);

        return res.status(500).json({
          message: "Unable to start login session.",
        });
      }

      req.session.userId = user.id;
      req.session.employeeId = user.employeeId;
      req.session.role = user.role;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);

          return res.status(500).json({
            message: "Unable to save login session.",
          });
        }

        return res.json({
          message: "Login successful.",
          user: publicUser(user),
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      include: { employee: true },
    });

    if (
      !user ||
      !user.isActive ||
      user.employee.status !== "ACTIVE"
    ) {
      return res.status(401).json({
        message: "Not authenticated.",
      });
    }

    return res.json({
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Session check error:", error);

    return res.status(500).json({
      message: "Unable to check login session.",
    });
  }
});



 // POST /api/auth/logout
 router.post("/logout", (req, res) => {
    if (!req.session) {
      return res.status(200).json({
        message: "Logged out successfully.",
      });
    }
  
    req.session.destroy((error) => {
      if (error) {
        console.error("Logout error:", error);
  
        return res.status(500).json({
          message: "Unable to log out. Please try again.",
        });
      }
  
      res.clearCookie("hrms.sid");
  
      return res.json({
        message: "Logged out successfully.",
      });
    });
  });
  
module.exports = router;
