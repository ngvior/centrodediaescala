import Link from "next/link";
import { getSiteSettings } from "@/lib/api";
import { MapPin, Phone, Clock, Globe } from "lucide-react";

export async function Footer() {
  const siteSettings = await getSiteSettings();

  return (
    <footer className="bg-primary text-white border-t border-primary/20">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-white text-primary font-bold text-2xl px-2 py-1 rounded">ESCALA</div>
            </div>
            <p className="text-primary-foreground/80 max-w-xs">
              Centro de Día para jóvenes y adultos con discapacidad intelectual. Promoviendo el desarrollo, la autonomía y la integración social.
            </p>
            <div className="flex gap-4 pt-2">
              <a href={siteSettings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-white hover:text-secondary transition-colors">
                <Globe className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/institucion" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Nuestra Institución
                </Link>
              </li>
              <li>
                <Link href="/actividades" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Talleres y Actividades
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-primary-foreground/80 hover:text-white transition-colors">
                  Contacto y Turnos
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <MapPin className="h-5 w-5 shrink-0 text-secondary" />
                <span>{siteSettings.contact_address}</span>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/80">
                <Phone className="h-5 w-5 shrink-0 text-secondary" />
                <span>{siteSettings.contact_phone}</span>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <Clock className="h-5 w-5 shrink-0 text-secondary" />
                <span>{siteSettings.contact_schedule}</span>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-white/20 text-center text-primary-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} Centro de Día Escala. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
