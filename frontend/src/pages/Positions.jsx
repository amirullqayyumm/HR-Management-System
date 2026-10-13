
import { useEffect, useState } from "react";

function Positions({ onAddPosition, onEditPosition }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // STEP 1: Load positions from backend
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await 
        fetch("http://localhost:5000/api/positions", {
          credentials: "include",
        })
        

        if (!response.ok) {
          throw new Error("Failed to load positions");
        }

        const data = await response.json();
        setPositions(data);

      } catch (err) {
        console.error("Position error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  // STEP 2: Delete position safely
  const handleDeletePosition = async (position) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${position.name}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(position.id);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/positions/${position.id}`,
        {
          method: "DELETE"
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to delete position"
        );
      }

      // Remove deleted position from table
      setPositions((previous) =>
        previous.filter((item) => item.id !== position.id)
      );

      alert("Position deleted successfully!");

    } catch (err) {
      console.error("Delete position error:", err);
      setError(err.message);
      alert(err.message);

    } finally {
      setDeletingId(null);
    }
  };

  // STEP 3: Search and filter positions
  const filteredPositions = positions.filter((position) => {
    const search = searchTerm.trim().toLowerCase();

    return (
      position.code.toLowerCase().includes(search) ||
      position.name.toLowerCase().includes(search) ||
      (position.department?.name || "")
        .toLowerCase()
        .includes(search)
    );
  });

  // STEP 4: Loading screen
  if (loading) {
    return <p>Loading positions...</p>;
  }

  // STEP 5: Display Position Management
  return (
    <div>
      <h1>Position Management</h1>

      <p>
        Manage job positions and their assigned departments.
      </p>

      {/* Add Position Button */}
      <button
        type="button"
        className="add-employee-btn"
        onClick={onAddPosition}
      >
        + Add Position
      </button>

      {/* Error Message */}
      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {/* Search Bar */}
      <div className="employee-toolbar">
        <input
          type="text"
          className="employee-search"
          placeholder="Search position or department..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
        />

        <span className="employee-count">
          Showing {filteredPositions.length} of{" "}
          {positions.length} positions
        </span>
      </div>

      {/* Position Table */}
      <table className="employee-table">
        <thead>
          <tr>
            <th>Position Code</th>
            <th>Position Name</th>
            <th>Department</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredPositions.length > 0 ? (
            filteredPositions.map((position) => (
              <tr key={position.id}>
                <td>{position.code}</td>

                <td>{position.name}</td>

                <td>
                  {position.department?.name || "Not assigned"}
                </td>

                <td>
                  <div className="employee-actions">
                    {/* Edit Position */}
                    <button
                      type="button"
                      className="edit-employee-btn"
                      onClick={() =>
                        onEditPosition(position)
                      }
                    >
                      Edit
                    </button>

                    {/* Delete Position */}
                    <button
                      type="button"
                      className="delete-department-btn"
                      onClick={() =>
                        handleDeletePosition(position)
                      }
                      disabled={deletingId !== null}
                    >
                      {deletingId === position.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                style={{
                  textAlign: "center",
                  padding: "25px"
                }}
              >
                No positions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Positions;
