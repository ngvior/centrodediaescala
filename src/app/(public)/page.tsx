import {
	getActivities,
	getGalleryItems,
	getHomeObjectives,
	getProfessionals,
	getSiteSettings,
} from "@/lib/api";
import { InterviewRequestForm } from "@/components/interview-request-form";
import { GallerySection } from "@/components/sections/GallerySection";
import { QuoteBand } from "@/components/sections/QuoteBand";
import { Check, CheckCircle2, MapPin, Phone, Clock } from "lucide-react";
import Image from "next/image";

function getObjectiveColor(title: string) {
	const normalizedTitle = title.trim().toLowerCase();
	if (normalizedTitle.includes("independencia")) {
		return {
			hex: "#ff205e",
			borderClass: "border-[#ff205e]",
			textClass: "text-[#ff205e]",
			hoverBg: "hover:bg-[#ff205e]",
		};
	}
	if (
		normalizedTitle.includes("integración") ||
		normalizedTitle.includes("integracion")
	) {
		return {
			hex: "#ff7e2e",
			borderClass: "border-[#ff7e2e]",
			textClass: "text-[#ff7e2e]",
			hoverBg: "hover:bg-[#ff7e2e]",
		};
	}
	if (normalizedTitle.includes("habilidades")) {
		return {
			hex: "#94d500",
			borderClass: "border-[#94d500]",
			textClass: "text-[#94d500]",
			hoverBg: "hover:bg-[#94d500]",
		};
	}
	if (
		normalizedTitle.includes("socialización") ||
		normalizedTitle.includes("socializacion") ||
		normalizedTitle.includes("comunicación") ||
		normalizedTitle.includes("comunicacion")
	) {
		return {
			hex: "#00bfd5",
			borderClass: "border-[#00bfd5]",
			textClass: "text-[#00bfd5]",
			hoverBg: "hover:bg-[#00bfd5]",
		};
	}
	if (normalizedTitle.includes("autoestima")) {
		return {
			hex: "#a35db4",
			borderClass: "border-[#a35db4]",
			textClass: "text-[#a35db4]",
			hoverBg: "hover:bg-[#a35db4]",
		};
	}
	if (normalizedTitle.includes("estrategias")) {
		return {
			hex: "#00bc6f",
			borderClass: "border-[#00bc6f]",
			textClass: "text-[#00bc6f]",
			hoverBg: "hover:bg-[#00bc6f]",
		};
	}
	return {
		hex: "#1593D7",
		borderClass: "border-primary",
		textClass: "text-primary",
		hoverBg: "hover:bg-primary",
	};
}

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
	const complianceHalf = Math.ceil(
		siteSettings.about_compliance_items.length / 2,
	);
	const complianceColumns = [
		siteSettings.about_compliance_items.slice(0, complianceHalf),
		siteSettings.about_compliance_items.slice(complianceHalf),
	];

	return (
		<div className="flex flex-col min-h-screen">
			{/* Top_content (Hero) */}
			<section
				id="top_content"
				className="w-full relative bg-[#f9f9f9] border-b border-[#e5e5e5] overflow-hidden"
			>
				{/* Usamos un div posicionado a la derecha para emular el background legacy que iba a la derecha */}
				<div
					className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block"
					style={{
						backgroundImage: "url(/white_pad.png)",
						backgroundRepeat: "no-repeat",
						backgroundPosition: "right",
					}}
				/>
				<div className="container px-4 md:px-6 mx-auto relative z-10 py-16 md:py-32">
					<div className="grid md:grid-cols-2 gap-8">
						<div className="bg-white/80 md:bg-transparent p-6 rounded-lg animate-flip-in-y">
							<h3 className="text-[25px] text-[#222222] font-semibold mb-2 font-dosis normal-case tracking-normal">
								{siteSettings.home_hero_subtitle}
							</h3>
							<h2 className="text-[48px] text-[#49b5e7] font-bold mb-6 text-left m-0">
								{siteSettings.home_hero_title}
							</h2>
							<p className="text-[16px] text-escala-gray leading-[26px] mb-8">
								{siteSettings.home_hero_text}
							</p>
							<a
								href="#service"
								className="inline-block px-10 py-4 text-white text-[16px] font-semibold uppercase bg-primary rounded-full hover:bg-secondary transition-colors duration-300"
							>
								{siteSettings.home_hero_cta_label}
							</a>
						</div>
						{/* The right side in legacy is empty, leaving space for the background image */}
						<div className="hidden md:block"></div>
					</div>
				</div>
			</section>

			{/* Service (Institucional) */}
			<section id="service" className="w-full py-16 bg-white">
				<div className="container px-4 md:px-6 mx-auto">
					<h2>{siteSettings.about_title}</h2>

					{/* Legacy twitter-feed style intro text */}
					<div className="bg-[#49b5e7] p-8 text-center text-white mb-16 rounded-sm shadow-md">
						<p className="text-lg leading-relaxed text-white">
							{siteSettings.about_text}
						</p>
					</div>

					<h5 className="text-center">{siteSettings.about_objectives_title}</h5>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
						{objectives.map((obj, index) => {
							const colors = getObjectiveColor(obj.title);
							const delay = `${index * 150}ms`;

							return (
								<div key={obj.id} className="text-center group">
									<div
										className={`mx-auto w-[90px] h-[90px] rounded-full border-2 ${colors.borderClass} ${colors.textClass} flex items-center justify-center mb-6 transition-all duration-300 ${colors.hoverBg} hover:text-white hover:border-transparent animate-legacy-zoom-in`}
										style={{ animationDelay: delay, animationFillMode: "both" }}
									>
										<Check
											className="h-8 w-8"
											style={{ color: "currentColor" }}
										/>
									</div>
									<h3
										className="mb-4 text-xl font-bold animate-legacy-fade-in-up"
										style={{ animationDelay: delay, animationFillMode: "both" }}
									>
										{obj.title}
									</h3>
									<p
										className="text-[16px] leading-[26px] text-escala-gray animate-legacy-fade-in-down"
										style={{ animationDelay: delay, animationFillMode: "both" }}
									>
										{obj.description}
									</p>
								</div>
							);
						})}
					</div>

					<div className="border-t border-[#e5e5e5] pt-12">
						<h4 className="mb-4">{siteSettings.about_facilities_title}</h4>
						<p className="mb-8">{siteSettings.about_facilities_text}</p>

						<h3 className="mb-6 font-bold text-lg">
							{siteSettings.about_compliance_title}
						</h3>
						<div className="grid md:grid-cols-2 gap-8 mb-12">
							{complianceColumns.map((items, columnIndex) => (
								<ul key={columnIndex} className="space-y-4">
									{items.map((item) => (
										<li key={item} className="flex items-start gap-2">
											<CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-1" />{" "}
											{item}
										</li>
									))}
								</ul>
							))}
						</div>

						<h4 className="mb-4">{siteSettings.about_requirements_title}</h4>
						<div className="bg-[#f5f5f5] p-6 rounded border border-[#e3e3e3]">
							<p className="mb-4">{siteSettings.about_requirements_text}</p>
							<p className="font-semibold mb-2">
								{siteSettings.about_requirements_label}
							</p>
							<ul className="space-y-2">
								{siteSettings.about_requirements_items.map((item) => (
									<li key={item} className="flex items-center gap-2">
										<Check className="h-4 w-4 text-primary" /> {item}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Work (Actividades) */}
			<section
				id="work_outer"
				className="w-full py-16 bg-[#f9f9f9] border-t border-b border-[#e5e5e5]"
			>
				<div className="container px-4 md:px-6 mx-auto">
					<h2>{siteSettings.activities_section_title}</h2>
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
										<p
											className="text-sm"
											dangerouslySetInnerHTML={{ __html: act.description }}
										/>
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
										<p
											className="text-sm"
											dangerouslySetInnerHTML={{ __html: act.description }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Portfolio (Galería) */}
			<GallerySection
				gallery={gallery}
				gallerySectionTitle={siteSettings.gallery_section_title}
				galleryFilterLabels={siteSettings.gallery_filter_labels}
			/>

			<QuoteBand />

			{/* Team (Profesionales) */}
			<section
				id="team"
				className="w-full py-16 bg-[#f9f9f9] border-t border-[#e5e5e5]"
			>
				<div className="container px-4 md:px-6 mx-auto">
					<h2>{siteSettings.professionals_section_title}</h2>
					<h6 className="mb-12">{siteSettings.professionals_subtitle}</h6>

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
								<h3 className="text-xl mb-2 group-hover:text-primary transition-colors">
									{prof.first_name} {prof.last_name}
								</h3>
								<span className="text-muted-foreground text-sm block px-4">
									{prof.role}
								</span>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Contacto */}
			<section
				id="contact"
				className="w-full py-16 bg-white border-t border-[#e5e5e5]"
			>
				<div className="container px-4 md:px-6 mx-auto">
					<h2>{siteSettings.contact_title}</h2>

					<div className="max-w-4xl mx-auto text-center mt-8">
						<h3 className="text-2xl text-primary font-bold mb-4">
							{siteSettings.contact_text}
						</h3>
						<p className="text-lg text-muted-foreground mb-12">
							{siteSettings.contact_body_text}
						</p>

						<div className="grid md:grid-cols-3 gap-8">
							<div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
								<div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
									<MapPin className="h-5 w-5" />
								</div>
								<p className="font-bold text-[#333]">
									{siteSettings.contact_address_label}
								</p>
								<p className="text-sm mt-2">{siteSettings.contact_address}</p>
							</div>

							<div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
								<div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
									<Phone className="h-5 w-5" />
								</div>
								<p className="font-bold text-[#333]">
									{siteSettings.contact_phone_label}
								</p>
								<p className="text-sm mt-2">{siteSettings.contact_phone}</p>
							</div>

							<div className="p-6 border border-[#e5e5e5] rounded group hover:border-primary transition-colors">
								<div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
									<Clock className="h-5 w-5" />
								</div>
								<p className="font-bold text-[#333]">
									{siteSettings.contact_schedule_label}
								</p>
								<p className="text-sm mt-2">{siteSettings.contact_schedule}</p>
							</div>
						</div>

						<InterviewRequestForm
							copy={{
								title: siteSettings.interview_form_title,
								description: siteSettings.interview_form_description,
								contactNameLabel:
									siteSettings.interview_form_contact_name_label,
								patientNameLabel:
									siteSettings.interview_form_patient_name_label,
								phoneLabel: siteSettings.interview_form_phone_label,
								emailLabel: siteSettings.interview_form_email_label,
								messageLabel: siteSettings.interview_form_message_label,
								messagePlaceholder:
									siteSettings.interview_form_message_placeholder,
								submitLabel: siteSettings.interview_form_submit_label,
								pendingLabel: siteSettings.interview_form_pending_label,
								honeypotLabel: siteSettings.interview_form_honeypot_label,
							}}
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
