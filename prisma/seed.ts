import "dotenv/config";
import {
  EvidenceType,
  PrismaClient,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL no está configurado en el archivo .env");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Limpiando datos anteriores...");

  await prisma.taskEvidence.deleteMany();
  await prisma.task.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creando usuarios...");

  const admin = await prisma.user.create({
    data: {
      name: "Administrador Operativo",
      email: "admin@operaciones.local",
      role: UserRole.ADMIN,
    },
  });

  const supervisor = await prisma.user.create({
    data: {
      name: "Supervisor de Operaciones",
      email: "supervisor@operaciones.local",
      role: UserRole.SUPERVISOR,
    },
  });

  const tecnicoJuan = await prisma.user.create({
    data: {
      name: "Juan Técnico",
      email: "juan.tecnico@operaciones.local",
      role: UserRole.TECHNICIAN,
    },
  });

  const tecnicoMaria = await prisma.user.create({
    data: {
      name: "María Técnica",
      email: "maria.tecnica@operaciones.local",
      role: UserRole.TECHNICIAN,
    },
  });

  console.log("Creando clientes...");

  const ueno = await prisma.client.create({
    data: {
      name: "Ueno Bank",
    },
  });

  const biggie = await prisma.client.create({
    data: {
      name: "Biggie",
    },
  });

  console.log("Creando sucursales...");

  const uenoLuque = await prisma.branch.create({
    data: {
      name: "Ueno Luque",
      address: "Centro de Luque",
      city: "Luque",
      clientId: ueno.id,
    },
  });

  const uenoSanLorenzo = await prisma.branch.create({
    data: {
      name: "Ueno San Lorenzo",
      address: "Ruta Mariscal Estigarribia",
      city: "San Lorenzo",
      clientId: ueno.id,
    },
  });

  const biggieVillaMorra = await prisma.branch.create({
    data: {
      name: "Biggie Villa Morra",
      address: "Zona Villa Morra",
      city: "Asunción",
      clientId: biggie.id,
    },
  });

  console.log("Creando tareas...");

  const tareaUps = await prisma.task.create({
    data: {
      title: "Verificar UPS monitoreada",
      description: "Revisar comunicación SNMP, estado de baterías y alarmas activas.",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: new Date("2026-07-01T18:00:00.000Z"),
      clientId: ueno.id,
      branchId: uenoLuque.id,
      assignedToId: tecnicoJuan.id,
    },
  });

  const tareaCamara = await prisma.task.create({
    data: {
      title: "Revisar cámara sin video",
      description: "Validar energía, red, grabación en NVR y visibilidad remota.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date("2026-07-02T18:00:00.000Z"),
      clientId: biggie.id,
      branchId: biggieVillaMorra.id,
      assignedToId: tecnicoMaria.id,
    },
  });

  const tareaBloqueada = await prisma.task.create({
    data: {
      title: "Cambio de equipo de red",
      description: "Pendiente aprobación del cliente para ventana de mantenimiento.",
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.CRITICAL,
      dueDate: new Date("2026-06-28T18:00:00.000Z"),
      clientId: ueno.id,
      branchId: uenoSanLorenzo.id,
      assignedToId: supervisor.id,
    },
  });

  console.log("Creando evidencias...");

  await prisma.taskEvidence.create({
    data: {
      taskId: tareaUps.id,
      userId: tecnicoJuan.id,
      type: EvidenceType.COMMENT,
      comment: "Se agenda visita técnica para validación en sitio.",
    },
  });

  await prisma.taskEvidence.create({
    data: {
      taskId: tareaCamara.id,
      userId: tecnicoMaria.id,
      type: EvidenceType.COMMENT,
      comment: "Se detecta pérdida intermitente de conectividad.",
    },
  });

  await prisma.taskEvidence.create({
    data: {
      taskId: tareaBloqueada.id,
      userId: supervisor.id,
      type: EvidenceType.COMMENT,
      comment: "Se solicita autorización del cliente para intervenir fuera de horario.",
    },
  });

  console.log("Seed finalizado correctamente.");
  console.log({
    admin: admin.email,
    supervisor: supervisor.email,
    tecnicoJuan: tecnicoJuan.email,
    tecnicoMaria: tecnicoMaria.email,
  });
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });