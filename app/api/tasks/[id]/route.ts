import { NextRequest, NextResponse } from "next/server";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/task-validations";
import { requireAuthenticatedUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatusTransitions: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["BLOCKED", "CLOSED"],
  BLOCKED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

export async function GET(_request: NextRequest, context: RouteParams) {
  const auth = await requireAuthenticatedUser();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
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
    });

    if (!task) {
      return NextResponse.json(
        {
          error: "Tarea no encontrada",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: task,
    });
  } catch (error) {
    console.error("Error obteniendo tarea:", error);

    return NextResponse.json(
      {
        error: "Error interno obteniendo tarea",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  const auth = await requireAuthenticatedUser();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          error: "Tarea no encontrada",
        },
        { status: 404 }
      );
    }

    const data = validation.data;

    if (data.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: {
          id: data.assignedToId,
        },
      });

      if (!assignedUser) {
        return NextResponse.json(
          {
            error: "Responsable no encontrado",
          },
          { status: 404 }
        );
      }
    }

    if (data.status) {
      const nextStatus = data.status as TaskStatus;
      const currentStatus = existingTask.status;

      const allowedNextStatuses = allowedStatusTransitions[currentStatus];

      if (!allowedNextStatuses.includes(nextStatus)) {
        return NextResponse.json(
          {
            error: `Transición de estado no permitida: ${currentStatus} -> ${nextStatus}`,
          },
          { status: 400 }
        );
      }
    }

    const shouldCloseTask = data.status === "CLOSED";

    const updatedTask = await prisma.task.update({
      where: {
        id,
      },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.status ? { status: data.status as TaskStatus } : {}),
        ...(data.priority ? { priority: data.priority as TaskPriority } : {}),
        ...(data.assignedToId ? { assignedToId: data.assignedToId } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(shouldCloseTask ? { closedAt: new Date() } : {}),
      },
      include: {
        client: true,
        branch: true,
        assignedTo: true,
      },
    });

    return NextResponse.json({
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error actualizando tarea:", error);

    return NextResponse.json(
      {
        error: "Error interno actualizando tarea",
      },
      { status: 500 }
    );
  }
}