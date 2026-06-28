import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentAppUser } from "@/lib/auth";
import { canViewAllTasks } from "@/lib/permissions";
import { TaskManager } from "./TaskManager";
import { LogoutButton } from "./LogoutButton";

export default async function TasksPage() {
  const auth = await requireCurrentAppUser();

  if (auth.response || !auth.appUser) {
    redirect("/login");
  }

  const currentUser = auth.appUser;

  const [tasks, clients, users] = await Promise.all([
    prisma.task.findMany({
      where: canViewAllTasks(currentUser.role)
        ? {}
        : {
            assignedToId: currentUser.id,
          },
      include: {
        client: true,
        branch: true,
        assignedTo: true,
        evidences: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.client.findMany({
      include: {
        branches: {
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const serializedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate.toISOString(),
    closedAt: task.closedAt ? task.closedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
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
    evidencesCount: task.evidences.length,
  }));

  const serializedClients = clients.map((client) => ({
    id: client.id,
    name: client.name,
    branches: client.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.city,
    })),
  }));

  const serializedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
  }));

  return (
    <TaskManager
      initialTasks={serializedTasks}
      clients={serializedClients}
      users={serializedUsers}
      currentUser={{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      }}
      headerAction={<LogoutButton />}
    />
  );
}