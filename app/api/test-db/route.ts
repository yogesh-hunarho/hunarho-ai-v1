// app/api/test-db/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const users = await prisma.user.findMany({ take: 1 })
  return NextResponse.json(users)
}
