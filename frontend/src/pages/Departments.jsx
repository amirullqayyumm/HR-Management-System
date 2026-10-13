
import { useEffect, useState } from "react";

function Departments({ onAddDepartment, onEditDepartment }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await 
        fetch("http://localhost:5000/api/departments", {
          credentials: "include",
        })
        

        if (!response.ok) {
          throw new Error("Failed to load departments");
        }

        const data = await response.json();
        setDepartments(data);

      } catch (err) {
        console.error("Department error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  
const handleDeleteDepartment = async (department) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${department.name}?`
  );

  if (!confirmed) return;

  try {
    setDeletingId(department.id);
    setError("");

    const response = await fetch(
      `http://localhost:5000/api/departments/${department.id}`,
      {
        method: "DELETE"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to delete department"
      );
    }

    // Remove deleted department from the table
    setDepartments((previous) =>
      previous.filter((item) => item.id !== department.id)
    );

    alert("Department deleted successfully!");

  } catch (err) {
    console.error("Delete department error:", err);
    setError(err.message);
    alert(err.message);
  } finally {
    setDeletingId(null);
  }
};


  const filteredDepartments = departments.filter((department) => {
    const search = searchTerm.toLowerCase();
  
    return (
      department.code.toLowerCase().includes(search) ||
      department.name.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <p>Loading departments...</p>;
  }

  return (
    <div>
      <h1>Department Management</h1>
      <p>Manage company departments and organizational structure.</p>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      
<button
  type="button"
  className="add-employee-btn"
  onClick={onAddDepartment}
>
  + Add Department
</button>

{/* Department Search */}
<div className="employee-toolbar">
  <input
    type="text"
    className="employee-search"
    placeholder="Search department code or name..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <span className="employee-count">
    Showing {filteredDepartments.length} of {departments.length} departments
  </span>
</div>

<table className="employee-table">

        <thead>
          <tr>
            <th>Department Code</th>
            <th>Department Name</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
        {filteredDepartments.length > 0 ? (
  filteredDepartments.map((department) => (
              <tr key={department.id}>
                <td>{department.code}</td>
                <td>{department.name}</td>
                <td>
                  
<div className="employee-actions">
  <button
    type="button"
    className="edit-employee-btn"
    onClick={() => onEditDepartment(department)}
  >
    Edit
  </button>

  <button
    type="button"
    className="delete-department-btn"
    onClick={() => handleDeleteDepartment(department)}
    disabled={deletingId !== null}
  >
    {deletingId === department.id ? "Deleting..." : "Delete"}
  </button>
</div>

                </td>
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
                No departments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Departments;
