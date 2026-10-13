import { useEffect, useState } from "react";

import Login from "./pages/Login";

import Attendance from "./pages/Attendance";

import MyProfile from "./pages/MyProfile";

import EmployeeDashboard from "./pages/EmployeeDashboard";

import OrganizationChart from "./pages/OrganizationChart";

import LeaveTypes from "./pages/LeaveTypes";

import LeaveApplications from "./pages/LeaveApplications";

import LeaveBalances from "./pages/LeaveBalances";

import ManagerLeaveApproval from "./pages/ManagerLeaveApproval";

import Positions from "./pages/Positions";

import AddPosition from "./pages/AddPosition";

import EditPosition from "./pages/EditPosition";

import Employees from "./pages/Employees";

import AddEmployee from "./pages/AddEmployee";

import EditEmployee from "./pages/EditEmployee";

import Departments from "./pages/Departments";

import AddDepartment from "./pages/AddDepartment";

import EditDepartment from "./pages/EditDepartment";

import "./App.css";

function App() {

const handleLogout = async () => {

  try {

    const response = await fetch(

      "http://localhost:5000/api/auth/logout",

      {

        method: "POST",

        credentials: "include",

      }

    );

    if (!response.ok) {

      throw new Error("Logout failed");

    }

    setUser(null);

    setCurrentPage("dashboard");

  } catch (error) {

    console.error("Logout error:", error);

    alert("Unable to log out. Please try again.");

  }

};

  // Page navigation

  const [currentPage, setCurrentPage] = useState("dashboard");
  
const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem("hrms-dark-mode") === "true";
});

useEffect(() => {
  localStorage.setItem("hrms-dark-mode", String(darkMode));
}, [darkMode]);


const [user, setUser] = useState(null);

const isHRAdmin = user?.role === "HR_ADMIN";

const isManager = user?.role === "MANAGER";

const isEmployee = user?.role === "EMPLOYEE";

const canManageEmployees = isHRAdmin;

const canApproveLeave = isHRAdmin || isManager;

const [checkingSession, setCheckingSession] = useState(true);

