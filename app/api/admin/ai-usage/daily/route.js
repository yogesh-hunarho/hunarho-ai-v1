import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.$queryRaw`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as calls,
      SUM("tokensUsed") as tokens,
      SUM("cost") as cost
    FROM "AIUsage"
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") DESC
  `;

  return NextResponse.json(data);
}
