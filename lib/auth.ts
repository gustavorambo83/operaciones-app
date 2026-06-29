import { NextRequest, NextResponse } from "next/server";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User as AppUser } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type AuthenticatedUserResult =
  | {
      user: SupabaseAuthUser;
      response: null;
    }
  | {
      user: null;
      response: NextResponse;
    };

type CurrentAppUserResult =
  | {
      authUser: SupabaseAuthUser;
      appUser: AppUser;
      response: null;
    }
  | {
      authUser: SupabaseAuthUser | null;
      appUser: null;
      response: NextResponse;
    };

function getBearerToken(request?: NextRequest) {
  const authorizationHeader = request?.headers.get("authorization");

  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireAuthenticatedUser(
  request?: NextRequest
): Promise<AuthenticatedUserResult> {
  const supabase = await createClient();
  const bearerToken = getBearerToken(request);

  const {
    data: { user },
    error,
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

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

export async function requireCurrentAppUser(
  request?: NextRequest
): Promise<CurrentAppUserResult> {
  const auth = await requireAuthenticatedUser(request);

  if (auth.response) {
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