import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.aIUsage.groupBy({
    by: ["model"],
    _count: { id: true },
    _sum: {
      tokensUsed: true,
      cost: true,
    }
  });

  return NextResponse.json(
    data.map(row => ({
      model: row.model,
      calls: row._count.id,
      tokens: row._sum.tokensUsed ?? 0,
      cost: Number((row._sum.cost ?? 0).toFixed(6)),
    }))
  );
}
