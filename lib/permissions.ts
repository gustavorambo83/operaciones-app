import { UserRole } from "@prisma/client";

export function canManageTasks(role: UserRole) {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canViewAllTasks(role: UserRole) {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canCreateTasks(role: UserRole) {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canUpdateAnyTask(role: UserRole) {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canTechnicianAccessTask(params: {
  role: UserRole;
  appUserId: string;
  assignedToId: string;
}) {
  if (params.role === "ADMIN" || params.role === "SUPERVISOR") {
    return true;
  }

  if (params.role === "TECHNICIAN") {
    return params.appUserId === params.assignedToId;
  }

  return false;
}

export function canTechnicianUpdateTaskFields(params: {
  role: UserRole;
  requestedFields: string[];
}) {
  if (params.role === "ADMIN" || params.role === "SUPERVISOR") {
    return true;
  }

  if (params.role === "TECHNICIAN") {
    const allowedFieldsForTechnician = ["status"];

    return params.requestedFields.every((field) =>
      allowedFieldsForTechnician.includes(field)
    );
  }

  return false;
}