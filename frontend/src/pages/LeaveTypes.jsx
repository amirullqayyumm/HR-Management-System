
import { useEffect, useState } from "react";

function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    defaultDays: ""
  });

  // Load leave types from backend
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/leave-types",
          {
            credentials: "include"
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load leave types");
        }

        const data = await response.json();
        setLeaveTypes(data);
      } catch (err) {
        console.error("Load leave types error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  // Handle form input
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Save a new leave type
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/leave-types",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            defaultDays: Number(formData.defaultDays)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create leave type"
        );
      }

      // Add new record to the table
      setLeaveTypes((previous) =>
        [...previous, result].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      // Clear form
      setFormData({
        code: "",
        name: "",
        defaultDays: ""
      });

      setSuccess("Leave type added successfully!");
    } catch (err) {
      console.error("Create leave type error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Leave Types Management</h1>
      <p>Manage available employee leave categories.</p>

      {error && (
        <p style={{ color: "#b42318" }}>{error}</p>
      )}

      {success && (
        <p style={{ color: "#027a48" }}>{success}</p>
      )}

      {/* Add Leave Type Form */}
      <form
        className="employee-form"
        onSubmit={handleSubmit}
      >
        <h3>Add New Leave Type</h3>

        <label>
          Leave Code
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. AL"
            required
          />
        </label>

        <label>
          Leave Name
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Annual Leave"
            required
          />
        </label>

        <label>
          Default Entitlement (Days)
          <input
            type="number"
            name="defaultDays"
            min="0"
            step="1"
            value={formData.defaultDays}
            onChange={handleChange}
            placeholder="e.g. 14"
            required
          />
        </label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Add Leave Type"}
        </button>
      </form>

      {/* Leave Types Table */}
      <h2 style={{ marginTop: "30px" }}>
        Existing Leave Types
      </h2>

      {loading ? (
        <p>Loading leave types...</p>
      ) : (
        <table className="employee-table">
          <thead>
            <tr>
              <th>Leave Code</th>
              <th>Leave Name</th>
              <th>Default Days</th>
            </tr>
          </thead>

          <tbody>
            {leaveTypes.length > 0 ? (
              leaveTypes.map((leaveType) => (
                <tr key={leaveType.id}>
                  <td>{leaveType.code}</td>
                  <td>{leaveType.name}</td>
                  <td>{leaveType.defaultDays}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    textAlign: "center",
                    padding: "25px"
                  }}
                >
                  No leave types available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeaveTypes;
