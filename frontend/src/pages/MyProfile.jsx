
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/my-profile`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile."
          );
        }

        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Profile error:", err);

        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-MY", {
      timeZone: "UTC",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "20px",
  };

  const detailStyle = {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
  };

  const labelStyle = {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "6px",
  };

  const valueStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  };

  if (loading) {
    return <p>Loading your profile...</p>;
  }

  if (error) {
    return (
      <div>
        <h1>My Profile</h1>
        <p style={{ color: "#b42318" }}>
          {error}
        </p>
      </div>
    );
  }

  if (!profile) {
    return <p>Employee profile not found.</p>;
  }

  const details = [
    {
      label: "Employee ID",
      value: profile.employeeNo,
    },
    {
      label: "Full Name",
      value: profile.name,
    },
    {
      label: "Email Address",
      value: profile.email,
    },
    {
      label: "Department",
      value: profile.department?.name,
    },
    {
      label: "Position",
      value: profile.position?.name,
    },
    {
      label: "Joining Date",
      value: formatDate(profile.joinDate),
    },
    {
      label: "Reporting Manager",
      value: profile.manager?.name || "Not Assigned",
    },
    {
      label: "Employment Status",
      value: profile.status,
    },
  ];

  return (
    <div>
      <h1>My Profile</h1>

      <p style={{ color: "#64748b" }}>
        View your personal employment information.
      </p>

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            paddingBottom: "22px",
            marginBottom: "22px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "65px",
              height: "65px",
              borderRadius: "50%",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "bold",
            }}
          >
            {profile.name?.charAt(0)?.toUpperCase() || "E"}
          </div>

          <div>
            <h2 style={{ margin: "0 0 6px" }}>
              {profile.name}
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              {profile.position?.name || "Employee"}
            </p>

            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              {profile.employeeNo}
            </p>
          </div>
        </div>

        <h3>Employment Information</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {details.map((detail) => (
            <div
              key={detail.label}
              style={detailStyle}
            >
              <div style={labelStyle}>
                {detail.label}
              </div>

              <div style={valueStyle}>
                {detail.value || "-"}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: "24px",
            marginBottom: 0,
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          This information is managed by HR.
          Contact HR if any details need updating.
        </p>
      </div>
    </div>
  );
}

export default MyProfile;
