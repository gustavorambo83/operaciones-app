import { NextRequest, NextResponse } from "next/server";
import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentAppUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/task-validations";
import { canCreateTasks, canViewAllTasks } from "@/lib/permissions";

const validStatuses: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "CLOSED",
];

const validPriorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function GET(request: NextRequest) {
  const auth = await requireCurrentAppUser(request);

  if (auth.response) {
    return auth.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const clientId = searchParams.get("clientId");
    const assignedToId = searchParams.get("assignedToId");
    const overdue = searchParams.get("overdue");

    if (status && !validStatuses.includes(status as TaskStatus)) {
      return NextResponse.json(
        {
          error: "Estado inválido",
        },
        { status: 400 }
      );
    }

    if (priority && !validPriorities.includes(priority as TaskPriority)) {
      return NextResponse.json(
        {
          error: "Prioridad inválida",
        },
        { status: 400 }
      );
    }

    const where: Prisma.TaskWhereInput = {};

    if (status) {
      where.status = status as TaskStatus;
    }

    if (priority) {
      where.priority = priority as TaskPriority;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (!canViewAllTasks(auth.appUser.role)) {
      where.assignedToId = auth.appUser.id;
    }

    if (overdue === "true") {
      where.dueDate = {
        lt: new Date(),
      };

      where.status = {
        not: "CLOSED",
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: true,
        branch: true,
        assignedTo: true,
        evidences: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error("Error listando tareas:", error);

    return NextResponse.json(
      {
        error: "Error interno listando tareas",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentAppUser(request);

  if (auth.response) {
    return auth.response;
  }

  if (!canCreateTasks(auth.appUser.role)) {
    return NextResponse.json(
      {
        error: "No tenés permiso para crear tareas",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [client, branch, assignedUser] = await Promise.all([
      prisma.client.findUnique({
        where: {
          id: data.clientId,
        },
      }),
      prisma.branch.findUnique({
        where: {
          id: data.branchId,
        },
      }),
      prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
      }),
    ]);

    if (!client) {
      return NextResponse.json(
        {
          error: "Cliente no encontrado",
        },
        { status: 404 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        {
          error: "Sucursal no encontrada",
        },
        { status: 404 }
      );
    }

    if (branch.clientId !== client.id) {
      return NextResponse.json(
        {
          error: "La sucursal no pertenece al cliente indicado",
        },
        { status: 400 }
      );
    }

    if (!assignedUser) {
      return NextResponse.json(
        {
          error: "Responsable no encontrado",
        },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        branchId: data.branchId,
        assignedToId: data.assignedToId,
        priority: data.priority as TaskPriority,
        dueDate: new Date(data.dueDate),
      },
      include: {
        client: true,
        branch: true,
        assignedTo: true,
      },
    });

    return NextResponse.json(
      {
        data: task,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando tarea:", error);

    return NextResponse.json(
      {
        error: "Error interno creando tarea",
      },
      { status: 500 }
    );
  }
}