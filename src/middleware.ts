import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/rh", "/empresa", "/estagiario"];
const publicPrefixes = ["/login", "/auth/alterar-senha"];

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function homeForRole(role: string) {
  if (role === "rh_master" || role === "rh_operador") return "/rh";
  return "/login?erro=portal_desativado";
}

function canAccess(pathname: string, role: string) {
  if (pathname.startsWith("/rh")) {
    return role === "rh_master" || role === "rh_operador";
  }

  if (pathname.startsWith("/empresa")) {
    return false;
  }

  if (pathname.startsWith("/estagiario")) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

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

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("app_profiles")
    .select("role, status, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("erro", "perfil");
    return NextResponse.redirect(redirectUrl);
  }

  if (profile?.status !== "ativo" && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("erro", "bloqueado");
    return NextResponse.redirect(redirectUrl);
  }

  if (
    profile?.must_change_password &&
    pathname !== "/auth/alterar-senha" &&
    isProtected(pathname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/alterar-senha";
    return NextResponse.redirect(redirectUrl);
  }

  if (
    profile &&
    isProtected(pathname) &&
    !canAccess(pathname, profile.role)
  ) {
    const redirectUrl = request.nextUrl.clone();
    const home = homeForRole(profile.role);
    const [homePath, homeQuery] = home.split("?");

    redirectUrl.pathname = homePath;
    redirectUrl.search = homeQuery ? "?" + homeQuery : "";

    return NextResponse.redirect(redirectUrl);
  }

  if (profile && pathname === "/login") {
    if (profile.role !== "rh_master" && profile.role !== "rh_operador") {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = profile.must_change_password
      ? "/auth/alterar-senha"
      : homeForRole(profile.role);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
