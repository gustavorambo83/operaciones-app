import { NextRequest, NextResponse } from "next/server";
import { EvidenceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createEvidenceSchema } from "@/lib/evidence-validations";
import { requireAuthenticatedUser } from "@/lib/auth";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
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
    });

    if (!task) {
      return NextResponse.json(
        {
          error: "Tarea no encontrada",
        },
        { status: 404 }
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
  const auth = await requireAuthenticatedUser();

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

    const user = await prisma.user.findUnique({
      where: {
        id: validation.data.userId,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
        },
        { status: 404 }
      );
    }

    const evidence = await prisma.taskEvidence.create({
      data: {
        taskId: id,
        userId: validation.data.userId,
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