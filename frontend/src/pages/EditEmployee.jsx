
import { useEffect, useState } from "react";

function EditEmployee({ employee, onCancel, onSuccess }) {
  // 1. Employee form state
  const [formData, setFormData] = useState({
    employeeNo: employee.employeeNo,
    name: employee.name,
    email: employee.email,
    joinDate: employee.joinDate.slice(0, 10),
    departmentId: String(employee.departmentId),
    positionId: String(employee.positionId),
    managerId:
      employee.managerId === null ||
      employee.managerId === undefined
        ? ""
        : String(employee.managerId)
  });

  // 2. Dropdown options
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 3. Load departments, positions and employees
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        setError("");

        
const [departmentRes, positionRes, employeeRes] =
await Promise.all([
  fetch("http://localhost:5000/api/departments", {
    credentials: "include"
  }),
  fetch("http://localhost:5000/api/positions", {
    credentials: "include"
  }),
  fetch("http://localhost:5000/api/employees", {
    credentials: "include"
  })
]);


        if (
          !departmentRes.ok ||
          !positionRes.ok ||
          !employeeRes.ok
        ) {
          throw new Error(
            "Unable to load employee form options"
          );
        }

        const [
          departmentData,
          positionData,
          employeeData
        ] = await Promise.all([
          departmentRes.json(),
          positionRes.json(),
          employeeRes.json()
        ]);

        setDepartments(departmentData);
        setPositions(positionData);
        setEmployees(employeeData);

      } catch (err) {
        console.error("Loading employee options error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // 4. Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // 5. Save changes to PostgreSQL through Express
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSaving(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${employee.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeNo: formData.employeeNo.trim(),
            name: formData.name.trim(),
            email: formData.email.trim(),
            joinDate: formData.joinDate,
            departmentId: Number(formData.departmentId),
            positionId: Number(formData.positionId),

            // Reporting Manager
            managerId: formData.managerId
              ? Number(formData.managerId)
              : null
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to update employee"
        );
      }

      alert("Employee updated successfully!");
      onSuccess();

    } catch (err) {
      console.error("Update employee error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 6. Available reporting managers
  // Exclude the employee being edited
  // Include active employees and the current manager
  const availableManagers = employees.filter(
    (item) =>
      item.id !== employee.id &&
      (
        item.status === "ACTIVE" ||
        item.id === employee.managerId
      )
  );

  // 7. Loading screen
  if (loading) {
    return <p>Loading employee form...</p>;
  }

  // 8. Display Edit Employee form
  return (
    <div className="employee-form-page">
      <h1>Edit Employee</h1>

      <p>Update employee information below.</p>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="employee-form"
      >
        <label>
          Employee Number
          <input
            name="employeeNo"
            value={formData.employeeNo}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Full Name
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Join Date
          <input
            type="date"
            name="joinDate"
            value={formData.joinDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Department
          <select
            name="departmentId"
            value={formData.departmentId}
            onChange={(event) => {
              setFormData((previous) => ({
                ...previous,
                departmentId: event.target.value,
                positionId: ""
              }));
            }}
            required
          >
            <option value="">
              Select Department
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Position
          <select
            name="positionId"
            value={formData.positionId}
            onChange={handleChange}
            disabled={!formData.departmentId}
            required
          >
            <option value="">
              Select Position
            </option>

            {positions
              .filter(
                (position) =>
                  position.departmentId ===
                  Number(formData.departmentId)
              )
              .map((position) => (
                <option
                  key={position.id}
                  value={position.id}
                >
                  {position.name}
                </option>
              ))}
          </select>
        </label>

        {/* NEW: Reporting Manager */}
        <label>
          Reporting Manager (Optional)
          <select
            name="managerId"
            value={formData.managerId}
            onChange={handleChange}
          >
            <option value="">
              No Reporting Manager
            </option>

            {availableManagers.map((manager) => (
              <option
                key={manager.id}
                value={manager.id}
              >
                {manager.name} ({manager.employeeNo})
                {manager.status !== "ACTIVE"
                  ? " - Inactive"
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="save-employee-btn"
          disabled={saving}
        >
          {saving ? "Updating..." : "Update Employee"}
        </button>

        <button
          type="button"
          className="cancel-employee-btn"
          onClick={onCancel}
          disabled={saving}
        >
          Back to Employees
        </button>
      </form>
    </div>
  );
}

export default EditEmployee;