useEffect(() => {

  const checkSession = async () => {

    try {

      const response = await fetch(

        "http://localhost:5000/api/auth/me",

        { credentials: "include" }

      );

      if (response.ok) {

        const data = await response.json();

        setUser(data.user);

      }

    } catch (error) {

      console.error("Session check failed:", error);

    } finally {

      setCheckingSession(false);

    }

  };

  checkSession();

}, []);

  // Selected records for editing

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [selectedPosition, setSelectedPosition] = useState(null);

  // Dashboard statistics

  const [totalEmployees, setTotalEmployees] = useState(0);

  const [activeEmployees, setActiveEmployees] = useState(0);

  const [totalDepartments, setTotalDepartments] = useState(0);

  const [totalPositions, setTotalPositions] = useState(0);

  const [myTeam, setMyTeam] = useState(0);

  const [teamPresentToday, setTeamPresentToday] = useState(0);

  const [pendingLeaveApprovals, setPendingLeaveApprovals] = useState(0);

  const [myLeaveBalances, setMyLeaveBalances] = useState(null);
  const [myLeaveBalancesError, setMyLeaveBalancesError] = useState("");

  // Load dashboard information

  useEffect(() => {

    if (currentPage !== "dashboard" || user?.role !== "HR_ADMIN") return;

    const fetchDashboardData = async () => {

      try {

          const [employeeRes, departmentRes, positionRes] =

          await Promise.all([

            fetch("http://localhost:5000/api/employees", {

              credentials: "include",

            }),

            fetch("http://localhost:5000/api/departments", {

              credentials: "include",

            }),

            fetch("http://localhost:5000/api/positions", {

              credentials: "include",

            }),

            ]);

        if (

          !employeeRes.ok ||

          !departmentRes.ok ||

          !positionRes.ok

        ) {

          throw new Error("Failed to load dashboard data");

        }

        const [employees, departments, positions] =

          await Promise.all([

            employeeRes.json(),

            departmentRes.json(),

            positionRes.json()

          ]);

        setTotalEmployees(employees.length);

        setActiveEmployees(

          employees.filter(

            (employee) => employee.status === "ACTIVE"

          ).length

        );

        setTotalDepartments(departments.length);

        setTotalPositions(positions.length);

      } catch (error) {

        console.error("Dashboard error:", error);

      }

    };

    fetchDashboardData();

  }, [currentPage, user?.role]);

  // Load Manager Dashboard information

  useEffect(() => {

    if (currentPage !== "dashboard" || user?.role !== "MANAGER") {

      return;

    }

    const fetchManagerDashboard = async () => {

      try {

        const response = await fetch(

          "http://localhost:5000/api/manager-dashboard",

          {

            credentials: "include",

          }

        );

        if (!response.ok) {

          throw new Error("Failed to load Manager Dashboard");

        }

        const data = await response.json();

        setMyTeam(data.myTeam);

        setTeamPresentToday(data.teamPresentToday);

        setPendingLeaveApprovals(data.pendingLeaveApprovals);

// Retrieve every leave entitlement assigned to this Manager for this year.
        // The backend already limits MANAGER accounts to their own records.
        setMyLeaveBalancesError("");
        setMyLeaveBalances(null);

        try {
          const balanceResponse = await fetch(
            "http://localhost:5000/api/leave-balances",
            { credentials: "include" }
          );

          if (!balanceResponse.ok) {
            throw new Error("Failed to load leave balances");
          }

          const balances = await balanceResponse.json();
          if (!Array.isArray(balances)) {
            throw new Error("Invalid leave balance response");
          }

          const currentYear = Number(
            new Intl.DateTimeFormat("en-US", {
              timeZone: "Asia/Kuala_Lumpur",
              year: "numeric",
            }).format(new Date())
          );

          const assignedBalances = balances
            .filter((balance) => Number(balance.year) === currentYear)
            .sort((a, b) =>
              (a.leaveType?.name || "").localeCompare(b.leaveType?.name || "")
            );

          setMyLeaveBalances(assignedBalances);
        } catch (balanceError) {
          console.error("Manager leave balances error:", balanceError);
          setMyLeaveBalancesError("Unable to load leave balances");
          setMyLeaveBalances([]);
        }

      } catch (error) {

        console.error("Manager Dashboard error:", error);

      }

    };

    fetchManagerDashboard();

  }, [currentPage, user?.role]);

if (checkingSession) {

  return <p style={{ padding: "30px" }}>Loading HRMS...</p>;

}

