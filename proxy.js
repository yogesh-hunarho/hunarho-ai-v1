import { NextResponse } from "next/server";

export function proxy() {
    // retrieve the current response
    const res = NextResponse.next()

    res.headers.append('Access-Control-Allow-Credentials', "true")
    res.headers.append('Access-Control-Allow-Origin', '*') // replace this your actual origin
    res.headers.append('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')

    return res
}

export const config = {
    matcher: '/api/:path*',
}