
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function EmployeeDashboard({ user }) {
  const [attendance, setAttendance] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Use Malaysia's date and year.
  const malaysiaToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const currentYear = Number(malaysiaToday.slice(0, 4));

  useEffect(() => {
    const loadEmployeeDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [attendanceRes, balancesRes, applicationsRes] =
          await Promise.all([
            fetch(`${API_URL}/attendance/my`, {
              credentials: "include",
            }),
            fetch(`${API_URL}/leave-balances`, {
              credentials: "include",
            }),
            fetch(`${API_URL}/leave-applications`, {
              credentials: "include",
            }),
          ]);

        if (
          !attendanceRes.ok ||
          !balancesRes.ok ||
          !applicationsRes.ok
        ) {
          throw new Error(
            "Unable to load Employee Dashboard information."
          );
        }

        const [
          attendanceData,
          balanceData,
          applicationData,
        ] = await Promise.all([
          attendanceRes.json(),
          balancesRes.json(),
          applicationsRes.json(),
        ]);

        const employeeId = Number(user?.employeeId);

        setAttendance(
          Array.isArray(attendanceData)
            ? attendanceData.filter(
                (record) =>
                  Number(record.employeeId) === employeeId
              )
            : []
        );

        setLeaveBalances(
          Array.isArray(balanceData)
            ? balanceData.filter(
                (balance) =>
                  Number(balance.employeeId) === employeeId &&
                  Number(balance.year) === currentYear
              )
            : []
        );

        setApplications(
          Array.isArray(applicationData)
            ? applicationData.filter(
                (application) =>
                  Number(application.employeeId) === employeeId
              )
            : []
        );
      } catch (err) {
        console.error("Employee Dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.employeeId) {
      loadEmployeeDashboard();
    } else {
      setLoading(false);
      setError("No employee profile linked to this account.");
    }
  }, [user?.employeeId, currentYear]);

  // Today's attendance record
  const todayAttendance = attendance.find(
    (record) =>
      record.date &&
      String(record.date).slice(0, 10) === malaysiaToday
  );

  // Attendance status
  let attendanceStatus = "Not Clocked In";

  if (todayAttendance?.clockIn && todayAttendance?.clockOut) {
    attendanceStatus = "Completed";
  } else if (todayAttendance?.clockIn) {
    attendanceStatus = "Clocked In";
  }

  // Count leave applications
  const totalApplications = applications.length;

  // Count applications still awaiting approval
  const pendingApplications = applications.filter(
    (application) => application.status === "PENDING"
  ).length;

  const formatTime = (dateValue) => {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleTimeString("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <p>Loading Employee Dashboard...</p>;
  }

  return (
    <div>
      <header>
        <h1>Employee Dashboard</h1>
        <p>
          Welcome, {user?.employeeName || "Employee"}!
        </p>
      </header>

      {error && (
        <p style={{ color: "#b42318" }} role="alert">
          {error}
        </p>
      )}

      <div className="dashboard-cards">
        {/* Attendance Card */}
        <div className="dashboard-card">
          <h3>My Attendance Today</h3>
          <h2>{attendanceStatus}</h2>

          <p>
            Clock In:{" "}
            {formatTime(todayAttendance?.clockIn)}
          </p>

          <p>
            Clock Out:{" "}
            {formatTime(todayAttendance?.clockOut)}
          </p>
        </div>

        {/* Leave Application Count */}
        <div className="dashboard-card">
          <h3>My Leave Applications</h3>
          <h2>{totalApplications}</h2>
          <p>Total submitted applications</p>
        </div>

        {/* Pending Applications */}
        <div className="dashboard-card">
          <h3>Pending Applications</h3>
          <h2>{pendingApplications}</h2>
          <p>Waiting for Manager approval</p>
        </div>

        {/* All Assigned Leave Balances */}
        <div className="dashboard-card">
          <h3>My Leave Balances</h3>
          <p>Year {currentYear}</p>

          {leaveBalances.length === 0 ? (
            <p>No leave entitlements assigned yet.</p>
          ) : (
            <div style={{ marginTop: "12px" }}>
              {leaveBalances.map((balance) => {
                const remaining =
                  Number(balance.remainingDays ??
                    (balance.entitledDays - balance.usedDays));

                return (
                  <div
                    key={balance.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <span>
                      {balance.leaveType?.name ||
                        "Leave Type"}
                    </span>

                    <strong>
                      {remaining} Days
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
