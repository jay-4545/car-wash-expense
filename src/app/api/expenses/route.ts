import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";
import Expense from "@/models/Expense";

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};

    if (startDate && endDate) {
      const startBase = parseDateInput(startDate);
      const endBase = parseDateInput(endDate);
      if (!startBase || !endBase) {
        return NextResponse.json({ message: "Invalid date range" }, { status: 400 });
      }
      const start = new Date(startBase);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endBase);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ expenses }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const body = await req.json();
    const { title, description, amount, date } = body ?? {};

    const parsedAmount =
      typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : NaN;

    if (!title || Number.isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Missing or invalid required fields" }, { status: 400 });
    }
    if (parsedAmount < 0) {
      return NextResponse.json({ message: "Amount must be >= 0" }, { status: 400 });
    }

    const parsedDate = typeof date === "string" ? parseDateInput(date) : null;
    if (date && !parsedDate) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    const expense = await Expense.create({
      title,
      description,
      amount: parsedAmount,
      date: parsedDate ?? new Date(),
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
