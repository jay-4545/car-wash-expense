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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const expense = await Expense.findById(id);
    if (!expense) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ expense }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { title, description, amount, date } = body ?? {};

    const parsedAmount =
      typeof amount === "number" ? amount : typeof amount === "string" ? Number(amount) : NaN;
    if (amount !== undefined && Number.isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }
    if (!title || amount === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (parsedAmount < 0) {
      return NextResponse.json({ message: "Amount must be >= 0" }, { status: 400 });
    }

    const parsedDate = typeof date === "string" ? parseDateInput(date) : null;
    if (date && !parsedDate) {
      return NextResponse.json({ message: "Invalid date" }, { status: 400 });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      { title, description, amount: parsedAmount, date: parsedDate ?? undefined },
      { new: true, runValidators: true }
    );

    if (!expense) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ expense }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : "Internal server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
