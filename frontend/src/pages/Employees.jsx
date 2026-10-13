
import { useEffect, useState } from "react";

function Employees({ onAddEmployee, onEditEmployee }) {
  // 1. Employee states
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  // 2. Fetch employees from backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await 
        fetch("http://localhost:5000/api/employees", {
          credentials: "include",
        })
        

        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }

        const data = await response.json();
        setEmployees(data);

      } catch (err) {
        console.error("Fetch employees error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // 3. Activate or deactivate employee
  const handleStatusChange = async (employee) => {
    const isActive = employee.status === "ACTIVE";
    const action = isActive ? "deactivate" : "reactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${employee.name}?`
    );

    if (!confirmed) return;

    setUpdatingId(employee.id);
    setError("");

    try {
      
const response = await fetch(
  `http://localhost:5000/api/employees/${employee.id}/${action}`,
  {
    method: "PATCH",
    credentials: "include"
  }
);


      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          "Failed to update employee status"
        );
      }

      // Backend returns updated employee inside result.employee
      setEmployees((previous) =>
        previous.map((item) =>
          item.id === employee.id
            ? {
                ...item,
                status: result.employee.status
              }
            : item
        )
      );

      alert(
        isActive
          ? "Employee deactivated successfully!"
          : "Employee reactivated successfully!"
      );

    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // 4. Search employees, departments, positions and managers
  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      employee.name.toLowerCase().includes(search) ||
      employee.employeeNo.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      (employee.department?.name || "")
        .toLowerCase()
        .includes(search) ||
      (employee.position?.name || "")
        .toLowerCase()
        .includes(search) ||
      (employee.manager?.name || "")
        .toLowerCase()
        .includes(search)
    );
  });

  // 5. Loading screen
  if (loading) {
    return <p>Loading employees...</p>;
  }

  // 6. Employee Management page
  return (
    <div>
      {/* Page Header */}
      <h1>Employee Management</h1>
      <p>
        Manage employee information, reporting managers
        and employment status.
      </p>

      {/* Error Message */}
      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {/* Add Employee Button */}
      <button
        type="button"
        className="add-employee-btn"
        onClick={onAddEmployee}
      >
        + Add Employee
      </button>

      {/* Employee Search */}
      <div className="employee-toolbar">
        <input
          type="text"
          placeholder="Search employee, department, position or manager..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="employee-search"
        />

        <span className="employee-count">
          Showing {filteredEmployees.length} of{" "}
          {employees.length} employees
        </span>
      </div>

      {/* Employee Table */}
      <table className="employee-table">
        <thead>
          <tr>
            <th>Employee No.</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Position</th>
            <th>Reporting Manager</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.employeeNo}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>

                <td>
                  {employee.department?.name || "-"}
                </td>

                <td>
                  {employee.position?.name || "-"}
                </td>

                {/* NEW: Reporting Manager */}
                <td>
                  {employee.manager?.name || "-"}
                </td>

                {/* Employee Status */}
                <td>
                  <span
                    className={`status-badge ${
                      employee.status === "ACTIVE"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {employee.status === "ACTIVE"
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </span>
                </td>

                {/* Action Buttons */}
                <td>
                  <div className="employee-actions">
                    <button
                      type="button"
                      className="edit-employee-btn"
                      onClick={() =>
                        onEditEmployee(employee)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className={
                        employee.status === "ACTIVE"
                          ? "deactivate-btn"
                          : "activate-btn"
                      }
                      onClick={() =>
                        handleStatusChange(employee)
                      }
                      disabled={updatingId !== null}
                    >
                      {updatingId === employee.id
                        ? "Updating..."
                        : employee.status === "ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={8}
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "#667085"
                }}
              >
                {searchTerm
                  ? "No employees found matching your search."
                  : "No employees available."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Employees;
