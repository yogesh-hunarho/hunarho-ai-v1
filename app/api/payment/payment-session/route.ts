import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PLAN_PRICES = {
  Free: { minutes: 30, price: 0 },
  Basic: { minutes: 60, price: 99 },  // 99
  Pro: { minutes: 240, price: 499 }, 
};

interface PaymentType {
  plan: keyof typeof PLAN_PRICES;
  userId: string
}


export async function POST(req:NextRequest) {
  const { plan, userId } : PaymentType = await req.json()

  if(!plan){
    return NextResponse.json(
      { message: "Please Select Plan", success: false },
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

  const { price } = PLAN_PRICES[plan];
  
  try {
    // const orderRequest = await razorpay.orders.create({
    //   amount:price*100,
    //   currency:"INR",
    //   receipt:await generateOrderId(),
    // })

    return NextResponse.json({ orderId : crypto.randomUUID(), price: price } , { status : 200 });
  } catch (error) {
    console.error("razorpay error",error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

