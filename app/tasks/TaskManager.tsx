"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "CLOSED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  closedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    city: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  evidencesCount: number;
};

type TaskEvidenceItem = {
  id: string;
  type: "COMMENT" | "PHOTO" | "FILE" | "LOCATION";
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

type ClientOption = {
  id: string;
  name: string;
  branches: {
    id: string;
    name: string;
    city: string | null;
  }[];
};

type UserOption = {
  id: string;
  name: string;
  role: string;
};

type TaskManagerProps = {
  initialTasks: TaskItem[];
  clients: ClientOption[];
  users: UserOption[];
  headerAction?: ReactNode;
};

type ApiTaskResponse = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  closedAt: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    city: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  evidences?: unknown[];
};

type ApiEvidenceResponse = {
  id: string;
  type: "COMMENT" | "PHOTO" | "FILE" | "LOCATION";
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

const statusLabels: Record<TaskStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  BLOCKED: "Bloqueado",
  CLOSED: "Cerrado",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const allowedStatusTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["BLOCKED", "CLOSED"],
  BLOCKED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

function getStatusClass(status: TaskStatus) {
  switch (status) {
    case "PENDING":
      return "bg-slate-100 text-slate-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "BLOCKED":
      return "bg-yellow-100 text-yellow-800";
    case "CLOSED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function getPriorityClass(priority: TaskPriority) {
  switch (priority) {
    case "LOW":
      return "bg-slate-100 text-slate-700";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "CRITICAL":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function isOverdue(task: TaskItem) {
  return task.status !== "CLOSED" && new Date(task.dueDate) < new Date();
}

export function TaskManager({ initialTasks, clients, users, headerAction, }: TaskManagerProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | TaskPriority>(
    "ALL"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [evidences, setEvidences] = useState<TaskEvidenceItem[]>([]);
  const [evidenceComment, setEvidenceComment] = useState("");
  const [evidenceUserId, setEvidenceUserId] = useState(users[0]?.id ?? "");
  const [isLoadingEvidences, setIsLoadingEvidences] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: clients[0]?.id ?? "",
    branchId: clients[0]?.branches[0]?.id ?? "",
    assignedToId: users[0]?.id ?? "",
    priority: "MEDIUM" as TaskPriority,
    dueDate: "",
  });

  const selectedClient = clients.find((client) => client.id === form.clientId);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

const filteredTasks = useMemo(() => {
  return tasks
    .filter((task) => {
      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;

      return matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      const priorityWeight: Record<TaskPriority, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      const priorityDifference =
        priorityWeight[b.priority] - priorityWeight[a.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}, [tasks, statusFilter, priorityFilter]);

  const dashboard = useMemo(() => {
    return {
      total: tasks.length,
      open: tasks.filter((task) => task.status !== "CLOSED").length,
      overdue: tasks.filter((task) => isOverdue(task)).length,
      critical: tasks.filter(
        (task) => task.priority === "CRITICAL" && task.status !== "CLOSED"
      ).length,
      closed: tasks.filter((task) => task.status === "CLOSED").length,
    };
  }, [tasks]);

  async function refreshTasks() {
    const response = await fetch("/api/tasks", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("No se pudieron refrescar las tareas");
    }

    const result: { data: ApiTaskResponse[] } = await response.json();

    const normalizedTasks: TaskItem[] = result.data.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      closedAt: task.closedAt,
      createdAt: task.createdAt,
      client: {
        id: task.client.id,
        name: task.client.name,
      },
      branch: {
        id: task.branch.id,
        name: task.branch.name,
        city: task.branch.city,
      },
      assignedTo: {
        id: task.assignedTo.id,
        name: task.assignedTo.name,
        role: task.assignedTo.role,
      },
      evidencesCount: task.evidences?.length ?? 0,
    }));

    setTasks(normalizedTasks);
  }

  async function loadEvidences(taskId: string) {
    setSelectedTaskId(taskId);
    setEvidences([]);
    setIsLoadingEvidences(true);
    setMessage("Cargando evidencias de la tarea seleccionada...");

    setTimeout(() => {
      document.getElementById("evidence-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    try {
      const response = await fetch(`/api/tasks/${taskId}/evidences`, {
        cache: "no-store",
      });

      const result: { data?: ApiEvidenceResponse[]; error?: string } =
        await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudieron cargar las evidencias.");
        return;
      }

      const normalizedEvidences: TaskEvidenceItem[] = (result.data ?? []).map(
        (evidence) => ({
          id: evidence.id,
          type: evidence.type,
          comment: evidence.comment,
          createdAt: evidence.createdAt,
          user: {
            id: evidence.user.id,
            name: evidence.user.name,
            role: evidence.user.role,
          },
        })
      );

      setEvidences(normalizedEvidences);
      setMessage(
        `Evidencias cargadas correctamente. Total: ${normalizedEvidences.length}`
      );
    } catch (error) {
      console.error(error);
      setMessage(
        "Error inesperado cargando evidencias. Revisá la consola del navegador."
      );
    } finally {
      setIsLoadingEvidences(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (!form.dueDate) {
        setMessage("Debe seleccionar una fecha límite.");
        return;
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          clientId: form.clientId,
          branchId: form.branchId,
          assignedToId: form.assignedToId,
          priority: form.priority,
          dueDate: new Date(form.dueDate).toISOString(),
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo crear la tarea.");
        return;
      }

      setMessage("Tarea creada correctamente.");

      setForm({
        title: "",
        description: "",
        clientId: clients[0]?.id ?? "",
        branchId: clients[0]?.branches[0]?.id ?? "",
        assignedToId: users[0]?.id ?? "",
        priority: "MEDIUM",
        dueDate: "",
      });

      await refreshTasks();
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado creando la tarea.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChangeStatus(taskId: string, nextStatus: TaskStatus) {
    setMessage(null);
    if (nextStatus === "CLOSED") {
      const confirmed = window.confirm(
        "¿Confirmás que querés cerrar esta tarea? Esta acción registrará la fecha de cierre."
      );

      if (!confirmed) {
        return;
      }
    } 

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo actualizar la tarea.");
        return;
      }

      setMessage("Estado actualizado correctamente.");
      await refreshTasks();

      if (selectedTaskId === taskId) {
        await loadEvidences(taskId);
      }
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado actualizando la tarea.");
    }
  }

  async function handleCreateEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTaskId) {
      setMessage("Debe seleccionar una tarea.");
      return;
    }

    setMessage(null);

    try {
      const response = await fetch(`/api/tasks/${selectedTaskId}/evidences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: evidenceUserId,
          comment: evidenceComment,
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo crear la evidencia.");
        return;
      }

      setEvidenceComment("");
      setMessage("Evidencia agregada correctamente.");

      await loadEvidences(selectedTaskId);
      await refreshTasks();
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado creando evidencia.");
    }
  }

  function handleClientChange(clientId: string) {
    const client = clients.find((item) => item.id === clientId);

    setForm((current) => ({
      ...current,
      clientId,
      branchId: client?.branches[0]?.id ?? "",
    }));
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Gestión de tareas operativas
            </h1>
            <p className="mt-2 text-slate-600">
              Sprint 6: tareas protegidas con autenticación.
            </p>
          </div>

          {headerAction && <div>{headerAction}</div>}
        </header>

        <section className="grid gap-4 md:grid-cols-5">
          <DashboardCard title="Total" value={dashboard.total} />
          <DashboardCard title="Abiertas" value={dashboard.open} />
          <DashboardCard title="Vencidas" value={dashboard.overdue} />
          <DashboardCard title="Críticas" value={dashboard.critical} />
          <DashboardCard title="Cerradas" value={dashboard.closed} />
        </section>

        {message && (
          <div className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-800">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={handleCreateTask}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Crear tarea
            </h2>

            <div className="space-y-4">
              <Field label="Título">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  required
                  minLength={3}
                  placeholder="Ej: Revisar UPS monitoreada"
                />
              </Field>

              <Field label="Descripción">
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Detalle operativo de la tarea"
                />
              </Field>

              <Field label="Cliente">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.clientId}
                  onChange={(event) => handleClientChange(event.target.value)}
                  required
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sucursal">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.branchId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      branchId: event.target.value,
                    }))
                  }
                  required
                >
                  {selectedClient?.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                      {branch.city ? ` - ${branch.city}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Responsable">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.assignedToId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      assignedToId: event.target.value,
                    }))
                  }
                  required
                >
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Prioridad">
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </Field>

              <Field label="Fecha límite">
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creando..." : "Crear tarea"}
              </button>
            </div>
          </form>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Tareas
                </h2>
                <p className="text-sm text-slate-500">
                  {filteredTasks.length} tarea(s) visibles
                </p>
              </div>

              <div className="flex gap-3">
                <Field label="Estado">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as "ALL" | TaskStatus)
                    }
                  >
                    <option value="ALL">Todos</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROGRESS">En proceso</option>
                    <option value="BLOCKED">Bloqueado</option>
                    <option value="CLOSED">Cerrado</option>
                  </select>
                </Field>

                <Field label="Prioridad">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(
                        event.target.value as "ALL" | TaskPriority
                      )
                    }
                  >
                    <option value="ALL">Todas</option>
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-3">Tarea</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Sucursal</th>
                    <th className="px-3 py-3">Responsable</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Prioridad</th>
                    <th className="px-3 py-3">Vence</th>
                    <th className="px-3 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => {
                    const nextStatuses = allowedStatusTransitions[task.status];

                    return (
                      <tr
                        key={task.id}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-slate-950">
                            {task.title}
                          </div>

                          {task.description && (
                            <div className="mt-1 max-w-xs text-xs text-slate-500">
                              {task.description}
                            </div>
                          )}

                          {task.evidencesCount > 0 && (
                            <div className="mt-1 text-xs text-slate-400">
                              Evidencias: {task.evidencesCount}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {task.client.name}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {task.branch.name}
                          {task.branch.city && (
                            <div className="text-xs text-slate-400">
                              {task.branch.city}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          {task.assignedTo.name}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(
                              task.status
                            )}`}
                          >
                            {statusLabels[task.status]}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityClass(
                              task.priority
                            )}`}
                          >
                            {priorityLabels[task.priority]}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-slate-700">
                          <div>{formatDate(task.dueDate)}</div>

                          {isOverdue(task) && (
                            <div className="mt-1 text-xs font-semibold text-red-600">
                              Vencida
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => loadEvidences(task.id)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Evidencias
                            </button>

                            {nextStatuses.length === 0 && (
                              <span className="text-xs text-slate-400">
                                Sin acciones
                              </span>
                            )}

                            {nextStatuses.map((nextStatus) => (
                              <button
                                key={nextStatus}
                                type="button"
                                onClick={() =>
                                  handleChangeStatus(task.id, nextStatus)
                                }
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                              >
                                Pasar a {statusLabels[nextStatus]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredTasks.length === 0 && (
              <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                No hay tareas con los filtros seleccionados.
              </div>
            )}

            {selectedTaskId && (
              <section
                id="evidence-panel"
                className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Evidencias de la tarea
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedTask
                        ? selectedTask.title
                        : "Comentarios y trazabilidad operativa."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(null);
                      setEvidences([]);
                      setEvidenceComment("");
                      setMessage(null);
                    }}
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white"
                  >
                    Cerrar panel
                  </button>
                </div>

                <form
                  onSubmit={handleCreateEvidence}
                  className="mb-4 grid gap-3 md:grid-cols-[220px_1fr_auto]"
                >
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    value={evidenceUserId}
                    onChange={(event) => setEvidenceUserId(event.target.value)}
                    required
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    value={evidenceComment}
                    onChange={(event) => setEvidenceComment(event.target.value)}
                    placeholder="Escribir comentario de evidencia"
                    required
                    minLength={3}
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Agregar
                  </button>
                </form>

                {isLoadingEvidences && (
                  <div className="text-sm text-slate-500">
                    Cargando evidencias...
                  </div>
                )}

                {!isLoadingEvidences && evidences.length === 0 && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Esta tarea todavía no tiene evidencias.
                  </div>
                )}

                <div className="space-y-3">
                  {evidences.map((evidence) => (
                    <article
                      key={evidence.id}
                      className="rounded-lg border border-slate-200 bg-white p-3"
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm font-semibold text-slate-900">
                          {evidence.user.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatDate(evidence.createdAt)}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-slate-700">
                        {evidence.comment}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function DashboardCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}