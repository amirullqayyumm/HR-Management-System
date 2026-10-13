
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function LeaveBalances({ user }) {
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isHRAdmin = user?.role === "HR_ADMIN";

  const [formData, setFormData] = useState({
    employeeId: "",
    leaveTypeId: "",
    year: String(new Date().getFullYear()),
    entitledDays: ""
  });

  // Load leave balances using the logged-in session
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Every role may request balances, subject to backend permissions.
      const balanceRes = await fetch(
        `${API_URL}/leave-balances`,
        { credentials: "include" }
      );

      const balanceData = await balanceRes.json();

      if (!balanceRes.ok) {
        throw new Error(
          balanceData.message ||
          "Failed to load leave balances"
        );
      }

      if (!Array.isArray(balanceData)) {
        throw new Error("Invalid leave balance data");
      }

      // Additional frontend filtering for non-admin users.
      // Backend must independently enforce these permissions.
      if (isHRAdmin) {
        setBalances(balanceData);
      } else {
        setBalances(
          balanceData.filter(
            (balance) =>
              balance.employeeId === user?.employeeId
          )
        );
      }

      // Only HR Admin needs the employee and leave type lists.
      if (isHRAdmin) {
        const [employeeRes, typeRes] = await Promise.all([
          fetch(`${API_URL}/employees`, {
            credentials: "include"
          }),
          fetch(`${API_URL}/leave-types`, {
            credentials: "include"
          })
        ]);

        if (!employeeRes.ok || !typeRes.ok) {
          throw new Error(
            "Failed to load entitlement form data"
          );
        }

        const [employeeData, typeData] =
          await Promise.all([
            employeeRes.json(),
            typeRes.json()
          ]);

        setEmployees(employeeData);
        setLeaveTypes(typeData);
      }
    } catch (err) {
      console.error("Load leave balances error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isHRAdmin, user?.employeeId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setError("");
    setSuccess("");
  };

  // Load default entitlement when leave type changes
  const handleLeaveTypeChange = (event) => {
    const selectedId = event.target.value;

    const selectedType = leaveTypes.find(
      (type) => type.id === Number(selectedId)
    );

    setFormData((previous) => ({
      ...previous,
      leaveTypeId: selectedId,
      entitledDays: selectedType
        ? String(selectedType.defaultDays)
        : ""
    }));

    setError("");
    setSuccess("");
  };

  // HR Admin only: save leave entitlement
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isHRAdmin || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/leave-balances`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            employeeId: Number(formData.employeeId),
            leaveTypeId: Number(formData.leaveTypeId),
            year: Number(formData.year),
            entitledDays: Number(formData.entitledDays)
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Failed to save entitlement"
        );
      }

      await loadData();

      setSuccess(
        "Leave entitlement saved successfully!"
      );

      setFormData((previous) => ({
        ...previous,
        employeeId: "",
        leaveTypeId: "",
        entitledDays: ""
      }));
    } catch (err) {
      console.error("Save entitlement error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeEmployees = employees.filter(
    (employee) => employee.status === "ACTIVE"
  );

  return (
    <div>
      <h1>Leave Balance Management</h1>

      <p>
        {isHRAdmin
          ? "Assign annual leave entitlements and monitor employee leave balances."
          : "View your available leave balances."}
      </p>

      {error && (
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "#027a48" }}>
          {success}
        </p>
      )}

      {/* HR Admin Only: Entitlement Form */}
      {isHRAdmin && (
        <form
          className="employee-form"
          onSubmit={handleSubmit}
        >
          <h3>Assign Leave Entitlement</h3>

          <label>
            Employee
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Employee
              </option>

              {activeEmployees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.name} ({employee.employeeNo})
                </option>
              ))}
            </select>
          </label>

          <label>
            Leave Type
            <select
              name="leaveTypeId"
              value={formData.leaveTypeId}
              onChange={handleLeaveTypeChange}
              required
            >
              <option value="">
                Select Leave Type
              </option>

              {leaveTypes.map((leaveType) => (
                <option
                  key={leaveType.id}
                  value={leaveType.id}
                >
                  {leaveType.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year
            <input
              type="number"
              name="year"
              min="2000"
              max="2100"
              value={formData.year}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Entitlement (Days)
            <input
              type="number"
              name="entitledDays"
              min="0"
              step="1"
              value={formData.entitledDays}
              onChange={handleChange}
              required
            />
          </label>

          <button
            type="submit"
            className="save-employee-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Entitlement"}
          </button>
        </form>
      )}

      {/* Leave Balance Table */}
      <h2 style={{ marginTop: "30px" }}>
        {isHRAdmin
          ? "Employee Leave Balances"
          : "My Leave Balances"}
      </h2>

      {loading ? (
        <p>Loading leave balances...</p>
      ) : (
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Leave Type</th>
              <th>Year</th>
              <th>Entitled</th>
              <th>Used</th>
              <th>Remaining</th>
            </tr>
          </thead>

          <tbody>
            {balances.length > 0 ? (
              balances.map((balance) => (
                <tr key={balance.id}>
                  <td>
                    {balance.employee?.name || "-"}
                  </td>
                  <td>
                    {balance.leaveType?.name || "-"}
                  </td>
                  <td>{balance.year}</td>
                  <td>{balance.entitledDays}</td>
                  <td>{balance.usedDays}</td>
                  <td>
                    <strong>
                      {balance.remainingDays}
                    </strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "25px"
                  }}
                >
                  No leave balances available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default LeaveBalances;
