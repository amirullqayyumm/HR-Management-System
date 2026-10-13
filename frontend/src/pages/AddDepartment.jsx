
import { useState } from "react";

function AddDepartment({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    code: "",
    name: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/departments",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim()
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Failed to add department"
        );
      }

      alert("Department added successfully!");
      onSuccess();

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-form-page">
      <h1>Add Department</h1>
      <p>Register a new department.</p>

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} className="employee-form">
        <label>
          Department Code
          <input
            value={formData.code}
            onChange={(e) =>
              setFormData({
                ...formData,
                code: e.target.value
              })
            }
            placeholder="e.g. MKT"
            required
          />
        </label>

        <label>
          Department Name
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
            placeholder="e.g. Marketing"
            required
          />
        </label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Department"}
        </button>

        <button
          type="button"
          className="cancel-employee-btn"
          onClick={onCancel}
        >
          Back to Departments
        </button>
      </form>
    </div>
  );
}

export default AddDepartment;
