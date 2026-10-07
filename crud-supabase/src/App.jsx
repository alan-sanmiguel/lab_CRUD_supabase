import { useEffect, useState } from "react";
import supabase from "./supabase-client";
import "./App.css";

const filters = ["All tasks", "To do", "Completed"];

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z" /><path d="m19 14 1 2.5 2.5 1-2.5 1L19 21l-1-2.5-2.5-1 2.5-1 1-2.5Z" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function App() {
  const [todoList, setTodoList] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [activeFilter, setActiveFilter] = useState("All tasks");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTodos() {
      const { data, error } = await supabase
        .from("pendientes")
        .select("*")
        .order("id", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setErrorMessage("We couldn’t load your tasks. Please try again.");
      } else {
        setTodoList(data);
      }
      setIsLoading(false);
    }

    loadTodos();
    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = todoList.filter((todo) => todo.isCompleted).length;
  const openCount = todoList.length - completedCount;
  const visibleTodos = todoList.filter((todo) => {
    if (activeFilter === "To do") return !todo.isCompleted;
    if (activeFilter === "Completed") return todo.isCompleted;
    return true;
  });

  const addTodo = async (event) => {
    event.preventDefault();
    const name = newTodo.trim();
    if (!name || isAdding) return;

    setIsAdding(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("pendientes")
      .insert([{ name, isCompleted: false }])
      .select();

    if (error) {
      setErrorMessage("Your task couldn’t be added. Please try again.");
    } else {
      setTodoList((previous) => [data[0], ...previous]);
      setNewTodo("");
    }
    setIsAdding(false);
  };

  const completeTask = async (todo) => {
    setErrorMessage("");
    const { error } = await supabase
      .from("pendientes")
      .update({ isCompleted: !todo.isCompleted })
      .eq("id", todo.id);

    if (error) {
      setErrorMessage("That task couldn’t be updated. Please try again.");
      return;
    }
    setTodoList((previous) =>
      previous.map((item) =>
        item.id === todo.id
          ? { ...item, isCompleted: !todo.isCompleted }
          : item
      )
    );
  };

  const deleteTask = async (id) => {
    setErrorMessage("");
    const { error } = await supabase.from("pendientes").delete().eq("id", id);

    if (error) {
      setErrorMessage("That task couldn’t be deleted. Please try again.");
      return;
    }
    setTodoList((previous) => previous.filter((todo) => todo.id !== id));
  };

  const today = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="Daymark home">
          <span className="brand-mark"><Icon name="check" size={19} /></span>
          <span>daymark</span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#tasks" aria-current="page" aria-label="My tasks">
            <Icon name="grid" />
            <span>My tasks</span>
            <span className="nav-count">{todoList.length}</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon"><Icon name="spark" size={17} /></span>
            <p>A little progress each day adds up to big results.</p>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div className="profile-copy">
              <strong>Your workspace</strong>
              <span>Personal plan</span>
            </div>
            <span className="online-dot" aria-label="Online" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="tasks">
        <header className="topbar">
          <span className="breadcrumb">Workspace <span>/</span> My tasks</span>
          <div className="topbar-date"><span className="date-dot" /> {today}</div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">YOUR PERSONAL SPACE</p>
              <h1>Make room for what matters.</h1>
              <p className="page-subtitle">One step at a time. You’ve got this.</p>
            </div>
            <div className="heading-decoration" aria-hidden="true">
              <span className="decoration-orbit orbit-one" />
              <span className="decoration-orbit orbit-two" />
              <span className="decoration-spark">✳</span>
            </div>
          </div>

          <div className="stats-grid" aria-label="Task summary">
            <article className="stat-card stat-total">
              <span className="stat-label">Total tasks</span>
              <div className="stat-value-row"><strong>{todoList.length}</strong><span className="stat-icon"><Icon name="grid" /></span></div>
              <span className="stat-caption">Everything on your list</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">To do</span>
              <div className="stat-value-row"><strong>{openCount}</strong><span className="stat-icon stat-icon-warm"><span className="status-ring" /></span></div>
              <span className="stat-caption">Ready when you are</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Completed</span>
              <div className="stat-value-row"><strong>{completedCount}</strong><span className="stat-icon stat-icon-green"><Icon name="check" /></span></div>
              <span className="stat-caption">Look how far you’ve come</span>
            </article>
          </div>

          <section className="tasks-card" aria-labelledby="tasks-heading">
            <div className="tasks-card-header">
              <div>
                <h2 id="tasks-heading">Your tasks</h2>
                <p>Keep your day moving forward.</p>
              </div>
              <span className="task-total-pill">{openCount} remaining</span>
            </div>

            <form className="add-task-form" onSubmit={addTodo}>
              <span className="input-icon"><Icon name="plus" size={20} /></span>
              <input
                type="text"
                aria-label="New task"
                placeholder="What needs to get done?"
                value={newTodo}
                onChange={(event) => setNewTodo(event.target.value)}
                maxLength={200}
              />
              <button className="add-button" type="submit" disabled={!newTodo.trim() || isAdding}>
                <Icon name="plus" size={17} />
                <span>{isAdding ? "Adding..." : "Add task"}</span>
              </button>
            </form>

            <div className="list-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
                {filters.map((filter) => (
                  <button
                    className={`filter-tab${activeFilter === filter ? " selected" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === filter}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                    {filter === "All tasks" && <span className="filter-count">{todoList.length}</span>}
                  </button>
                ))}
              </div>
              <span className="list-date">{today}</span>
            </div>

            {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}

            {isLoading ? (
              <div className="loading-state" role="status">Loading your tasks...</div>
            ) : visibleTodos.length > 0 ? (
              <ul className="task-list">
                {visibleTodos.map((todo) => (
                  <li className={`task-row${todo.isCompleted ? " completed" : ""}`} key={todo.id}>
                    <button
                      className="task-check"
                      type="button"
                      aria-label={todo.isCompleted ? `Mark ${todo.name} as to do` : `Complete ${todo.name}`}
                      onClick={() => completeTask(todo)}
                    >
                      {todo.isCompleted && <Icon name="check" size={15} />}
                    </button>
                    <span className="task-name">{todo.name}</span>
                    <span className={`task-status${todo.isCompleted ? " status-complete" : ""}`}>
                      <span />{todo.isCompleted ? "Completed" : "In progress"}
                    </span>
                    <button
                      className="delete-button"
                      type="button"
                      aria-label={`Delete ${todo.name}`}
                      onClick={() => deleteTask(todo.id)}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><Icon name={activeFilter === "Completed" ? "check" : "spark"} size={25} /></div>
                <h3>{activeFilter === "All tasks" ? "A fresh start" : `No ${activeFilter.toLowerCase()} tasks`}</h3>
                <p>{activeFilter === "All tasks" ? "Add your first task above and make today count." : "There’s nothing here right now. Enjoy the breathing room."}</p>
              </div>
            )}

            <footer className="tasks-card-footer">
              <span><span className="footer-check"><Icon name="check" size={12} /></span> Small steps, big momentum.</span>
              <span>{completedCount} of {todoList.length} completed</span>
            </footer>
          </section>
          <p className="page-footer">Made for a more focused day <span>✳</span></p>
        </section>
      </main>
    </div>
  );
}

export default App;
