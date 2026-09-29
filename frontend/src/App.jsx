import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileWarning,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import "./App.css";

const seedIncidents = [
  {
    code: "INC-024",
    title: "Payment API Latency",
    service: "payments-api",
    severity: "HIGH",
    type: "high",
    status: "Investigating",
    age: "12m ago",
    impact: "Checkout p95 at 4.8s",
    lesson: "DB pool exhaustion caused repeated API latency.",
  },
  {
    code: "INC-023",
    title: "Auth Service Timeout",
    service: "auth-gateway",
    severity: "MEDIUM",
    type: "medium",
    status: "Mitigating",
    age: "41m ago",
    impact: "Login retries up 22%",
    lesson: "Stale cache caused authentication slowdown.",
  },
  {
    code: "INC-022",
    title: "Order Service Failure",
    service: "order-worker",
    severity: "HIGH",
    type: "high",
    status: "Watching",
    age: "2h ago",
    impact: "Failed order writes in US-East",
    lesson:
      "Restarting workers did not resolve DB connection exhaustion.",
  },
  {
    code: "INC-021",
    title: "Cache Stampede",
    service: "session-cache",
    severity: "LOW",
    type: "low",
    status: "Resolved",
    age: "Yesterday",
    impact: "Brief dashboard lag",
    lesson: "Warm the cache before traffic spikes.",
  },
];

const navItems = [
  { id: "dashboard", label: "Command Center", icon: Activity },
  { id: "incidents", label: "Incidents", icon: FileWarning },
  { id: "memory", label: "Hindsight", icon: Brain },
];

const emptyForm = {
  title: "",
  service: "",
  severity: "HIGH",
  impact: "",
};

function App() {
  const [view, setView] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(seedIncidents);
  const [selectedCode, setSelectedCode] = useState(
    seedIncidents[0].code
  );
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);

    return () => clearInterval(timer);
  }, []);

