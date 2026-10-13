
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function ManagerLeaveApproval({ user }) {
  const [applications, setApplications] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [cancellationRemarks, setCancellationRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canApprove =
    user?.role === "MANAGER" || user?.role === "HR_ADMIN";

  // Load leave applications accessible to the logged-in user
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/leave-applications`,
        { credentials: "include" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load approval data"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid leave application data");
      }

      setApplications(data);
    } catch (err) {
      console.error("Load approval data error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canApprove) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [canApprove]);

  // Only applications from the logged-in manager's direct reports
  const assignedApplications = applications.filter(
    (application) =>
      application.employee?.managerId === user?.employeeId &&
      application.employeeId !== user?.employeeId
  );

  const pendingApplications = assignedApplications.filter(
    (application) => application.status === "PENDING"
  );

  const pendingCancellations = assignedApplications.filter(
    (application) =>
      application.status === "APPROVED" &&
      application.cancellationStatus === "PENDING"
  );

  const handleReview = async (applicationId, status) => {
    if (!canApprove || reviewingId !== null) return;

    const action = status === "APPROVED" ? "approve" : "reject";

    if (!window.confirm(
      `Are you sure you want to ${action} this leave application?`
    )) {
      return;
    }

    setReviewingId(`leave-${applicationId}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/leave-applications/${applicationId}/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status,
            remarks: remarks[applicationId] || ""
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to review application"
        );
      }

      await loadData();
      setSuccess(
        `Leave application ${status.toLowerCase()} successfully!`
      );
    } catch (err) {
      console.error("Review leave error:", err);
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleCancellationReview = async (
    applicationId,
    status
  ) => {
    if (!canApprove || reviewingId !== null) return;

    const action = status === "APPROVED" ? "approve" : "reject";

    if (!window.confirm(
      `Are you sure you want to ${action} this cancellation request?`
    )) {
      return;
    }

    setReviewingId(`cancellation-${applicationId}`);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/leave-applications/${applicationId}/cancellation/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status,
            remarks: cancellationRemarks[applicationId] || ""
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to review cancellation request"
        );
      }

      await loadData();
      setSuccess(
        status === "APPROVED"
          ? "Cancellation approved successfully!"
          : "Cancellation request rejected successfully."
      );
    } catch (err) {
      console.error("Cancellation review error:", err);
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const formatDate = (date) =>
    date ? String(date).slice(0, 10) : "-";

  const cardStyle = {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "16px"
  };

  const approveButtonStyle = {
    background: "#15803d",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer"
  };

  const rejectButtonStyle = {
    background: "#b91c1c",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "6px",
    cursor: "pointer"
  };

  if (!canApprove) {
    return (
      <div>
        <h1>Manager Leave Approval</h1>
        <p style={{ color: "#b42318" }}>
          You do not have permission to approve leave.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Manager Leave Approval</h1>
      <p>
        Logged in as: <strong>{user?.employeeName}</strong>
      </p>
      <p>
        Review leave applications and cancellation requests
        from your direct reports.
      </p>

      {error && (
        <p style={{ color: "#b42318" }}>{error}</p>
      )}

      {success && (
        <p style={{ color: "#027a48" }}>{success}</p>
      )}

      <h2 style={{ marginTop: "30px" }}>
        Pending Leave Applications ({pendingApplications.length})
      </h2>

      {loading ? (
        <p>Loading applications...</p>
      ) : pendingApplications.length === 0 ? (
        <p>No pending leave applications from your direct reports.</p>
      ) : (
        <div>
          {pendingApplications.map((application) => (
            <div key={application.id} style={cardStyle}>
              <h3>{application.employee?.name || "Employee"}</h3>

              <p>
                <strong>Leave Type:</strong>{" "}
                {application.leaveType?.name || "-"}
              </p>

              <p>
                <strong>Dates:</strong>{" "}
                {formatDate(application.startDate)} to{" "}
                {formatDate(application.endDate)}
              </p>

              <p>
                <strong>Total Days:</strong> {application.totalDays}
              </p>

              <p>
                <strong>Reason:</strong> {application.reason || "-"}
              </p>

              <label>
                Manager Remarks (Optional)
                <textarea
                  rows={2}
                  value={remarks[application.id] || ""}
                  onChange={(event) =>
                    setRemarks((previous) => ({
                      ...previous,
                      [application.id]: event.target.value
                    }))
                  }
                  placeholder="Enter approval or rejection remarks..."
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px"
                }}
              >
                <button
                  type="button"
                  disabled={reviewingId !== null}
                  onClick={() =>
                    handleReview(application.id, "APPROVED")
                  }
                  style={approveButtonStyle}
                >
                  Approve
                </button>

                <button
                  type="button"
                  disabled={reviewingId !== null}
                  onClick={() =>
                    handleReview(application.id, "REJECTED")
                  }
                  style={rejectButtonStyle}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: "40px" }}>
        Pending Cancellation Requests ({pendingCancellations.length})
      </h2>

      {loading ? (
        <p>Loading cancellation requests...</p>
      ) : pendingCancellations.length === 0 ? (
        <p>No pending cancellation requests from your direct reports.</p>
      ) : (
        <div>
          {pendingCancellations.map((application) => (
            <div key={application.id} style={cardStyle}>
              <h3>{application.employee?.name || "Employee"}</h3>

              <p>
                <strong>Leave Type:</strong>{" "}
                {application.leaveType?.name || "-"}
              </p>

              <p>
                <strong>Dates:</strong>{" "}
                {formatDate(application.startDate)} to{" "}
                {formatDate(application.endDate)}
              </p>

              <p>
                <strong>Total Days:</strong> {application.totalDays}
              </p>

              <p>
                <strong>Cancellation Reason:</strong>{" "}
                {application.cancellationReason || "-"}
              </p>

              <label>
                Manager Cancellation Remarks (Optional)
                <textarea
                  rows={2}
                  value={cancellationRemarks[application.id] || ""}
                  onChange={(event) =>
                    setCancellationRemarks((previous) => ({
                      ...previous,
                      [application.id]: event.target.value
                    }))
                  }
                  placeholder="Enter cancellation review remarks..."
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                  flexWrap: "wrap"
                }}
              >
                <button
                  type="button"
                  disabled={reviewingId !== null}
                  onClick={() =>
                    handleCancellationReview(
                      application.id,
                      "APPROVED"
                    )
                  }
                  style={approveButtonStyle}
                >
                  Approve Cancellation
                </button>

                <button
                  type="button"
                  disabled={reviewingId !== null}
                  onClick={() =>
                    handleCancellationReview(
                      application.id,
                      "REJECTED"
                    )
                  }
                  style={rejectButtonStyle}
                >
                  Reject Cancellation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ManagerLeaveApproval;
