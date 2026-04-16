import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "still-photobook-secret"
);

export async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("still_auth")?.value;
}

export async function isAuthenticated() {
  const token = await getAuthToken();
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}

export async function isAuthenticatedFromRequest(request: NextRequest) {
  const token = request.cookies.get("still_auth")?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null;
}