useEffect(() => {
  const loadIncidents = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/incidents"
      );

      if (!response.ok) {
        throw new Error("Failed to load incidents");
      }

      const data = await response.json();

      if (Array.isArray(data.incidents)) {
        setItems(data.incidents);

        if (data.incidents.length > 0) {
          setSelectedCode(data.incidents[0].code);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load incidents:",
        error
      );
    }
  };

  loadIncidents();
}, []);

  const selected =
    items.find((item) => item.code === selectedCode) ?? items[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) =>
      `${item.code} ${item.title} ${item.service} ${item.lesson}`
        .toLowerCase()
        .includes(q)
    );
  }, [items, query]);

  const stats = useMemo(() => {
    const active = items.filter(
      (item) => item.status !== "Resolved"
    );

    const high = active.filter(
      (item) => item.type === "high"
    ).length;

    const resolved = items.filter(
      (item) => item.status === "Resolved"
    ).length;

    const services = new Set(
      items.map((item) => item.service)
    ).size;

    return {
      active: active.length,
      high,
      resolved,
      remembered: items.length,
      lessons: items.length,
      services,
    };
  }, [items]);

  const openForm = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  // NEW INCIDENT → BACKEND → HINDSIGHT → GROQ
  const submitIncident = async (event) => {
    event.preventDefault();

    const incident = {
      problem: form.title.trim(),
      service: form.service.trim(),
      severity: form.severity,
      type: form.severity.toLowerCase(),
      impact: form.impact.trim(),
      result: form.impact.trim(),
    };

    try {
      // STEP 1: Store incident in Hindsight
      const storeResponse = await fetch(
        "http://localhost:5000/api/incidents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(incident),
        }
      );

      if (!storeResponse.ok) {
        const errorData = await storeResponse.text();

        throw new Error(
          `Failed to store incident: ${errorData}`
        );
      }
      const storeData= await storeResponse.json();

      // STEP 2: Recall similar incidents + get AI analysis
      const investigateResponse = await fetch(
        "http://localhost:5000/api/incidents/investigate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(incident),
        }
      );

      if (!investigateResponse.ok) {
        const errorData =
          await investigateResponse.text();

        throw new Error(
          `Failed to investigate incident: ${errorData}`
        );
      }

      const investigation =
        await investigateResponse.json();

      // STEP 3: Generate next incident code
      

      const type = form.severity.toLowerCase();

      // STEP 4: Create incident for the UI
      const created = {
        code: storeData.incident.code,
        title: form.title.trim(),
        service: form.service.trim(),
        severity: form.severity,
        type,
        status: "Investigating",
        age: "Just now",
        impact: form.impact.trim(),

        // Groq AI response
        lesson:
          investigation?.analysis?.analysis ||
          "No AI analysis available yet.",

        // Keep backend results for later use
        analysis: investigation?.analysis,
        memories: investigation?.similarIncidents,
      };

      // STEP 5: Add to UI
      setItems((current) => [created, ...current]);

      setSelectedCode(created.code);

      setShowForm(false);

      setView("incidents");

      setToast(
        `${created.code} captured. Hindsight recalled similar experience.`
      );
    } catch (error) {
      console.error(
        "Incident submission failed:",
        error
      );

      setToast(
        "Failed to connect to WorkMemory backend."
      );
    }
  };

  const resolveSelected = () => {
    if (!selected || selected.status === "Resolved") {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.code === selected.code
          ? {
              ...item,
              status: "Resolved",
            }
          : item
      )
    );

    setToast(
      `${selected.code} marked resolved and stored as a lesson.`
    );
  };
  const handleDelete = async (code) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${code}?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/incidents/${code}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      throw new Error(
        `Failed to delete incident: ${errorData}`
      );
    }

    setItems((current) =>
      current.filter(
        (item) => item.code !== code
      )
    );

    if (selectedCode === code) {
      const remaining = items.filter(
        (item) => item.code !== code
      );

      setSelectedCode(
        remaining.length > 0
          ? remaining[0].code
          : ""
      );
    }

    setToast(`${code} deleted successfully.`);
  } catch (error) {
    console.error(
      "Incident deletion failed:",
      error
    );

    setToast(
      "Failed to delete incident."
    );
  }
};

  return (
    <div className="app">
      <div className="orb orb-a" />
      <div className="orb orb-b" />

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Brain size={22} />
          </div>

          <div>
            <h1>WorkMemory</h1>
            <p>Organizational hindsight</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${
                  view === item.id ? "active" : ""
                }`}
                onClick={() => setView(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          className="ghost-button"
          onClick={openForm}
        >
          <Plus size={16} />
          New incident
        </button>

        <div className="engineer">
          <div className="avatar">B</div>

          <div>
            <strong>Sahasra</strong>
            <span>On-call engineer</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">LIVE OPERATIONS</p>

            <h2>
              {view === "dashboard" &&
                "Engineering ops, with memory"}

              {view === "incidents" &&
                "Active and recent incidents"}

              {view === "memory" &&
                "What the org already learned"}
            </h2>
          </div>

          <div className="top-actions">
            <label className="search">
              <Search size={16} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search incidents, services..."
              />
            </label>

            <div className="online-status">
              <span />

              {clock.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </header>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <section className="stats-grid">
              <StatCard
                icon={<FileWarning size={20} />}
                title="Active incidents"
                value={String(stats.active)}
                subtitle={`${stats.high} high priority`}
                color="red"
              />

              <StatCard
                icon={<CheckCircle2 size={20} />}
                title="Resolved"
                value={String(stats.resolved)}
                subtitle="Closed and remembered"
                color="green"
              />

              <StatCard
                icon={<Brain size={20} />}
                title="Experiences stored"
                value={String(stats.remembered)}
                subtitle="Hindsight memory bank"
                color="purple"
              />

              <StatCard
                icon={<Sparkles size={20} />}
                title="Lessons learned"
                value={String(stats.lessons)}
                subtitle={`Across ${stats.services} services`}
                color="blue"
              />
            </section>

            <section className="content-grid">
              <IncidentPanel
                items={filtered}
                selected={selected}
                onSelect={(item) =>
                  setSelectedCode(item.code)
                }
                onCreate={openForm}
                onDelete={handleDelete}
              />

              <InsightPanel
                selected={selected}
                onResolve={resolveSelected}
              />
            </section>
          </>
        )}

        {/* INCIDENTS */}
        {view === "incidents" && (
          <section className="content-grid">
            <IncidentPanel
              items={filtered}
              selected={selected}
              onSelect={(item) =>
                setSelectedCode(item.code)
              }
              onCreate={openForm}
              onDelete={handleDelete}
              expanded
            />

            <InsightPanel
              selected={selected}
              onResolve={resolveSelected}
            />
          </section>
        )}

        {/* MEMORY */}
        {view === "memory" && (
          <section className="memory-grid">
            {filtered.map((item) => (
              <article
                className="memory-card"
                key={item.code}
              >
                <div className="memory-meta">
                  <span
                    className={`severity ${item.type}`}
                  >
                    {item.severity}
                  </span>

                  <span>{item.service}</span>
                </div>

                <h3>{item.title}</h3>

                <p>{item.lesson}</p>
              </article>
            ))}

            {filtered.length === 0 && (
              <p className="empty">
                No lessons match that search.
              </p>
            )}
          </section>
        )}

        {/* MEMORY BANNER */}
        <section className="memory-banner">
          <div className="banner-icon">
            <Brain size={26} />
          </div>

          <div className="banner-content">
            <h3>
              Don’t just remember incidents. Remember what
              was learned.
            </h3>

            <p>
              WorkMemory retrieves prior experiences,
              outcomes, risks, and lessons before engineers
              repeat costly mistakes.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openForm}
          >
            Report incident
            <ChevronRight size={16} />
          </button>
        </section>
      </main>

      {/* NEW INCIDENT MODAL */}
      {showForm && (
        <div
          className="overlay"
          onClick={() => setShowForm(false)}
        >
          <form
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            onSubmit={submitIncident}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">NEW SIGNAL</p>

                <h3>Report an incident</h3>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setShowForm(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <label>
              Title

              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                placeholder="What broke?"
              />
            </label>

            <label>
              Service

              <input
                required
                value={form.service}
                onChange={(event) =>
                  setForm({
                    ...form,
                    service: event.target.value,
                  })
                }
                placeholder="payments-api"
              />
            </label>

            <fieldset className="severity-picker">
              <legend>Severity</legend>

              {["HIGH", "MEDIUM", "LOW"].map(
                (level) => (
                  <label
                    key={level}
                    className={
                      form.severity === level
                        ? "on"
                        : ""
                    }
                  >
                    <input
                      type="radio"
                      name="severity"
                      value={level}
                      checked={
                        form.severity === level
                      }
                      onChange={() =>
                        setForm({
                          ...form,
                          severity: level,
                        })
                      }
                    />

                    {level}
                  </label>
                )
              )}
            </fieldset>

            <label>
              What happened

              <textarea
                required
                rows="4"
                value={form.impact}
                onChange={(event) =>
                  setForm({
                    ...form,
                    impact: event.target.value,
                  })
                }
                placeholder="Symptoms, blast radius, first guess..."
              />
            </label>

            <button
              className="primary-button"
              type="submit"
            >
              Capture in memory
              <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}

/* INCIDENT PANEL */
function IncidentPanel({
  items,
  selected,
  onSelect,
  onCreate,
  expanded,
  onDelete,
}) {
  return (
    <div
      className={`panel ${
        expanded ? "expanded" : ""
      }`}
    >
      <div className="panel-header">
        <div>
          <p className="eyebrow">LIVE QUEUE</p>

          <h3>Recent incidents</h3>
        </div>

        <button
          className="text-button"
          onClick={onCreate}
        >
          <Plus size={16} />
          New
        </button>
      </div>

      <div className="incident-list">
        {items.map((incident) => (
          <div
            className={`incident-row ${
              selected?.code === incident.code
                ? "selected"
                : ""
            }`}
            key={incident.code}
            onClick={() => onSelect(incident)}
          >
            <div
              className={`warning-icon ${incident.type}`}
            >
              <AlertTriangle size={16} />
            </div>

            <div className="incident-details">
              <strong>
                {incident.code} · {incident.title}
              </strong>

              <span>
                {incident.service} · {incident.age} ·{" "}
                {incident.status}
              </span>
            </div>

            <span
              className={`severity ${incident.type}`}
            >
              {incident.severity}
            </span>

            <button
              className="delete-button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(incident.code);
              }}
              title="Delete incident"
            >
              <X size={15} />
            </button>

            <ChevronRight
              size={16}
              className="arrow"
            />
          </div>
        ))}

        {items.length === 0 && (
          <p className="empty">
            No incidents match that search.
          </p>
        )}
      </div>
    </div>
  );
}

/* INSIGHT PANEL */
function InsightPanel({ selected, onResolve }) {
  if (!selected) {
    return (
      <div className="panel insight">
        <p className="empty">
          Select an incident to see hindsight.
        </p>
      </div>
    );
  }

  return (
    <div className="panel insight">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            HINDSIGHT MATCH
          </p>

          <h3>{selected.code}</h3>
        </div>

        <Clock3 size={18} />
      </div>

      <div className="insight-body">
        <p className="insight-kicker">
          {selected.status}
        </p>

        <h4>{selected.title}</h4>

        <p>{selected.impact}</p>

        <div className="lesson">
          <CheckCircle2 size={16} />

          <p
            style={{
              whiteSpace: "pre-line",
            }}
          >
            {selected.lesson}
          </p>
        </div>

        {selected.status !== "Resolved" && (
          <button
            className="primary-button resolve"
            onClick={onResolve}
          >
            Mark resolved
          </button>
        )}
      </div>
    </div>
  );
}

/* STAT CARD */
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">
        {icon}
      </div>

      <p>{title}</p>

      <h3>{value}</h3>

      <span>{subtitle}</span>
    </div>
  );
}

export default App;