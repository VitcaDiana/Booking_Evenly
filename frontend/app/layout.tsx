import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth.context";

export const metadata: Metadata = {
  title: 'Event Booking',
  description: 'Platforma de rezervare evenimente',

};

export default function RootLayout ({
  children,
}: {
  children: React.ReactNode;
}){
  return (
    <html lang = "ro" data-theme= "dark">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}