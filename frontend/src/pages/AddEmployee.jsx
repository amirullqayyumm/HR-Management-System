
import { useEffect, useState } from "react";

function AddEmployee({ onSuccess, onCancel }) {
  // 1. Employee form state
  
const [formData, setFormData] = useState({
  employeeNo: "",
  name: "",
  email: "",
  joinDate: "",
  departmentId: "",
  positionId: "",
  managerId: "",
  role: "EMPLOYEE",
  password: ""
});


  // 2. Dropdown options
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 3. Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // 4. Load departments, positions and employees
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
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
          throw new Error("Failed to load employee form options");
        }

        const [departmentData, positionData, employeeData] =
          await Promise.all([
            departmentRes.json(),
            positionRes.json(),
            employeeRes.json()
          ]);

        setDepartments(departmentData);
        setPositions(positionData);
        setEmployees(employeeData);

      } catch (err) {
        console.error("Error loading form options:", err);
        setError(err.message);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  // 5. Save employee
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || loadingOptions) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/employees",
        {
          method: "POST",
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

           
            // Optional reporting manager
            managerId: formData.managerId
              ? Number(formData.managerId)
              : null,

            // New staff login details
            role: formData.role,
            password: formData.password

          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to save employee"
        );
      }

      alert("Employee registered successfully!");
      onSuccess();

    } catch (err) {
      console.error("Save employee error:", err);
      setError(err.message);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 6. Only active employees can be selected as managers
  const availableManagers = employees.filter(
    (employee) => employee.status === "ACTIVE"
  );

  // 7. Display form
  return (
    <div className="employee-form-page">
      <h1>Add New Employee</h1>
      <p>Enter the employee information below.</p>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {loadingOptions ? (
        <p>Loading form options...</p>
      ) : (
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
              placeholder="e.g. EMP004"
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
              <option value="">Select Department</option>

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
              <option value="">Select Position</option>

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
          

          
<label>
  System Role
  <select
    name="role"
    value={formData.role}
    onChange={handleChange}
    required
  >
    <option value="EMPLOYEE">Employee</option>
    <option value="MANAGER">Manager</option>
  </select>
</label>


<label>
  Initial Login Password
  <input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    placeholder="Minimum 12 characters"
    minLength={12}
    autoComplete="new-password"
    required
  />
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

              {availableManagers.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({employee.employeeNo})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="save-employee-btn"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Employee"}
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
      )}
    </div>
  );
}

export default AddEmployee;
