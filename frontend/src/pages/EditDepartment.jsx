
import { useState } from "react";

function EditDepartment({ department, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    code: department.code,
    name: department.name
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/departments/${department.id}`,
        {
          method: "PUT",
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
          "Failed to update department"
        );
      }

      alert("Department updated successfully!");
      onSuccess();

    } catch (err) {
      console.error("Update department error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-form-page">
      <h1>Edit Department</h1>
      <p>Update the department information below.</p>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="employee-form">
        <label>
          Department Code
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Department Name
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={saving}
        >
          {saving ? "Updating..." : "Update Department"}
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

export default EditDepartment;
