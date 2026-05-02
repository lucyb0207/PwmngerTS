import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";

export async function getAuthUser(req: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get("accessToken")?.value;
  
  if (!token) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
  } catch (err) {
    console.log("Auth verification failed:", err);
    return null;
  }
}
