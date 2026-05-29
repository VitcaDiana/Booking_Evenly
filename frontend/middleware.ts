import { url } from "inspector";
import { NextRequest, NextResponse } from "next/server";


const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest){
    const token = request.cookies.get('access_token')?.value;
    const {pathname} = request.nextUrl;

    if(protectedRoutes.some(route => pathname.startsWith(route)) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    if(authRoutes.includes(pathname) && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
      matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};