import { NextRequest, NextResponse } from "next/server";
import { EvidenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentAppUser } from "@/lib/auth";
import { createEvidenceSchema } from "@/lib/evidence-validations";
import { canTechnicianAccessTask } from "@/lib/permissions";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteParams) {
  const auth = await requireCurrentAppUser();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: {
        id,
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

    const canAccess = canTechnicianAccessTask({
      role: auth.appUser.role,
      appUserId: auth.appUser.id,
      assignedToId: task.assignedToId,
    });

    if (!canAccess) {
      return NextResponse.json(
        {
          error: "No tenés permiso para ver evidencias de esta tarea",
        },
        { status: 403 }
      );
    }

    const evidences = await prisma.taskEvidence.findMany({
      where: {
        taskId: id,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      data: evidences,
      total: evidences.length,
    });
  } catch (error) {
    console.error("Error listando evidencias:", error);

    return NextResponse.json(
      {
        error: "Error interno listando evidencias",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  const auth = await requireCurrentAppUser();

  if (auth.response) {
    return auth.response;
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const validation = createEvidenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: {
        id,
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

    const canAccess = canTechnicianAccessTask({
      role: auth.appUser.role,
      appUserId: auth.appUser.id,
      assignedToId: task.assignedToId,
    });

    if (!canAccess) {
      return NextResponse.json(
        {
          error: "No tenés permiso para agregar evidencias en esta tarea",
        },
        { status: 403 }
      );
    }

    const evidence = await prisma.taskEvidence.create({
      data: {
        taskId: id,
        userId: auth.appUser.id,
        type: EvidenceType.COMMENT,
        comment: validation.data.comment,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(
      {
        data: evidence,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creando evidencia:", error);

    return NextResponse.json(
      {
        error: "Error interno creando evidencia",
      },
      { status: 500 }
    );
  }
}