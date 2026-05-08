"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Institución", href: "/institucion" },
  { name: "Actividades", href: "/actividades" },
  { name: "Contacto", href: "/contacto" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border shadow-sm">
      <nav className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary text-white font-bold text-2xl px-2 py-1 rounded">ESCALA</div>
          <span className="font-bold text-lg hidden sm:inline-block text-foreground">
            Centro de Día
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <Button className="bg-secondary hover:bg-secondary/90 text-white" render={<Link href="/contacto" />}>
            Turnos
          </Button>
        </div>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-6 w-6 text-foreground" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="right" className="bg-white">
            <div className="flex flex-col gap-6 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-lg font-medium transition-colors hover:text-primary ${
                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <Button className="bg-secondary hover:bg-secondary/90 text-white w-full mt-4" render={<Link href="/contacto" />}>
                Solicitar Turno
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
