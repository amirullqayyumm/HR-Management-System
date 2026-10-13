
import { useEffect, useState } from "react";
import LeaveCancellationButton from "./LeaveCancellationButton";

const API_URL = "http://localhost:5000/api";

// Count working days only (Monday to Friday).
// Saturday, Sunday and invalid date ranges are excluded.
const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getUTCDay();

    // Sunday = 0, Saturday = 6.
    if (day !== 0 && day !== 6) {
      workingDays++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
};

function LeaveApplications({ user }) {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Use the selected leave year, or the current year.
  const selectedYear = formData.startDate
    ? Number(formData.startDate.slice(0, 4))
    : new Date().getFullYear();

  // Only show leave types assigned by HR to this employee.
  const availableLeaveTypes = leaveTypes
    .map((leaveType) => {
      const balance = leaveBalances.find(
        (item) =>
          Number(item.leaveTypeId) === Number(leaveType.id) &&
          Number(item.year) === selectedYear &&
          Number(item.employeeId) === Number(user?.employeeId)
      );

      if (!balance) {
        return null;
      }

      return {
        ...leaveType,
        entitledDays: Number(balance.entitledDays),
        usedDays: Number(balance.usedDays),
        remainingDays:
          Number(balance.entitledDays) -
          Number(balance.usedDays),
      };
    })
    .filter(Boolean);

  const selectedLeave = availableLeaveTypes.find(
    (leaveType) =>
      String(leaveType.id) === String(formData.leaveTypeId)
  );

  // Working days requested in the application.
  const totalWorkingDays = calculateWorkingDays(
    formData.startDate,
    formData.endDate
  );

  const refreshApplications = async () => {
    const response = await fetch(
      `${API_URL}/leave-applications`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to refresh leave applications"
      );
    }

    setApplications(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [typeRes, balanceRes, applicationRes] =
          await Promise.all([
            fetch(`${API_URL}/leave-types`, {
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
          !typeRes.ok ||
          !balanceRes.ok ||
          !applicationRes.ok
        ) {
          throw new Error(
            "Failed to load leave application data"
          );
        }

        const [typeData, balanceData, applicationData] =
          await Promise.all([
            typeRes.json(),
            balanceRes.json(),
            applicationRes.json(),
          ]);

        setLeaveTypes(typeData);

        // HR_ADMIN can receive everyone's balances.
        // Only use the logged-in employee's own records.
        setLeaveBalances(
          balanceData.filter(
            (balance) =>
              Number(balance.employeeId) ===
              Number(user?.employeeId)
          )
        );

        setApplications(applicationData);
      } catch (err) {
        console.error("Load leave data error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.employeeId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setError("");
    setSuccess("");

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      // Clear selected leave type if leave year changes.
      if (
        name === "startDate" &&
        previous.startDate.slice(0, 4) !== value.slice(0, 4)
      ) {
        updated.leaveTypeId = "";
      }

      // Clear end date if it is before the new start date.
      if (
        name === "startDate" &&
        updated.endDate &&
        updated.endDate < value
      ) {
        updated.endDate = "";
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!user?.employeeId) {
        throw new Error("Please log in again.");
      }

      if (!selectedLeave) {
        throw new Error(
          "Please select a leave type assigned by HR."
        );
      }

      if (selectedLeave.remainingDays <= 0) {
        throw new Error(
          "No remaining balance for this leave type."
        );
      }

      if (!formData.startDate || !formData.endDate) {
        throw new Error(
          "Please select the start and end dates."
        );
      }

      if (formData.endDate < formData.startDate) {
        throw new Error(
          "End date cannot be earlier than start date."
        );
      }

      if (
        formData.startDate.slice(0, 4) !==
        formData.endDate.slice(0, 4)
      ) {
        throw new Error(
          "Leave applications across two calendar years are not supported yet."
        );
      }

      if (totalWorkingDays <= 0) {
        throw new Error(
          "Please select dates containing at least one working day (Monday to Friday)."
        );
      }

      if (totalWorkingDays > selectedLeave.remainingDays) {
        throw new Error(
          `Insufficient leave balance. You have ${selectedLeave.remainingDays} days remaining, but requested ${totalWorkingDays} working days.`
        );
      }

      const response = await fetch(
        `${API_URL}/leave-applications`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leaveTypeId: Number(formData.leaveTypeId),
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Failed to submit leave application"
        );
      }

      await refreshApplications();

      setFormData({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      setSuccess(
        "Leave application submitted successfully!"
      );
    } catch (err) {
      console.error("Submit leave error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancellationSuccess = async () => {
    setError("");
    setSuccess("");

    try {
      await refreshApplications();

      setSuccess(
        "Cancellation request submitted successfully!"
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) =>
    dateString ? dateString.slice(0, 10) : "-";

  const getCancellationStatus = (application) => {
    if (application.status === "CANCELLED") {
      return "CANCELLED";
    }

    if (application.cancellationStatus === "PENDING") {
      return "CANCELLATION PENDING";
    }

    if (application.cancellationStatus === "REJECTED") {
      return "CANCELLATION REJECTED";
    }

    return "-";
  };

  if (loading) {
    return <p>Loading leave applications...</p>;
  }

  return (
    <div>
      <h1>Leave Applications</h1>

      <p>
        Submit, view and request cancellation of leave
        applications.
      </p>

      {error && (
        <p style={{ color: "#b42318" }} role="alert">
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "#027a48" }}>
          {success}
        </p>
      )}

      <form
        className="employee-form"
        onSubmit={handleSubmit}
      >
        <h3>Apply for Leave</h3>

        <div style={{ marginBottom: "16px" }}>
          <strong>Employee:</strong>{" "}
          {user?.employeeName || "Not available"}

          {user?.employeeId && (
            <span> (ID: {user.employeeId})</span>
          )}
        </div>

        <label>
          Start Date
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          End Date
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            min={formData.startDate || undefined}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Leave Type
          <select
            name="leaveTypeId"
            value={formData.leaveTypeId}
            onChange={handleChange}
            required
          >
            <option value="">
              Select Leave Type
            </option>

            {availableLeaveTypes.map((leaveType) => (
              <option
                key={leaveType.id}
                value={leaveType.id}
                disabled={leaveType.remainingDays <= 0}
              >
                {leaveType.name} —{" "}
                {leaveType.remainingDays} days remaining
              </option>
            ))}
          </select>
        </label>

        <p
          style={{
            color: "#475467",
            fontSize: "13px",
          }}
        >
          Showing leave entitlements assigned by HR for{" "}
          <strong>{selectedYear}</strong>.
        </p>

        {availableLeaveTypes.length === 0 && (
          <p style={{ color: "#b42318" }}>
            No leave entitlements have been assigned for
            this year. Please contact HR.
          </p>
        )}

        {selectedLeave && (
          <div
            style={{
              padding: "12px",
              marginBottom: "16px",
              backgroundColor: "#f1f5f9",
              borderRadius: "8px",
            }}
          >
            <strong>{selectedLeave.name}</strong>

            <p>
              Entitled: {selectedLeave.entitledDays} days
            </p>

            <p>
              Used: {selectedLeave.usedDays} days
            </p>

            <p>
              Remaining:{" "}
              <strong>
                {selectedLeave.remainingDays} days
              </strong>
            </p>
          </div>
        )}

        <p>
          <strong>Total Working Days:</strong>{" "}
          {totalWorkingDays}
        </p>

        <p
          style={{
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Saturday and Sunday are excluded.
          Public holidays are not excluded yet.
        </p>

        <label className="form-group">
  <span className="form-label">Reason (Optional)</span>

  <textarea
    className="professional-textarea"
    name="reason"
    value={formData.reason}
    onChange={handleChange}
    rows={4}
    placeholder="Enter reason for leave..."
  />
</label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={
            saving ||
            !user?.employeeId ||
            availableLeaveTypes.length === 0
          }
        >
          {saving
            ? "Submitting..."
            : "Submit Leave Application"}
        </button>
      </form>

      <h2 style={{ marginTop: "30px" }}>
        Leave Application History
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days</th>
              <th>Status</th>
              <th>Cancellation Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {applications.length > 0 ? (
              applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    {application.employee?.name || "-"}
                  </td>
                  <td>
                    {application.leaveType?.name || "-"}
                  </td>
                  <td>
                    {formatDate(application.startDate)}
                  </td>
                  <td>
                    {formatDate(application.endDate)}
                  </td>
                  <td>{application.totalDays}</td>
                  <td>
                    <span className="status-badge">
                      {application.status}
                    </span>
                  </td>
                  <td>
                    {getCancellationStatus(application)}
                  </td>
                  <td>
                    {application.employeeId === user?.employeeId ? (
                      <LeaveCancellationButton
                        application={application}
                        onSuccess={handleCancellationSuccess}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: "25px",
                  }}
                >
                  No leave applications available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaveApplications;
