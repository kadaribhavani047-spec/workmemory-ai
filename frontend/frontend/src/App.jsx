import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  Plus,
  Sparkles,
} from "lucide-react";
import "./App.css";

const recentIncidents = [
  {
    code: "INC-024",
    title: "Payment API Latency",
    severity: "HIGH",
    type: "high",
  },
  {
    code: "INC-023",
    title: "Auth Service Timeout",
    severity: "MEDIUM",
    type: "medium",
  },
  {
    code: "INC-022",
    title: "Order Service Failure",
    severity: "HIGH",
    type: "high",
  },
];

function App() {
  const [message, setMessage] = useState("");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Brain size={24} />
          </div>

          <div>
            <h1>WorkMemory</h1>
            <p>Organizational Hindsight</p>
          </div>
        </div>

        <div className="nav-item active">
          <Activity size={19} />
          Dashboard
        </div>

        <button
          className="nav-item"
          onClick={() => setMessage("New Incident screen will be added next.")}
        >
          <Plus size={19} />
          New Incident
        </button>

        <div className="engineer">
          <div className="avatar">B</div>
          <div>
            <strong>Sahasra</strong>
            <span>Engineer</span>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">INCIDENT RESPONSE PLATFORM</p>
            <h2>Engineering operations, with memory</h2>
          </div>

          <div className="online-status">
            <span />
            System online
          </div>
        </header>

        {message && <div className="message">{message}</div>}

        <section className="stats-grid">
          <StatCard
            icon={<FileWarning size={22} />}
            title="Active Incidents"
            value="4"
            subtitle="2 high priority"
            color="red"
          />
          <StatCard
            icon={<CheckCircle2 size={22} />}
            title="Resolved This Month"
            value="12"
            subtitle="+18% from last month"
            color="green"
          />
          <StatCard
            icon={<Brain size={22} />}
            title="Experiences Remembered"
            value="86"
            subtitle="Hindsight memory bank"
            color="purple"
          />
          <StatCard
            icon={<Sparkles size={22} />}
            title="Lessons Learned"
            value="43"
            subtitle="Across 8 services"
            color="blue"
          />
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">LIVE OPERATIONS</p>
                <h3>Recent incidents</h3>
              </div>

              <button
                className="text-button"
                onClick={() => setMessage("New Incident screen will be added next.")}
              >
                <Plus size={17} />
                New Incident
              </button>
            </div>

            <div className="incident-list">
              {recentIncidents.map((incident) => (
                <div className="incident-row" key={incident.code}>
                  <div className="warning-icon">
                    <AlertTriangle size={19} />
                  </div>

                  <div className="incident-details">
                    <strong>{incident.code}</strong>
                    <span>{incident.title}</span>
                  </div>

                  <span className={`severity ${incident.type}`}>
                    {incident.severity}
                  </span>

                  <ChevronRight size={19} className="arrow" />
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">HINDSIGHT INSIGHTS</p>
                <h3>Recent organizational lessons</h3>
              </div>

              <Brain size={24} className="brain-small" />
            </div>

            <div className="lesson-list">
              <Lesson text="DB pool exhaustion caused repeated API latency." />
              <Lesson text="Restarting workers did not resolve DB connection exhaustion." />
              <Lesson text="Stale cache caused authentication slowdown." />
            </div>
          </div>
        </section>

        <section className="memory-banner">
          <div className="banner-icon">
            <Brain size={28} />
          </div>

          <div className="banner-content">
            <h3>Don’t just remember incidents. Remember what was learned.</h3>
            <p>
              WorkMemory retrieves prior experiences, outcomes, risks, and lessons
              before engineers repeat costly mistakes.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setMessage("Click works! Create Incident screen is the next step.")}
          >
            Report Incident
            <ChevronRight size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <p>{title}</p>
      <h3>{value}</h3>
      <span>{subtitle}</span>
    </div>
  );
}

function Lesson({ text }) {
  return (
    <div className="lesson">
      <CheckCircle2 size={18} />
      <p>{text}</p>
    </div>
  );
}

export default App;