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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está configurado en el archivo .env");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(15, 0, 0, 0);
  return date;
}

async function main() {
  console.log("Iniciando seed...");

  await prisma.taskEvidence.deleteMany();
  await prisma.task.deleteMany();

  const admin = await prisma.user.upsert({
    where: {
      email: "rodas.gus@gmail.com",
    },
    update: {
      name: "Gustavo Rodas",
      role: UserRole.ADMIN,
    },
    create: {
      name: "Gustavo Rodas",
      email: "rodas.gus@gmail.com",
      role: UserRole.ADMIN,
    },
  });

  const adminOperativo = await prisma.user.upsert({
    where: {
      email: "admin@operaciones.local",
    },
    update: {
      name: "Administrador Operativo",
      role: UserRole.ADMIN,
    },
    create: {
      name: "Administrador Operativo",
      email: "admin@operaciones.local",
      role: UserRole.ADMIN,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: {
      email: "supervisor@operaciones.local",
    },
    update: {
      name: "Supervisor de Operaciones",
      role: UserRole.SUPERVISOR,
    },
    create: {
      name: "Supervisor de Operaciones",
      email: "supervisor@operaciones.local",
      role: UserRole.SUPERVISOR,
    },
  });

  const juan = await prisma.user.upsert({
    where: {
      email: "juan.tecnico@operaciones.local",
    },
    update: {
      name: "Juan Técnico",
      role: UserRole.TECHNICIAN,
    },
    create: {
      name: "Juan Técnico",
      email: "juan.tecnico@operaciones.local",
      role: UserRole.TECHNICIAN,
    },
  });

  const maria = await prisma.user.upsert({
    where: {
      email: "maria.tecnica@operaciones.local",
    },
    update: {
      name: "María Técnica",
      role: UserRole.TECHNICIAN,
    },
    create: {
      name: "María Técnica",
      email: "maria.tecnica@operaciones.local",
      role: UserRole.TECHNICIAN,
    },
  });

  const ueno = await prisma.client.upsert({
    where: {
      name: "Ueno Bank",
    },
    update: {},
    create: {
      name: "Ueno Bank",
    },
  });

  const biggie = await prisma.client.upsert({
    where: {
      name: "Biggie",
    },
    update: {},
    create: {
      name: "Biggie",
    },
  });

  const perfecta = await prisma.client.upsert({
    where: {
      name: "Perfecta Automotores",
    },
    update: {},
    create: {
      name: "Perfecta Automotores",
    },
  });

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
      address: "Avda. principal San Lorenzo",
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

  const biggieFernando = await prisma.branch.create({
    data: {
      name: "Biggie Fernando de la Mora",
      address: "Ruta Mariscal Estigarribia",
      city: "Fernando de la Mora",
      clientId: biggie.id,
    },
  });

  const perfectaAsuncion = await prisma.branch.create({
    data: {
      name: "Perfecta Asunción",
      address: "Casa central",
      city: "Asunción",
      clientId: perfecta.id,
    },
  });

  const perfectaCde = await prisma.branch.create({
    data: {
      name: "Perfecta Ciudad del Este",
      address: "Sucursal Alto Paraná",
      city: "Ciudad del Este",
      clientId: perfecta.id,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: "Verificar UPS monitoreada",
      description:
        "Revisar comunicación SNMP, estado de baterías y alarmas activas.",
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      dueDate: addDays(2),
      clientId: ueno.id,
      branchId: uenoLuque.id,
      assignedToId: juan.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Revisar cámara sin video",
      description:
        "Validar energía, red, grabación en NVR y visibilidad remota.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: addDays(4),
      clientId: biggie.id,
      branchId: biggieVillaMorra.id,
      assignedToId: maria.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Cambio de equipo de red",
      description:
        "Pendiente aprobación del cliente para ventana de mantenimiento.",
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.CRITICAL,
      dueDate: addDays(-1),
      clientId: ueno.id,
      branchId: uenoSanLorenzo.id,
      assignedToId: supervisor.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Revisar router principal",
      description:
        "Validar logs, temperatura, uso de CPU y conectividad hacia proveedor.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: addDays(1),
      clientId: ueno.id,
      branchId: uenoLuque.id,
      assignedToId: juan.id,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Validar enlace de datos",
      description:
        "Medir latencia, pérdida de paquetes y estabilidad del enlace principal.",
      status: TaskStatus.CLOSED,
      priority: TaskPriority.HIGH,
      dueDate: addDays(-5),
      closedAt: addDays(-3),
      clientId: ueno.id,
      branchId: uenoSanLorenzo.id,
      assignedToId: supervisor.id,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Instalar equipo de respaldo",
      description:
        "Instalar switch temporal para asegurar continuidad operativa.",
      status: TaskStatus.PENDING,
      priority: TaskPriority.MEDIUM,
      dueDate: addDays(5),
      clientId: biggie.id,
      branchId: biggieFernando.id,
      assignedToId: maria.id,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: "Revisión preventiva de CCTV",
      description:
        "Revisar cámaras, grabación, disco del NVR y acceso remoto.",
      status: TaskStatus.PENDING,
      priority: TaskPriority.LOW,
      dueDate: addDays(7),
      clientId: perfecta.id,
      branchId: perfectaAsuncion.id,
      assignedToId: juan.id,
    },
  });

  const task8 = await prisma.task.create({
    data: {
      title: "Equipo POS sin conexión",
      description:
        "Validar conectividad LAN, configuración IP y salida a internet.",
      status: TaskStatus.BLOCKED,
      priority: TaskPriority.CRITICAL,
      dueDate: addDays(0),
      clientId: biggie.id,
      branchId: biggieVillaMorra.id,
      assignedToId: maria.id,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: "Actualizar documentación de red",
      description:
        "Registrar cambios de IP, ubicación de equipos y responsable técnico.",
      status: TaskStatus.CLOSED,
      priority: TaskPriority.MEDIUM,
      dueDate: addDays(-8),
      closedAt: addDays(-6),
      clientId: perfecta.id,
      branchId: perfectaCde.id,
      assignedToId: supervisor.id,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: "Validar monitoreo NOC",
      description:
        "Confirmar que equipos críticos estén visibles en monitoreo y generen alertas.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: addDays(3),
      clientId: perfecta.id,
      branchId: perfectaAsuncion.id,
      assignedToId: adminOperativo.id,
    },
  });

  await prisma.taskEvidence.createMany({
    data: [
      {
        taskId: task1.id,
        userId: juan.id,
        type: EvidenceType.COMMENT,
        comment:
          "Se detecta comunicación intermitente con la tarjeta SNMP de la UPS.",
      },
      {
        taskId: task2.id,
        userId: maria.id,
        type: EvidenceType.COMMENT,
        comment:
          "La cámara tiene energía, pero no responde al ping desde la red local.",
      },
      {
        taskId: task3.id,
        userId: supervisor.id,
        type: EvidenceType.COMMENT,
        comment:
          "Se solicita autorización del cliente para intervenir fuera de horario.",
      },
      {
        taskId: task3.id,
        userId: admin.id,
        type: EvidenceType.COMMENT,
        comment:
          "No contamos con el equipo correcto para el cambio, se buscará en depósito.",
      },
      {
        taskId: task4.id,
        userId: juan.id,
        type: EvidenceType.COMMENT,
        comment:
          "Router principal con alto uso de CPU durante horario pico.",
      },
      {
        taskId: task5.id,
        userId: supervisor.id,
        type: EvidenceType.COMMENT,
        comment:
          "Enlace validado. Latencia dentro del rango esperado.",
      },
      {
        taskId: task8.id,
        userId: maria.id,
        type: EvidenceType.COMMENT,
        comment:
          "Se requiere confirmación del proveedor antes de reemplazar el equipo POS.",
      },
      {
        taskId: task10.id,
        userId: adminOperativo.id,
        type: EvidenceType.COMMENT,
        comment:
          "Se validó visibilidad parcial. Faltan dos equipos por incorporar al monitoreo.",
      },
    ],
  });

  console.log("Seed completado correctamente.");
  console.table([
    { entidad: "Usuarios", cantidad: 5 },
    { entidad: "Clientes", cantidad: 3 },
    { entidad: "Sucursales", cantidad: 6 },
    { entidad: "Tareas", cantidad: 10 },
    { entidad: "Evidencias", cantidad: 8 },
  ]);
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