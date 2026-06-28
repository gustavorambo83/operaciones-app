import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentAppUser } from "@/lib/auth";
import { canTechnicianAccessTask } from "@/lib/permissions";
import { TaskDetail } from "./TaskDetail";

type TaskDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const auth = await requireCurrentAppUser();

  if (auth.response || !auth.appUser) {
    redirect("/login");
  }

  const { id } = await params;

  const [task, users] = await Promise.all([
    prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        client: true,
        branch: true,
        assignedTo: true,
        evidences: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),

    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!task) {
    notFound();
  }

  const canAccess = canTechnicianAccessTask({
    role: auth.appUser.role,
    appUserId: auth.appUser.id,
    assignedToId: task.assignedToId,
  });

  if (!canAccess) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-red-700">
            Acceso no permitido
          </h1>

          <p className="mt-3 text-sm text-slate-700">
            No tenés permiso para ver esta tarea. Si creés que esto es un
            error, pedí a un supervisor que revise la asignación.
          </p>

          <Link
            href="/tasks"
            className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Volver a tareas
          </Link>
        </section>
      </main>
    );
  }

  const serializedTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate.toISOString(),
    closedAt: task.closedAt ? task.closedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    client: {
      id: task.client.id,
      name: task.client.name,
    },
    branch: {
      id: task.branch.id,
      name: task.branch.name,
      address: task.branch.address,
      city: task.branch.city,
    },
    assignedTo: {
      id: task.assignedTo.id,
      name: task.assignedTo.name,
      email: task.assignedTo.email,
      role: task.assignedTo.role,
    },
    evidences: task.evidences.map((evidence) => ({
      id: evidence.id,
      type: evidence.type,
      comment: evidence.comment,
      fileUrl: evidence.fileUrl,
      latitude: evidence.latitude,
      longitude: evidence.longitude,
      createdAt: evidence.createdAt.toISOString(),
      user: {
        id: evidence.user.id,
        name: evidence.user.name,
        email: evidence.user.email,
        role: evidence.user.role,
      },
    })),
  };

  const serializedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));

  const currentUser = {
    id: auth.appUser.id,
    name: auth.appUser.name,
    email: auth.appUser.email,
    role: auth.appUser.role,
  };

  return (
    <TaskDetail
      task={serializedTask}
      users={serializedUsers}
      currentUser={currentUser}
    />
  );
}