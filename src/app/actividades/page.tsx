import { getActivities, getEvents } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ActividadesPage() {
  const activities = await getActivities();
  const events = await getEvents();

  return (
    <div className="flex flex-col min-h-screen pt-20">
      <section className="bg-primary py-16 md:py-24 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-secondary text-white hover:bg-secondary/90 mb-4">Talleres y Espacios</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Actividades del Centro</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Descubrí todas las propuestas que ofrecemos para fomentar el desarrollo, la autonomía y la creatividad.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((act) => (
            <Card key={act.id} className="overflow-hidden flex flex-col group border-none shadow-md">
              <div 
                className="h-48 w-full bg-muted bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: act.image_url ? `url(${act.image_url})` : "none" }}
              />
              <CardHeader className="bg-white">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-primary border-primary">{act.category}</Badge>
                </div>
                <CardTitle className="text-xl mb-2">{act.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 bg-white flex flex-col justify-between">
                <p className="text-muted-foreground mb-4">
                  {act.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-muted py-16 md:py-24 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Eventos Destacados</h2>
              <div className="h-1 w-20 bg-secondary rounded-full" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {events.map((evento) => (
              <Card key={evento.id} className="overflow-hidden flex flex-col md:flex-row border-none shadow-md">
                <div 
                  className="h-48 md:h-auto md:w-2/5 bg-muted bg-cover bg-center"
                  style={{ backgroundImage: evento.cover_image_url ? `url(${evento.cover_image_url})` : "none" }}
                />
                <div className="p-6 md:w-3/5 flex flex-col bg-white">
                  <div className="flex items-center gap-2 text-sm text-secondary font-bold mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{evento.event_date}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{evento.title}</h3>
                  <p className="text-muted-foreground mb-6 line-clamp-3">
                    {evento.content}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
