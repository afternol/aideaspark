import { NextResponse } from "next/server";
import { scoreAllCategories } from "@/lib/trend-scorer";

export async function GET() {
  try {
    const results = await scoreAllCategories();
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("API /api/trends error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
