import { getSiteSettings, getActivities } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function Home() {
  const siteSettings = await getSiteSettings();
  const activities = await getActivities();

  const objectives = Array.isArray(siteSettings.home_objectives) 
    ? siteSettings.home_objectives 
    : JSON.parse(siteSettings.home_objectives || "[]");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-32 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${siteSettings.home_hero_bg_image})` }}
        />
        <div className="container relative z-20 px-4 md:px-6 mx-auto text-center text-white">
          <Badge className="bg-secondary text-white hover:bg-secondary/90 mb-4 text-sm px-4 py-1">
            {siteSettings.home_hero_subtitle}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            {siteSettings.home_hero_title}
          </h1>
          <p className="text-lg md:text-xl max-w-[800px] mx-auto text-white/90 mb-8 leading-relaxed">
            {siteSettings.home_hero_text}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white" render={<Link href="/institucion" />}>
              Conocé la Institución
            </Button>
            <Button size="lg" variant="outline" className="text-primary bg-white hover:bg-gray-100 border-none" render={<Link href="/contacto" />}>
              Solicitar Entrevista
            </Button>
          </div>
        </div>
      </section>

      {/* Objetivos Section */}
      <section className="w-full py-16 md:py-24 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Nuestros Objetivos</h2>
            <div className="h-1 w-20 bg-secondary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {objectives.map((obj: any, i: number) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    {obj.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{obj.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Actividades */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Talleres y Actividades</h2>
              <div className="h-1 w-20 bg-primary rounded-full mb-4 md:mb-0" />
            </div>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" render={<Link href="/actividades" />}>
              Ver todas las actividades
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.slice(0, 4).map((act) => (
              <Card key={act.id} className="overflow-hidden group">
                <div 
                  className="h-48 w-full bg-muted bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: act.image_url ? `url(${act.image_url})` : "none" }}
                />
                <CardHeader>
                  <CardTitle className="text-lg">{act.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {act.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
