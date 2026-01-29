import { prisma } from "@/lib/prisma";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest){
    const { userId } = await req.json();

    try {
      const user = await prisma.user.findUnique({
        where: { userId },
        select: {
          payType: true,
          userCredits: {
            select: {
              type: true,
              balance: true
            }
          }
        },
      });

      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

      return NextResponse.json({ data: user }, { status: 200 });
    } catch (error) {
      console.error("Error fetching plan:", error);
      return NextResponse.json({ data: [], error: 'Something went wrong' }, { status: 500 });
    }
}