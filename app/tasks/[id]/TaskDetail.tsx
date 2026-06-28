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
  return new Intl.DateTimeFormat("es-PY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
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

export function TaskDetail({ task, currentUser }: TaskDetailProps) {
  const router = useRouter();

  const [message, setMessage] = useState<string | null>(null);
  const [evidenceComment, setEvidenceComment] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);

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
                <InfoItem label="Estado actual" value={statusLabels[task.status]} />
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