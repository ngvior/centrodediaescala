"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

type NavigationItem = {
  label: string
  href: `#${string}`
}

export function Header({
  brandName,
  brandSubtitle,
  navigation,
}: {
  brandName: string
  brandSubtitle: string
  navigation: NavigationItem[]
}) {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-border shadow-sm transition-all duration-300">
      <nav className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="#inicio" onClick={(e) => scrollTo(e, "#inicio")} className="flex items-center gap-2">
          <div className="bg-primary text-white font-bold text-2xl px-2 py-1 rounded">{brandName}</div>
          <span className="font-bold text-lg hidden sm:inline-block text-foreground">
            {brandSubtitle}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => scrollTo(e, item.href)}
                className="text-sm font-bold uppercase tracking-wider transition-colors text-muted-foreground hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </div>
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
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    scrollTo(e, item.href);
                    // Opcional: cerrar el menú al clickear, pero require state.
                  }}
                  className="text-lg font-bold uppercase transition-colors hover:text-primary text-muted-foreground"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
