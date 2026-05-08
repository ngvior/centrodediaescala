import { getSiteSettings, getProfessionals } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, CheckCircle, Users } from "lucide-react";
import Image from "next/image";

export default async function InstitucionPage() {
  const siteSettings = await getSiteSettings();
  const professionals = await getProfessionals();

  return (
    <div className="flex flex-col min-h-screen pt-20">
      <section className="w-full py-12 md:py-20 bg-muted">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-secondary mb-4 text-white">Sobre Nosotros</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {siteSettings.about_title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {siteSettings.about_text}
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-16 bg-background">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Info className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold text-foreground">{siteSettings.about_requirements_title}</h2>
              </div>
              <div className="prose prose-lg text-muted-foreground">
                <p>{siteSettings.about_requirements_text}</p>
              </div>
            </div>
            
            <div className="bg-muted p-8 rounded-2xl border border-border">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="h-8 w-8 text-secondary" />
                <h2 className="text-2xl font-bold text-foreground">{siteSettings.about_facilities_title}</h2>
              </div>
              <p className="text-muted-foreground">
                {siteSettings.about_facilities_text}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-muted border-t border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
              Nuestro Equipo
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {professionals.map((prof) => (
              <Card key={prof.id} className="text-center overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                <div className="pt-8 pb-4 flex justify-center bg-white">
                  <div className="w-32 h-32 rounded-full bg-muted overflow-hidden relative border-4 border-muted">
                    <img src={prof.image_url} alt={`${prof.first_name} ${prof.last_name}`} className="object-cover w-full h-full" />
                  </div>
                </div>
                <CardHeader className="pb-2 bg-white">
                  <CardTitle className="text-xl">{prof.first_name} {prof.last_name}</CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                    {prof.role}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
