"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "BLOCKED" | "CLOSED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type EvidenceType = "COMMENT" | "PHOTO" | "FILE" | "LOCATION";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "TECHNICIAN";
};

type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type TaskDetailItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  evidences: {
    id: string;
    type: EvidenceType;
    comment: string | null;
    fileUrl: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }[];
};

type TaskDetailProps = {
  task: TaskDetailItem;
  users: UserOption[];
  currentUser: CurrentUser;
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

function formatDate(dateValue: string) {
  const date = new Date(dateValue);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const period = hours >= 12 ? "p. m." : "a. m.";
  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return `${day}/${month}/${year}, ${hours}:${minutes} ${period}`;
}

function toDateTimeLocalValue(dateValue: string) {
  const date = new Date(dateValue);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 16);
}

function isOverdue(task: TaskDetailItem) {
  return task.status !== "CLOSED" && new Date(task.dueDate) < new Date();
}

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

export function TaskDetail({ task, users, currentUser }: TaskDetailProps) {
  const router = useRouter();

  const canEditTask =
    currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";

  const [message, setMessage] = useState<string | null>(null);
  const [evidenceComment, setEvidenceComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    assignedToId: task.assignedTo.id,
    dueDate: toDateTimeLocalValue(task.dueDate),
  });

  const nextStatuses = allowedStatusTransitions[task.status];

  async function handleChangeStatus(nextStatus: TaskStatus) {
    setMessage(null);

    if (nextStatus === "CLOSED") {
      const confirmed = window.confirm(
        "¿Confirmás que querés cerrar esta tarea? Esta acción registrará la fecha de cierre."
      );

      if (!confirmed) {
        return;
      }
    }

    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
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
        setMessage(result.error ?? "No se pudo actualizar el estado.");
        return;
      }

      setMessage("Estado actualizado correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado actualizando el estado.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleCreateEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setIsCreatingEvidence(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}/evidences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: evidenceComment,
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo agregar la evidencia.");
        return;
      }

      setEvidenceComment("");
      setMessage("Evidencia agregada correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado agregando evidencia.");
    } finally {
      setIsCreatingEvidence(false);
    }
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEditTask) {
      setMessage("No tenés permiso para editar esta tarea.");
      return;
    }

    if (!editForm.dueDate) {
      setMessage("Debe seleccionar una fecha límite.");
      return;
    }

    setMessage(null);
    setIsSavingTask(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          priority: editForm.priority,
          assignedToId: editForm.assignedToId,
          dueDate: new Date(editForm.dueDate).toISOString(),
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "No se pudo guardar la tarea.");
        return;
      }

      setMessage("Tarea actualizada correctamente.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Error inesperado guardando la tarea.");
    } finally {
      setIsSavingTask(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/tasks"
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            >
              ← Volver a tareas
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-950">
              {task.title}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Usuario: {currentUser.name} · Rol: {currentUser.role}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                task.status
              )}`}
            >
              {statusLabels[task.status]}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${getPriorityClass(
                task.priority
              )}`}
            >
              Prioridad {priorityLabels[task.priority]}
            </span>
          </div>
        </header>

        {message && (
          <div className="rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-800">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Información general
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <InfoItem label="Cliente" value={task.client.name} />
                <InfoItem label="Sucursal" value={task.branch.name} />
                <InfoItem
                  label="Ciudad"
                  value={task.branch.city ?? "Sin ciudad registrada"}
                />
                <InfoItem
                  label="Dirección"
                  value={task.branch.address ?? "Sin dirección registrada"}
                />
                <InfoItem label="Responsable" value={task.assignedTo.name} />
                <InfoItem
                  label="Email responsable"
                  value={task.assignedTo.email}
                />
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Descripción
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                  {task.description || "Sin descripción registrada."}
                </p>
              </div>
            </section>

            {canEditTask ? (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Editar tarea
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Solo administradores y supervisores pueden modificar estos
                  datos.
                </p>

                <form onSubmit={handleUpdateTask} className="mt-5 space-y-4">
                  <Field label="Título">
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      required
                      minLength={3}
                    />
                  </Field>

                  <Field label="Descripción">
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                      value={editForm.description}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Prioridad">
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        value={editForm.priority}
                        onChange={(event) =>
                          setEditForm((current) => ({
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

                    <Field label="Responsable">
                      <select
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        value={editForm.assignedToId}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            assignedToId: event.target.value,
                          }))
                        }
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Fecha límite">
                      <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        value={editForm.dueDate}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            dueDate: event.target.value,
                          }))
                        }
                        required
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingTask}
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingTask ? "Guardando..." : "Guardar cambios"}
                  </button>
                </form>
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Edición limitada
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Tu rol actual es {currentUser.role}. Podés cambiar el estado
                  permitido y agregar evidencias, pero no editar título,
                  prioridad, responsable ni fecha límite.
                </p>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Evidencias
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Historial operativo de comentarios y registros.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Total: {task.evidences.length}
                </span>
              </div>

              <form
                onSubmit={handleCreateEvidence}
                className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"
              >
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
                  disabled={isCreatingEvidence}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingEvidence ? "Agregando..." : "Agregar evidencia"}
                </button>
              </form>

              {task.evidences.length === 0 && (
                <div className="mt-5 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Esta tarea todavía no tiene evidencias.
                </div>
              )}

              <div className="mt-5 space-y-3">
                {task.evidences.map((evidence) => (
                  <article
                    key={evidence.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {evidence.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {evidence.user.role}
                        </p>
                      </div>

                      <p className="text-xs text-slate-400">
                        {formatDate(evidence.createdAt)}
                      </p>
                    </div>

                    <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
                      {evidence.comment}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Estado operativo
              </h2>

              <div className="mt-4 space-y-3">
                <InfoItem
                  label="Estado actual"
                  value={statusLabels[task.status]}
                />
                <InfoItem
                  label="Prioridad"
                  value={priorityLabels[task.priority]}
                />
                <InfoItem label="Fecha límite" value={formatDate(task.dueDate)} />
                <InfoItem label="Creada" value={formatDate(task.createdAt)} />
                <InfoItem
                  label="Última actualización"
                  value={formatDate(task.updatedAt)}
                />

                {task.closedAt && (
                  <InfoItem label="Cerrada" value={formatDate(task.closedAt)} />
                )}

                {isOverdue(task) && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
                    Esta tarea está vencida.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Acciones
              </h2>

              {nextStatuses.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Esta tarea no tiene acciones disponibles.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {nextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleChangeStatus(nextStatus)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Pasar a {statusLabels[nextStatus]}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}