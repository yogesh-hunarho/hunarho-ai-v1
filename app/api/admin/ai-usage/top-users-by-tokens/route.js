import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getDateFilter } from "@/lib/helper";

export async function GET(req) {
  const dateFilter = getDateFilter(req);

  const usage = await prisma.aIUsage.groupBy({
    by: ["userId"],
    where: dateFilter,
    _sum: {
      tokensUsed: true,
      cost: true,
    },
    _count: { id: true },
    orderBy: {
      _sum: { tokensUsed: "desc" },
    },
    take: 10,
  });

  return NextResponse.json(
    usage.map(row => ({
      userId: row.userId,
      calls: row._count.id,
      tokens: row._sum.tokensUsed ?? 0,
      cost: Number((row._sum.cost ?? 0).toFixed(6)),
    }))
  );
}
