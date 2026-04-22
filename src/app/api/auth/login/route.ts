import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const envEmail = process.env.AUTH_EMAIL;
    const envPassword = process.env.AUTH_PASSWORD;

    if (!envEmail || !envPassword) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    if (email !== envEmail) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Support both plain and bcrypt hashed passwords in env
    let passwordMatch = false;
    if (envPassword.startsWith("$2")) {
      passwordMatch = await bcrypt.compare(password, envPassword);
    } else {
      passwordMatch = password === envPassword;
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signToken({ email, role: "admin" });

    const response = NextResponse.json(
      { message: "Login successful", token },
      { status: 200 }
    );

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
