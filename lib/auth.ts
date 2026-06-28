import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "No autenticado",
        },
        { status: 401 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

export async function requireCurrentAppUser() {
  const auth = await requireAuthenticatedUser();

  if (auth.response || !auth.user) {
    return {
      authUser: null,
      appUser: null,
      response: auth.response,
    };
  }

  const email = auth.user.email;

  if (!email) {
    return {
      authUser: auth.user,
      appUser: null,
      response: NextResponse.json(
        {
          error: "El usuario autenticado no tiene email asociado",
        },
        { status: 401 }
      ),
    };
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!appUser) {
    return {
      authUser: auth.user,
      appUser: null,
      response: NextResponse.json(
        {
          error:
            "El usuario autenticado no existe en la tabla interna de usuarios",
        },
        { status: 403 }
      ),
    };
  }

  return {
    authUser: auth.user,
    appUser,
    response: null,
  };
}