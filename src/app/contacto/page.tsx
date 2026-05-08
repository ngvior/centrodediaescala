import { getSiteSettings } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default async function ContactoPage() {
  const siteSettings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen pt-20">
      <section className="bg-primary/5 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-foreground">{siteSettings.contact_title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {siteSettings.contact_text}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground">Información de Contacto</h2>
              <p className="text-muted-foreground mb-8">
                Estamos a disposición para responder tus consultas y coordinar entrevistas de admisión.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-secondary/10 p-3 rounded-full shrink-0">
                  <MapPin className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Dirección</h3>
                  <p className="text-muted-foreground">{siteSettings.contact_address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full shrink-0">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Teléfono</h3>
                  <p className="text-muted-foreground">{siteSettings.contact_phone}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-emerald-600/10 p-3 rounded-full shrink-0">
                  <Clock className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Horario de Atención</h3>
                  <p className="text-muted-foreground">{siteSettings.contact_schedule}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Card className="border-border shadow-lg">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-6">Solicitar Entrevista</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Nombre del Familiar</label>
                    <Input id="name" placeholder="Tu nombre" className="border-border" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="patient" className="text-sm font-medium">Nombre del Posible Concurrente</label>
                    <Input id="patient" placeholder="Nombre" className="border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">Teléfono de Contacto</label>
                  <Input id="phone" type="tel" placeholder="11 1234-5678" className="border-border" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">Mensaje o Consulta (Opcional)</label>
                  <Textarea id="message" placeholder="¿En qué podemos ayudarte?" rows={4} className="border-border" />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white" size="lg">
                  Enviar Solicitud
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
