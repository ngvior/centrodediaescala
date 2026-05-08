import type { Metadata } from "next";
import { Lato, Dosis } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const dosis = Dosis({
  variable: "--font-dosis",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Escala - Centro De Día",
  description: "Somos una institución que tiene como finalidad brindarle al joven-adulto con discapacidad intelectual, los apoyos necesarios mediante actividades ocupacionales, deportivas, pedagógicas y terapéuticas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${lato.variable} ${dosis.variable} h-full antialiased font-lato`}
    >
      <body className="min-h-full flex flex-col font-lato">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
