import {
  getActivities,
  getGalleryItems,
  getHomeObjectives,
  getProfessionals,
  getSiteSettings,
} from "@/lib/api";
import { InterviewRequestForm } from "@/components/interview-request-form";
import { Check, CheckCircle2, MapPin, Phone, Clock } from "lucide-react";
import Image from "next/image";

export default async function Home() {
  const siteSettingsPromise = getSiteSettings();
  const activitiesPromise = getActivities();
  const professionalsPromise = getProfessionals();
  const objectivesPromise = getHomeObjectives();
  const galleryPromise = getGalleryItems();

  const [siteSettings, activities, professionals, objectives, gallery] =
    await Promise.all([
      siteSettingsPromise,
      activitiesPromise,
      professionalsPromise,
      objectivesPromise,
      galleryPromise,
    ]);

  // Divide activities in two columns as in legacy
  const half = Math.ceil(activities.length / 2);
  const leftActivities = activities.slice(0, half);
  const rightActivities = activities.slice(half);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top_content (Hero) */}
      <section id="inicio" className="w-full relative bg-[#f9f9f9] border-b border-[#e5e5e5] overflow-hidden">
        {/* Usamos un div posicionado a la derecha para emular el background legacy que iba a la derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block" style={{
          backgroundImage: "url(/white_pad.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right"
        }} />
        <div className="container px-4 md:px-6 mx-auto relative z-10 py-16 md:py-32">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/80 md:bg-transparent p-6 rounded-lg">
              <h3 className="text-[25px] text-[#222222] font-semibold mb-2 font-dosis normal-case tracking-normal">
                {siteSettings.home_hero_subtitle}
              </h3>
              <h2 className="text-[48px] text-[#49b5e7] font-bold mb-6 text-left m-0">
                {siteSettings.home_hero_title}
              </h2>
              <p className="text-[16px] text-[#888888] leading-[26px] mb-8">
                {siteSettings.home_hero_text}
              </p>
              <a href="#institucion" className="inline-block px-10 py-4 text-white text-[16px] font-semibold uppercase bg-primary rounded-full hover:bg-secondary transition-colors duration-300">
                Conocenos
              </a>
            </div>
            {/* The right side in legacy is empty, leaving space for the background image */}
            <div className="hidden md:block"></div>
          </div>
        </div>
      </section>

      {/* Service (Institucional) */}
      <section id="institucion" className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2>{siteSettings.about_title}</h2>
          
          {/* Legacy twitter-feed style intro text */}
          <div className="bg-primary p-8 text-center text-white mb-16 rounded-sm shadow-md">
            <p className="text-lg leading-relaxed text-white">
              Es para <strong>jóvenes y adultos de ambos sexos, mayores de 25 años</strong>, con discapacidad intelectual de grado leve, moderado y severo sin dependencia, con o sin patología motora asociada, con o sin trastorno o patología sensorial; compensados psíquicamente. En todos los casos, con previa evaluación del equipo interdisciplinario de nuestra institución.
            </p>
          </div>

          <h5 className="text-center">Objetivos</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {objectives.map((obj) => {
              return (
                <div key={obj.id} className="text-center group">
                  <div className="mx-auto w-[90px] h-[90px] rounded-full border border-[#e5e5e5] flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:border-transparent text-[#888]">
                    <Check className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4">{obj.title}</h3>
                  <p>{obj.description}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#e5e5e5] pt-12">
            <h4 className="mb-4">{siteSettings.about_facilities_title}</h4>
            <p className="mb-8">{siteSettings.about_facilities_text}</p>
            
            <h3 className="mb-6 font-bold text-lg">Nuestro Centro cumple con:</h3>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <ul className="space-y-4">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Disposición de categorización del Servicio Nacional de Rehabilitación</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Habilitación Municipal correspondiente, constancia de inscripción a la Inspección General de Justicia, AFIP, Ingresos Brutos</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Contamos con servicio de catering el cual brinda menú estacional supervisado por nuestra Nutricionista</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Constancia de limpieza de tanques en forma trimestral. Certificado de Potabilidad del agua</li>
              </ul>
              <ul className="space-y-4">
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Plan de evacuación para emergencias con asignación de roles y certificado de capacitación de las personas, aprobado por Defensa Civil</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Servicio de Seguridad e Higiene. Certificado de desinsectación y desinfección aprobado por APRA</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Póliza de Seguros (Responsabilidad Civil Comprensiva) a través de La Meridional</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" /> Servicio Médico de Emergencias a Través de Emergencias SA</li>
              </ul>
            </div>
            
            <h4 className="mb-4">{siteSettings.about_requirements_title}</h4>
            <div className="bg-[#f5f5f5] p-6 rounded border border-[#e3e3e3]">
              <p className="mb-4">{siteSettings.about_requirements_text}</p>
              <p className="font-semibold mb-2">Los requisitos son:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Mayor a 25 años</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fotocopia de DNI</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Fotocopia de Certificado de Discapacidad</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Work (Actividades) */}
      <section id="actividades" className="w-full py-16 bg-[#f9f9f9] border-t border-b border-[#e5e5e5]">
        <div className="container px-4 md:px-6 mx-auto">
          <h2>Actividades</h2>
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-12">
            
            {/* Left Column */}
            <div className="space-y-12">
              {leftActivities.map((act) => (
                <div key={act.id} className="flex gap-6">
                  <div className="w-[60px] h-[60px] bg-primary rounded-full shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                    {/* Placeholder for legacy icons (thumbs-up, music, heart) */}
                    <div className="w-8 h-8 rounded-full border-2 border-white/50" />
                  </div>
                  <div>
                    <h3 className="text-xl mb-3">{act.title}</h3>
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: act.description }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-12">
              {rightActivities.map((act) => (
                <div key={act.id} className="flex gap-6">
                  <div className="w-[60px] h-[60px] bg-primary rounded-full shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                    <div className="w-8 h-8 rounded-full border-2 border-white/50" />
                  </div>
                  <div>
                    <h3 className="text-xl mb-3">{act.title}</h3>
                    <p className="text-sm" dangerouslySetInnerHTML={{ __html: act.description }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Portfolio (Galería) */}
      <section id="galeria" className="w-full py-16 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <h2>Galería</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 border-b border-[#e5e5e5] pb-4">
            <button className="px-4 py-2 font-bold text-[#111111] hover:text-primary transition-colors border-b-2 border-primary uppercase text-sm">Todas</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Integración</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Terapéutico</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Ocupacional</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Nuestras Manos</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Deportivo</button>
            <button className="px-4 py-2 font-bold text-[#888] hover:text-primary transition-colors border-b-2 border-transparent uppercase text-sm">Terapia Canina</button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="relative group overflow-hidden bg-muted aspect-square">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-center p-4">
                  <h4 className="text-white mt-0 mb-1">{item.title}</h4>
                  <p className="text-white/80 text-sm uppercase">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team (Profesionales) */}
      <section id="equipo" className="w-full py-16 bg-[#f9f9f9] border-t border-[#e5e5e5]">
        <div className="container px-4 md:px-6 mx-auto">
          <h2>Profesionales</h2>
          <h6 className="mb-12">Conoce a nuestro equipo interdisciplinario.</h6>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {professionals.map((prof) => (
              <div key={prof.id} className="text-center group">
                <div className="relative mx-auto w-[180px] h-[180px] rounded-full overflow-hidden border-[5px] border-[#e5e5e5] group-hover:border-primary transition-colors duration-300 mb-6">
                  <Image
                    src={prof.image_url ?? "/profile.jpg"}
                    alt={`${prof.first_name} ${prof.last_name}`}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl mb-2 group-hover:text-primary transition-colors">{prof.first_name} {prof.last_name}</h3>
                <span className="text-[#888888] text-sm block px-4">{prof.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="w-full py-16 bg-white border-t border-[#e5e5e5]">
        <div className="container px-4 md:px-6 mx-auto">
          <h2>{siteSettings.contact_title}</h2>
          
          <div className="max-w-4xl mx-auto text-center mt-8">
            <h3 className="text-2xl text-primary font-bold mb-4">{siteSettings.contact_text}</h3>
            <p className="text-lg text-[#888888] mb-12">
              Los invitamos a conocer nuestro espacio de trabajo concertando una cita, estaremos felices de recibirlos. Estamos en el barrio de Mataderos en la Ciudad Autónoma de Buenos Aires, con las puertas abiertas durante todo el año.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="font-bold text-[#333]">Dirección</p>
                <p className="text-sm mt-2">{siteSettings.contact_address}</p>
              </div>
              
              <div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-5 w-5" />
                </div>
                <p className="font-bold text-[#333]">Teléfono</p>
                <p className="text-sm mt-2">{siteSettings.contact_phone}</p>
              </div>
              
              <div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="font-bold text-[#333]">Horarios</p>
                <p className="text-sm mt-2">{siteSettings.contact_schedule}</p>
              </div>
            </div>

            <InterviewRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