if (!user) {

  return <Login onLoginSuccess={setUser} />;

}

  return (

    <div className={`app ${darkMode ? "dark-mode" : ""}`}>

      {/* SIDEBAR */}

      <aside className="sidebar">

        <h2>HRMS</h2>

        <p>HR Management System</p>

<div

  style={{

    padding: "12px",

    marginTop: "15px",

    marginBottom: "20px",

    backgroundColor: "#334155",

    color: "white",

    borderRadius: "8px",

  }}

>

  <div style={{ fontSize: "12px", opacity: 0.8 }}>

    Logged in as

  </div>

  <div style={{ fontWeight: "bold", marginTop: "5px" }}>

    {user.employeeName}

  </div>

  <div style={{ fontSize: "12px", marginTop: "5px" }}>

    Role: {user.role.replaceAll("_", " ")}

  </div>

</div>

        <nav>

          <button

            type="button"

            className={

              currentPage === "dashboard" ? "active" : ""

            }

            onClick={() => setCurrentPage("dashboard")}

          >

            Dashboard

          </button>

{canManageEmployees && (

  <button

    type="button"

    className={

      [

        "employees",

        "addEmployee",

        "editEmployee"

      ].includes(currentPage)

        ? "active"

        : ""

    }

    onClick={() => setCurrentPage("employees")}

  >

    Employees

  </button>

)}

{canManageEmployees && (

          <button

            type="button"

            className={

              [

                "departments",

                "addDepartment",

                "editDepartment"

              ].includes(currentPage)

                ? "active"

                : ""

            }

            onClick={() => setCurrentPage("departments")}

          >

            Departments

          </button>

)}

{canManageEmployees && (

          <button

            type="button"

            className={

              [

                "positions",

                "addPosition",

                "editPosition"

              ].includes(currentPage)

                ? "active"

                : ""

            }

            onClick={() => setCurrentPage("positions")}

          >

            Positions

          </button>

)}

          <button

            type="button"

            className={

              currentPage === "organizationChart"

                ? "active"

                : ""

            }

            onClick={() => setCurrentPage("organizationChart")}

          >

            Organization Chart

          </button>

          
{isHRAdmin && (
  <button
    type="button"
    className={currentPage === "leaveTypes" ? "active" : ""}
    onClick={() => setCurrentPage("leaveTypes")}
  >
    Leave Management
  </button>
)}


          <button

            type="button"

            className={

              currentPage === "leaveApplications" ? "active" : ""

            }

            onClick={() => setCurrentPage("leaveApplications")}

          >

            Leave Applications

          </button>

          
{isManager && (
  <button
    type="button"
    className={
      currentPage === "managerLeaveApproval" ? "active" : ""
    }
    onClick={() => setCurrentPage("managerLeaveApproval")}
  >
    Manager Approval
  </button>
)}


          <button

  type="button"

  className={

    currentPage === "leaveBalances" ? "active" : ""

  }

  onClick={() => setCurrentPage("leaveBalances")}

>

  Leave Balances

</button>

  <button

  type="button"

  onClick={() => setCurrentPage("attendance")}

  className={currentPage === "attendance" ? "active" : ""}

>

  Attendance

</button>

          
<button
  type="button"
  onClick={() => setCurrentPage("myProfile")}
  className={currentPage === "myProfile" ? "active" : ""}
>
  My Profile
</button>

<button

  type="button"

  onClick={handleLogout}

  style={{

    marginTop: "20px",

    backgroundColor: "#dc2626",

    color: "white",

    border: "none",

    borderRadius: "8px",

    padding: "12px",

    cursor: "pointer",

    width: "100%",

  }}

>

  Logout

</button>

        </nav>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        
<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  }}
>
  <button
    type="button"
    onClick={() => setDarkMode(!darkMode)}
    style={{
      padding: "10px 18px",
      borderRadius: "25px",
      border: "1px solid #D4A017",
      backgroundColor: "#FFFFFF",
      color: "#242424",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
  </button>
</div>


        {currentPage === "employees" ? (

          <Employees

            onAddEmployee={() =>

              setCurrentPage("addEmployee")

            }

            onEditEmployee={(employee) => {

              setSelectedEmployee(employee);

              setCurrentPage("editEmployee");

            }}

          />

        ) : currentPage === "addEmployee" ? (

          <AddEmployee

            onSuccess={() => setCurrentPage("employees")}

            onCancel={() => setCurrentPage("employees")}

          />

        ) : currentPage === "editEmployee" && selectedEmployee ? (

          <EditEmployee

            employee={selectedEmployee}

            onSuccess={() => {

              setSelectedEmployee(null);

              setCurrentPage("employees");

            }}

            onCancel={() => {

              setSelectedEmployee(null);

              setCurrentPage("employees");

            }}

          />

        ) : currentPage === "departments" ? (

          <Departments

            onAddDepartment={() =>

              setCurrentPage("addDepartment")

            }

            onEditDepartment={(department) => {

              setSelectedDepartment(department);

              setCurrentPage("editDepartment");

            }}

          />

        ) : currentPage === "addDepartment" ? (

          <AddDepartment

            onSuccess={() => setCurrentPage("departments")}

            onCancel={() => setCurrentPage("departments")}

          />

        ) : currentPage === "editDepartment" && selectedDepartment ? (

          <EditDepartment

            department={selectedDepartment}

            onSuccess={() => {

              setSelectedDepartment(null);

              setCurrentPage("departments");

            }}

            onCancel={() => {

              setSelectedDepartment(null);

              setCurrentPage("departments");

            }}

          />

        ) : currentPage === "positions" ? (

          <Positions

            onAddPosition={() => setCurrentPage("addPosition")}

            onEditPosition={(position) => {

              setSelectedPosition(position);

              setCurrentPage("editPosition");

            }}

          />

        ) : currentPage === "addPosition" ? (

          <AddPosition

            onSuccess={() => setCurrentPage("positions")}

            onCancel={() => setCurrentPage("positions")}

          />

        ) : currentPage === "editPosition" && selectedPosition ? (

          <EditPosition

            position={selectedPosition}

            onSuccess={() => {

              setSelectedPosition(null);

              setCurrentPage("positions");

            }}

            onCancel={() => {

              setSelectedPosition(null);

              setCurrentPage("positions");

            }}

          />

        ) : currentPage === "organizationChart" ? (

          <OrganizationChart />

        ) : currentPage === "leaveTypes" ? (

          <LeaveTypes />

        ) : currentPage === "leaveApplications" ? (

          <LeaveApplications user={user} />

        ) : currentPage === "managerLeaveApproval" ? (

          <ManagerLeaveApproval user={user} />

        ) : currentPage === "leaveBalances" ? (

          <LeaveBalances user={user} />

        

        ) : currentPage === "attendance" ? (
          <Attendance user={user} />
        ) : currentPage === "myProfile" ? (
          <MyProfile />
        ) : isEmployee ? (
          <EmployeeDashboard user={user} />
        ) : (
        
  // Dashboard for HR_ADMIN and MANAGER
  <>


            <header>

              <h1>HRMS Dashboard</h1>

              <p>Welcome to your HR Management System</p>

            </header>

<div className="dashboard-cards">

{/* MANAGER Dashboard */}

{isManager && (

  <>

    <div className="dashboard-card">

      <h3>My Team</h3>

      <h2>{myTeam}</h2>

    </div>

    <div className="dashboard-card">

      <h3>Team Present Today</h3>

      <h2>{teamPresentToday}</h2>

    </div>

    <div className="dashboard-card">

      <h3>Pending Leave Approvals</h3>

      <h2>{pendingLeaveApprovals}</h2>

    </div>

<div className="dashboard-card">
      <h3>My Leave Balances</h3>
      {myLeaveBalancesError ? (
        <p role="alert">{myLeaveBalancesError}</p>
      ) : myLeaveBalances === null ? (
        <p>Loading leave balances...</p>
      ) : myLeaveBalances.length === 0 ? (
        <p>No leave entitlement assigned for this year.</p>
      ) : (
        <div style={{ marginTop: "12px" }}>
          {myLeaveBalances.map((balance) => (
            <div
              key={balance.id || `${balance.leaveTypeId}-${balance.year}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "10px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span>{balance.leaveType?.name || "Leave"}</span>
              <strong style={{ whiteSpace: "nowrap" }}>
                {balance.remainingDays ?? (balance.entitledDays - balance.usedDays)} Days
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>

  </>

)}

{/* HR_ADMIN Dashboard */}

{isHRAdmin && (

  <>

    <div className="dashboard-card">

      <h3>Total Employees</h3>

      <h2>{totalEmployees}</h2>

    </div>

    <div className="dashboard-card">

      <h3>Active Employees</h3>

      <h2>{activeEmployees}</h2>

    </div>

    <div className="dashboard-card">

      <h3>Departments</h3>

      <h2>{totalDepartments}</h2>

    </div>

    <div className="dashboard-card">

      <h3>Positions</h3>

      <h2>{totalPositions}</h2>

    </div>

  </>

)}

</div>

          </>

        )}

      </main>

    </div>

  );

}

export default App;
