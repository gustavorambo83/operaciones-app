import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const tasks = await prisma.task.findMany({
    include: {
      client: true,
      branch: true,
      assignedTo: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Operaciones App
          </h1>
          <p className="mt-2 text-slate-600">
            Sprint 1: base de datos conectada y tareas de prueba cargadas.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="px-4 py-3">Tarea</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Sucursal</th>
                <th className="px-4 py-3">Responsable</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Vence</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.client.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.branch.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.assignedTo.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.status}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.priority}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {task.dueDate.toLocaleDateString("es-PY")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tasks.length === 0 && (
          <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            No hay tareas cargadas. Ejecutá: npx prisma db seed
          </div>
        )}
      </section>
    </main>
  );
}