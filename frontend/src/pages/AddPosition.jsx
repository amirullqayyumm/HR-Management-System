
import { useEffect, useState } from "react";

function AddPosition({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    departmentId: ""
  });

  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        
const response = await fetch(
    "http://localhost:5000/api/departments",
    {
      credentials: "include"
    }
  );
  

        if (!response.ok) {
          throw new Error("Failed to load departments");
        }

        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDepartments();
  }, []);

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
        "http://localhost:5000/api/positions",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            departmentId: Number(formData.departmentId)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to create position"
        );
      }

      alert("Position created successfully!");
      onSuccess();
    } catch (err) {
      console.error("Add position error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-form-page">
      <h1>Add Position</h1>
      <p>Create a new job position and assign its department.</p>

      {error && (
        <p style={{ color: "#b42318" }}>{error}</p>
      )}

      <form className="employee-form" onSubmit={handleSubmit}>
        <label>
          Position Code
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g. IT002"
            required
          />
        </label>

        <label>
          Position Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Software Engineer"
            required
          />
        </label>

        <label>
          Department
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>

            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Position"}
        </button>

        <button
          type="button"
          className="cancel-employee-btn"
          onClick={onCancel}
        >
          Back to Positions
        </button>
      </form>
    </div>
  );
}

export default AddPosition;
