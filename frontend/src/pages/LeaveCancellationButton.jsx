
import { useState } from "react";

const API_URL = "http://localhost:5000/api/leave-applications";

export default function LeaveCancellationButton({
  application,
  onSuccess,
}) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!application) return null;

  const canCancel =
    application.status === "PENDING" ||
    (
      application.status === "APPROVED" &&
      application.balanceDeducted === true &&
      ["NONE", "REJECTED"].includes(
        application.cancellationStatus
      )
    );

  const submitCancellation = async () => {
    if (loading) return;

    if (!reason.trim()) {
      setError("Please enter a cancellation reason.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/${application.id}/cancellation`,
        {
          method: "POST",

          // Send the current login session.
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            employeeId: application.employeeId,
            reason: reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Cancellation request failed"
        );
      }

      alert(data.message);

      setShowForm(false);
      setReason("");

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error("Leave cancellation error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (application.cancellationStatus === "PENDING") {
    return (
      <span
        style={{
          color: "#b7791f",
          fontWeight: 600,
        }}
      >
        Cancellation Pending
      </span>
    );
  }

  if (application.status === "CANCELLED") {
    return (
      <span style={{ color: "#777" }}>
        Cancelled
      </span>
    );
  }

  if (!canCancel) return null;

  return (
    <div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: "#f59e0b",
            color: "#111",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          {application.status === "PENDING"
            ? "Withdraw Leave"
            : "Request Cancellation"}
        </button>
      ) : (
        <div style={{ marginTop: "10px" }}>
          <textarea
            placeholder="Enter cancellation reason"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
            }}
          />

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              disabled={loading}
              onClick={submitCancellation}
            >
              {loading ? "Submitting..." : "Confirm"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
