
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function Attendance({ user }) {
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // HR attendance report filters
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const isHRAdmin = user?.role === "HR_ADMIN";

  // Today's date in Malaysia
  const malaysiaDate = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  // Format attendance date
  const formatDate = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-MY", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  // Format clock-in and clock-out time
  const formatTime = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-MY", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  };

  // Calculate working hours
  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return "-";

    const milliseconds =
      new Date(clockOut).getTime() -
      new Date(clockIn).getTime();

    if (milliseconds < 0) return "-";

    const totalMinutes = Math.floor(
      milliseconds / 60000
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  // Retrieve attendance records
  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      // Personal attendance
      const myResponse = await fetch(
        `${API_URL}/attendance/my`,
        {
          credentials: "include",
        }
      );

      const myData = await myResponse.json();

      if (!myResponse.ok) {
        throw new Error(
          myData.message || "Failed to load attendance"
        );
      }

      if (!Array.isArray(myData)) {
        throw new Error("Invalid attendance response");
      }

      setRecords(myData);

      // All employee attendance - HR_ADMIN only
      if (isHRAdmin) {
        const allResponse = await fetch(
          `${API_URL}/attendance/all`,
          {
            credentials: "include",
          }
        );

        const allData = await allResponse.json();

        if (!allResponse.ok) {
          throw new Error(
            allData.message ||
              "Failed to load employee attendance"
          );
        }

        setAllRecords(
          Array.isArray(allData) ? allData : []
        );
      } else {
        setAllRecords([]);
      }
    } catch (err) {
      console.error("Attendance loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [isHRAdmin, user?.employeeId]);

  // Clock In / Clock Out
  const handleAttendanceAction = async (action) => {
    if (processing) return;

    const message =
      action === "clock-in"
        ? "Clock in now?"
        : "Clock out now?";

    if (!window.confirm(message)) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/attendance/${action}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Attendance action failed"
        );
      }

      await loadAttendance();

      setSuccess(
        result.message || "Attendance updated!"
      );
    } catch (err) {
      console.error("Attendance action error:", err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Today's attendance
  const today = malaysiaDate();

  const todayAttendance = records.find(
    (record) =>
      record.date &&
      String(record.date).slice(0, 10) === today
  );

  const hasClockedIn = Boolean(todayAttendance);
  const hasClockedOut = Boolean(
    todayAttendance?.clockOut
  );

  // ---------------------------------
  // HR ATTENDANCE REPORT
  // ---------------------------------

  // Extract unique employees from attendance records
  const employeeOptions = Array.from(
    new Map(
      allRecords
        .filter((record) => record.employee)
        .map((record) => [
          record.employeeId,
          {
            id: record.employeeId,
            name: record.employee.name,
          },
        ])
    ).values()
  ).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Filter attendance by employee and date
  const filteredRecords = allRecords.filter(
    (record) => {
      const matchesEmployee =
        !selectedEmployee ||
        String(record.employeeId) ===
          selectedEmployee;

      const matchesDate =
        !selectedDate ||
        String(record.date).slice(0, 10) ===
          selectedDate;

      return matchesEmployee && matchesDate;
    }
  );

  // Summary calculations
  const totalAttendanceRecords =
    filteredRecords.length;

  const totalEmployeesClockedIn = new Set(
    filteredRecords.map(
      (record) => record.employeeId
    )
  ).size;

  const totalCompletedClockOuts =
    filteredRecords.filter(
      (record) => Boolean(record.clockOut)
    ).length;

  // Clear report filters
  const clearFilters = () => {
    setSelectedEmployee("");
    setSelectedDate("");
  };

  // Prepare CSV-safe values for Excel
  const escapeCSV = (value) => {
    let text = String(value ?? "");

    // Prevent spreadsheet formula injection
    if (/^[\s]*[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  // Export filtered attendance records to CSV
  const exportAttendanceCSV = () => {
    if (!isHRAdmin || filteredRecords.length === 0) {
      return;
    }

    const headers = [
      "Employee",
      "Department",
      "Date",
      "Clock In",
      "Clock Out",
      "Working Hours",
      "Status",
    ];

    const rows = filteredRecords.map(
      (record) => [
        record.employee?.name || "-",
        record.employee?.department?.name || "-",
        formatDate(record.date),
        formatTime(record.clockIn),
        formatTime(record.clockOut),
        calculateHours(
          record.clockIn,
          record.clockOut
        ),
        record.status || "-",
      ]
    );

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    // UTF-8 BOM helps Excel display names correctly
    const blob = new Blob(
      ["\uFEFF" + csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    link.download =
      `HRMS_Attendance_Report_${selectedDate || today}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ---------------------------------
  // STYLING
  // ---------------------------------

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "20px",
  };

  const summaryContainerStyle = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  };

  const summaryCardStyle = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "18px",
  };

  const filterStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
  };

  return (
    <div>
      <h1>Attendance Management</h1>

      <p>
        Welcome,{" "}
        <strong>
          {user?.employeeName || "Employee"}
        </strong>
        . Record your attendance and view your
        working hours.
      </p>

      {error && (
        <p
          style={{ color: "#b42318" }}
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "#027a48" }}>
          {success}
        </p>
      )}

      {/* TODAY'S ATTENDANCE */}
      <div style={cardStyle}>
        <h2>Today's Attendance</h2>

        <p>
          <strong>Date:</strong>{" "}
          {formatDate(
            `${today}T00:00:00Z`
          )}
        </p>

        {loading ? (
          <p>Loading attendance...</p>
        ) : (
          <>
            <p>
              <strong>Clock In:</strong>{" "}
              {formatTime(
                todayAttendance?.clockIn
              )}
            </p>

            <p>
              <strong>Clock Out:</strong>{" "}
              {formatTime(
                todayAttendance?.clockOut
              )}
            </p>

            <p>
              <strong>Working Hours:</strong>{" "}
              {calculateHours(
                todayAttendance?.clockIn,
                todayAttendance?.clockOut
              )}
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                className="save-employee-btn"
                disabled={
                  loading ||
                  processing ||
                  hasClockedIn
                }
                onClick={() =>
                  handleAttendanceAction("clock-in")
                }
              >
                {processing
                  ? "Processing..."
                  : "Clock In"}
              </button>

              <button
                type="button"
                disabled={
                  loading ||
                  processing ||
                  !hasClockedIn ||
                  hasClockedOut
                }
                onClick={() =>
                  handleAttendanceAction("clock-out")
                }
                style={{
                  background: "#1d4ed8",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 18px",
                  cursor: "pointer",
                }}
              >
                Clock Out
              </button>
            </div>

            {hasClockedOut && (
              <p
                style={{
                  color: "#027a48",
                  marginTop: "12px",
                }}
              >
                Today's attendance is completed.
              </p>
            )}
          </>
        )}
      </div>

      {/* PERSONAL ATTENDANCE HISTORY */}
      <div style={cardStyle}>
        <h2>My Attendance History</h2>

        {loading ? (
          <p>Loading attendance history...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        {formatDate(record.date)}
                      </td>
                      <td>
                        {formatTime(
                          record.clockIn
                        )}
                      </td>
                      <td>
                        {formatTime(
                          record.clockOut
                        )}
                      </td>
                      <td>
                        {calculateHours(
                          record.clockIn,
                          record.clockOut
                        )}
                      </td>
                      <td>
                        {record.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: "20px",
                      }}
                    >
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HR ADMIN ATTENDANCE REPORT */}
      {isHRAdmin && (
        <div style={cardStyle}>
          <h2>HR Attendance Reports</h2>

          <p style={{ color: "#64748b" }}>
            Filter attendance records by employee
            or date, review the summary, and export
            the report to Excel-compatible CSV.
          </p>

          {/* FILTERS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label
                htmlFor="attendance-employee"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Employee
              </label>

              <select
                id="attendance-employee"
                value={selectedEmployee}
                onChange={(event) =>
                  setSelectedEmployee(
                    event.target.value
                  )
                }
                style={filterStyle}
              >
                <option value="">
                  All Employees
                </option>

                {employeeOptions.map(
                  (employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="attendance-date"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Attendance Date
              </label>

              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(
                    event.target.value
                  )
                }
                style={filterStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: "10px 18px",
                background: "#475569",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={exportAttendanceCSV}
              disabled={
                loading ||
                filteredRecords.length === 0
              }
              style={{
                padding: "10px 18px",
                background: "#15803d",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor:
                  filteredRecords.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Export Attendance CSV
            </button>

            <button
              type="button"
              onClick={loadAttendance}
              disabled={loading}
              style={{
                padding: "10px 18px",
                background: "#1d4ed8",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Refresh Report
            </button>
          </div>

          {/* SUMMARY */}
          <h3>Attendance Summary</h3>

          <div style={summaryContainerStyle}>
            <div style={summaryCardStyle}>
              <p
                style={{
                  color: "#64748b",
                  margin: "0 0 8px",
                }}
              >
                Attendance Records
              </p>

              <h2 style={{ margin: 0 }}>
                {totalAttendanceRecords}
              </h2>
            </div>

            <div style={summaryCardStyle}>
              <p
                style={{
                  color: "#64748b",
                  margin: "0 0 8px",
                }}
              >
                Employees Clocked In
              </p>

              <h2 style={{ margin: 0 }}>
                {totalEmployeesClockedIn}
              </h2>
            </div>

            <div style={summaryCardStyle}>
              <p
                style={{
                  color: "#64748b",
                  margin: "0 0 8px",
                }}
              >
                Completed Clock Outs
              </p>

              <h2 style={{ margin: 0 }}>
                {totalCompletedClockOuts}
              </h2>
            </div>
          </div>

          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Summary reflects the filtered
            attendance records. Employees Clocked
            In counts unique employees.
          </p>

          {/* REPORT TABLE */}
          <h3 style={{ marginTop: "24px" }}>
            Employee Attendance Records
          </h3>

          {loading ? (
            <p>
              Loading employee attendance...
            </p>
          ) : (
            <div
              style={{ overflowX: "auto" }}
            >
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(
                      (record) => (
                        <tr key={record.id}>
                          <td>
                            {record.employee?.name ||
                              "-"}
                          </td>

                          <td>
                            {record.employee
                              ?.department?.name ||
                              "-"}
                          </td>

                          <td>
                            {formatDate(
                              record.date
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.clockIn
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.clockOut
                            )}
                          </td>

                          <td>
                            {calculateHours(
                              record.clockIn,
                              record.clockOut
                            )}
                          </td>

                          <td>
                            {record.status}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "25px",
                        }}
                      >
                        No attendance records
                        found for the selected
                        filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Attendance;
