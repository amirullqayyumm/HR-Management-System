
const express = require("express");
const cors = require("cors");

// ============================================
// EXISTING HRMS ROUTES
// ============================================

const departmentRoutes = require("./routes/departmentRoutes");
const positionRoutes = require("./routes/positionRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const leaveApplicationRoutes = require("./routes/leaveApplicationRoutes");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const managerDashboardRoutes = require("./routes/managerDashboardRoutes");
const myProfileRoutes = require("./routes/myProfileRoutes");
const organizationChartRoutes = require("./routes/organizationChartRoutes");

// ============================================
// AUTHENTICATION ROUTES
// ============================================

const authRoutes = require("./routes/authRoutes");

// ============================================
// SESSION CONFIGURATION
// ============================================

const sessionMiddleware = require("./config/session");

// ============================================
// INITIALIZE EXPRESS
// ============================================

const app = express();

// ============================================
// CORS CONFIGURATION
// ============================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ============================================
// REQUEST BODY PARSER
// ============================================

app.use(express.json());

// ============================================
// POSTGRESQL SESSION MIDDLEWARE
// ============================================

app.use(sessionMiddleware);

// ============================================
// AUTHENTICATION API
// ============================================

app.use("/api/auth", authRoutes);

// ============================================
// EXISTING HRMS API ROUTES
// ============================================

// Department Management
app.use("/api/departments", departmentRoutes);

// Position Management
app.use("/api/positions", positionRoutes);

// Employee Management
app.use("/api/employees", employeeRoutes);

// Leave Type Management
app.use("/api/leave-types", leaveTypeRoutes);

// Leave Application Management
app.use("/api/leave-applications", leaveApplicationRoutes);

// Leave Balance Management
app.use("/api/leave-balances", leaveBalanceRoutes);

// Attendance Management
app.use("/api/attendance", attendanceRoutes);

app.use("/api/manager-dashboard", managerDashboardRoutes);

app.use("/api/my-profile", myProfileRoutes);
app.use("/api/organization-chart", organizationChartRoutes);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "HRMS API is running",
  });
});

// ============================================
// EXPORT EXPRESS APPLICATION
// ============================================

module.exports = app;
