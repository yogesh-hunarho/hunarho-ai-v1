import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { orderId , userId } = await req.json();

  if(!orderId){
    return NextResponse.json(
      { message: "Please OrderId not found.", success: false },
      { status: 404 }
    );
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId as string },
  });

  if (!user) {
    return NextResponse.json(
      { message: "User not found", success: false },
      { status: 404 }
    );
  }

  try {
    return NextResponse.json({ error: 'no errr' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}