import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthenticated } from "@/lib/auth";
import CarEntry from "@/models/CarEntry";
import Expense from "@/models/Expense";

export async function GET(req: NextRequest) {
  try {
    const user = isAuthenticated(req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // today | week | month | all

    const now = new Date();
    let startDate: Date;

    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "all") {
      startDate = new Date("2000-01-01");
    } else {
      return NextResponse.json({ message: "Invalid period" }, { status: 400 });
    }

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    const [carAgg, expenseAgg, todayCars] = await Promise.all([
      CarEntry.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$amount" },
            totalCars: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: "$amount" },
          },
        },
      ]),
      CarEntry.countDocuments({
        date: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lte: endDate,
        },
      }),
    ]);

    const totalIncome = carAgg[0]?.totalIncome || 0;
    const totalCars = carAgg[0]?.totalCars || 0;
    const totalExpenses = expenseAgg[0]?.totalExpenses || 0;

    return NextResponse.json(
      {
        totalIncome,
        totalCars,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        todayCars,
        period,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
