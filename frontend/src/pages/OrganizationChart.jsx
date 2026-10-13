
import { useEffect, useState } from "react";

function OrganizationChart() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load employees using the logged-in session
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          
"http://localhost:5000/api/organization-chart"
,
          {
            credentials: "include"
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your session has expired. Please log in again."
            );
          }

          if (response.status === 403) {
            throw new Error(
              "You do not have permission to view the organization chart."
            );
          }

          throw new Error("Failed to load organization chart");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid employee data received");
        }

        setEmployees(data);
      } catch (err) {
        console.error("Organization chart error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Display an employee and their direct reports
  const renderEmployee = (employee, visited = new Set()) => {
    if (visited.has(employee.id)) return null;

    const nextVisited = new Set(visited);
    nextVisited.add(employee.id);

    const directReports = employees.filter(
      (item) => item.managerId === employee.id
    );

    return (
      <div className="org-node" key={employee.id}>
        <div className="org-card">
          <strong>{employee.name}</strong>

          <span>
            {employee.position?.name || "No Position"}
          </span>

          <small>
            {employee.department?.name || "No Department"}
          </small>

          <small>
            {employee.status === "ACTIVE"
              ? "Active"
              : "Inactive"}
          </small>
        </div>

        {directReports.length > 0 && (
          <div className="org-children">
            {directReports.map((report) =>
              renderEmployee(report, nextVisited)
            )}
          </div>
        )}
      </div>
    );
  };

  // Identify employees at the top of the organization
  const employeeIds = new Set(
    employees.map((employee) => employee.id)
  );

  const topLevelEmployees = employees.filter(
    (employee) =>
      employee.managerId == null ||
      !employeeIds.has(employee.managerId)
  );

  if (loading) {
    return <p>Loading organization chart...</p>;
  }

  if (error) {
    return (
      <div className="org-page">
        <h1>Organization Chart</h1>
        <p style={{ color: "#b42318" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="org-page">
      <h1>Organization Chart</h1>

      <p>View employee reporting relationships.</p>

      {employees.length === 0 ? (
        <p>No employees available.</p>
      ) : (
        <div className="org-chart">
          {topLevelEmployees.length > 0 ? (
            topLevelEmployees.map((employee) =>
              renderEmployee(employee)
            )
          ) : (
            <p>
              No top-level employee found.
              Check reporting relationships.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizationChart;
