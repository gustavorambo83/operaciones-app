import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const apiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function addCorsHeaders(response: NextResponse) {
  Object.entries(apiCorsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export async function proxy(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith("/api");

  if (isApiRequest && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: apiCorsHeaders,
    });
  }

  if (isApiRequest) {
    return addCorsHeaders(
      NextResponse.next({
        request,
      })
    );
  }

  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurado");
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado");
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith("/login");
  const isProtectedPage = request.nextUrl.pathname.startsWith("/tasks");

  if (isProtectedPage && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);

    return NextResponse.redirect(redirectUrl);
  }

  if (isLoginPage && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/tasks";
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/tasks/:path*", "/login", "/api/:path*"],
};