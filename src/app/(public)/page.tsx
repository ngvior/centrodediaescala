import { createElement, type ReactNode } from "react";

import {
	getActivities,
	getGalleryItems,
	getHomeObjectives,
	getProfessionals,
	getSiteSettings,
	type Activity,
} from "@/lib/api";
import { InterviewRequestForm } from "@/components/interview-request-form";
import { GallerySection } from "@/components/sections/GallerySection";
import { QuoteBand } from "@/components/sections/QuoteBand";
import { AnimateOnScroll } from "@/components/AnimateOnScroll";
import { ObjectiveCard } from "@/components/sections/ObjectiveCard";
import { Check, CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

import { getActivityIcon } from "@/lib/activity-icons";
import { renderInline, renderMarkupBlocks } from "@/lib/markup";
import { cn } from "@/lib/utils";

const CONTACT_MAP_EMBED_URL =
	"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.074723619188!2d-58.49996178756245!3d-34.65281577282383!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcc907d6712975%3A0x45f1a9314f8321b3!2sESCALA%20CENTRO%20DE%20D%C3%8DA!5e0!3m2!1sen!2sar!4v1780450210353!5m2!1sen!2sar";

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

const ACTIVITY_ICON_COLOR = "#1593D7";

// Thin wrapper over the shared grammar: activity descriptions keep their
// inline bold/italic behavior (newlines preserved via whitespace-pre-line).
function renderDescriptionWithBold(text: string): ReactNode[] {
	return renderInline(text);
}

function ActivitySummary({ activity }: { activity: Activity }) {
	return (
		<div className="flex gap-6">
			<div className="w-[60px] h-[60px] bg-white rounded-full shrink-0 flex items-center justify-center shadow-sm mt-1 border border-[#e5e5e5]">
				{createElement(getActivityIcon(activity.icon), {
					className: "h-8 w-8",
					color: ACTIVITY_ICON_COLOR,
					"aria-hidden": "true",
				})}
			</div>
			<div>
				<h3 className="text-xl mb-3">{activity.title}</h3>
				<p className="text-sm leading-[24px] text-[#888888] whitespace-pre-line">
					{renderDescriptionWithBold(activity.description)}
				</p>
			</div>
		</div>
	);
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

	const complianceHalf = Math.ceil(
		siteSettings.about_compliance_items.length / 2,
	);
	const complianceColumns = [
		siteSettings.about_compliance_items.slice(0, complianceHalf),
		siteSettings.about_compliance_items.slice(complianceHalf),
	];
	// getActivities() orders by order_index, so index parity is a stable
	// distribution key for the staggered two-column layout.
	const activityColumns = [
		activities.filter((_, index) => index % 2 === 0),
		activities.filter((_, index) => index % 2 === 1),
	];
	const contactItems = [
		{
			key: "address",
			label: siteSettings.contact_address_label,
			value: siteSettings.contact_address,
			Icon: MapPin,
			iconClassName: "text-[#ff205e]",
		},
		{
			key: "phone",
			label: siteSettings.contact_phone_label,
			value: siteSettings.contact_phone,
			Icon: Phone,
			iconClassName: "text-[#ff7e2e]",
		},
		{
			key: "schedule",
			label: siteSettings.contact_schedule_label,
			value: siteSettings.contact_schedule,
			Icon: Clock,
			iconClassName: "text-[#94d500]",
		},
		{
			key: "email",
			label: siteSettings.contact_email_label,
			value: siteSettings.contact_email,
			Icon: Mail,
			iconClassName: "text-[#49b5e7]",
		},
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
						<AnimateOnScroll
							className="bg-white/80 md:bg-transparent p-6 rounded-lg"
							animationClass="animate-flip-in-y"
						>
							<h3 className="text-[25px] text-[#222222] font-semibold mb-2 font-dosis normal-case tracking-normal">
								{siteSettings.home_hero_subtitle}
							</h3>
							<h2 className="text-[48px] text-[#49b5e7] font-bold mb-6 text-left m-0">
								{siteSettings.home_hero_title}
							</h2>
							<div className="text-[16px] text-escala-gray leading-[26px] mb-8">
								{renderMarkupBlocks(siteSettings.home_hero_text)}
							</div>
							<a
								href="#service"
								className="inline-block px-10 py-4 text-white text-[16px] font-semibold uppercase bg-primary rounded-full hover:bg-secondary transition-colors duration-300"
							>
								{siteSettings.home_hero_cta_label}
							</a>
						</AnimateOnScroll>
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
						<div className="text-lg leading-relaxed text-white">
							{renderMarkupBlocks(siteSettings.about_text, {
								listClassName: "list-disc pl-5 space-y-1 text-left",
							})}
						</div>
					</div>

					<h5 className="text-center">{siteSettings.about_objectives_title}</h5>
					<div className="mx-auto mb-16 flex max-w-[960px] flex-wrap justify-center gap-x-12 gap-y-12">
						{objectives.map((obj, index) => {
							const colors = getObjectiveColor(obj.title);
							const delay = `${index * 150}ms`;

							return (
								<div
									key={obj.id}
									className="w-full sm:w-[calc(50%-24px)] lg:w-[calc(33.33%-32px)]"
								>
									<ObjectiveCard
										title={obj.title}
										description={obj.description}
										delay={delay}
										colors={colors}
									/>
								</div>
							);
						})}
					</div>

					<div className="border-t border-[#e5e5e5] pt-12">
						<h4 className="mb-4">{siteSettings.about_facilities_title}</h4>
						<div className="mb-8">
							{renderMarkupBlocks(siteSettings.about_facilities_text)}
						</div>

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
							<div className="mb-4">
								{renderMarkupBlocks(siteSettings.about_requirements_text)}
							</div>
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
					<div className="mx-auto mt-12 grid max-w-[920px] grid-cols-1 items-start gap-x-12 gap-y-12 md:grid-cols-2">
						{activityColumns.map((column, columnIndex) => (
							<div
								key={columnIndex}
								className={cn(
									"flex flex-col gap-12",
									// Without the emptiness guard an empty second column still
									// contributes its offset, leaving a gap under the heading.
									columnIndex === 1 && column.length > 0 && "md:mt-14",
								)}
							>
								{column.map((act) => (
									<ActivitySummary key={act.id} activity={act} />
								))}
							</div>
						))}
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
			<section id="team" className="w-full py-16 bg-[#ffffff]">
				<div className="container px-4 md:px-6 mx-auto">
					<h2>{siteSettings.professionals_section_title}</h2>
					<h6 className="mb-12 text-center text-gray-600 normal-case text-[18px]">
						{siteSettings.professionals_subtitle}
					</h6>

					<div className="mx-auto flex max-w-[920px] flex-wrap justify-center gap-x-8 gap-y-12">
						{professionals.map((prof) => (
							<div
								key={prof.id}
								className="group w-[calc(50%-16px)] max-w-[280px] text-center lg:w-[calc(33.33%-22px)]"
							>
								<div className="transform transition-transform duration-300 hover:scale-105">
									<div className="relative mx-auto mb-4 h-[140px] w-[140px] overflow-hidden rounded-full sm:mb-6 sm:h-[160px] sm:w-[160px] lg:h-[180px] lg:w-[180px]">
										<Image
											src={prof.image_url ?? "/profile.jpg"}
											alt={`${prof.first_name} ${prof.last_name}`}
											fill
											sizes="(min-width: 1024px) 180px, (min-width: 640px) 160px, 140px"
											className="object-cover transition-transform duration-300 group-hover:scale-110"
										/>
									</div>
									<h3 className="mb-1 text-base transition-transform duration-300 group-hover:scale-105 sm:mb-2 sm:text-xl">
										{prof.first_name} {prof.last_name}
									</h3>
									<span className="block px-2 text-xs text-muted-foreground transition-transform duration-300 group-hover:scale-105 sm:px-4 sm:text-sm">
										{prof.role}
									</span>
								</div>
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
						<div className="text-lg text-muted-foreground mb-12">
							{renderMarkupBlocks(siteSettings.contact_body_text)}
						</div>

						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
							{contactItems.map(
								({ key, label, value, Icon, iconClassName }) => (
									<div key={key} className="px-4 py-2 text-center">
										<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f9f9f9]">
											<Icon
												className={`h-8 w-8 ${iconClassName}`}
												aria-hidden="true"
											/>
										</div>
										<p className="font-bold text-[#333]">{label}</p>
										{key === "email" ? (
											<a
												className="mt-2 block text-sm text-inherit hover:text-primary"
												href={`mailto:${value}`}
											>
												{value}
											</a>
										) : (
											<p className="mt-2 text-sm">{value}</p>
										)}
									</div>
								),
							)}
						</div>

						<div className="mt-12 overflow-hidden rounded-sm">
							<div className="relative aspect-[4/3] w-full">
								<iframe
									src={CONTACT_MAP_EMBED_URL}
									title="Mapa de ubicación de Escala Centro de Día"
									className="absolute inset-0 h-full w-full border-0"
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
									allowFullScreen
								/>
							</div>
						</div>

						<InterviewRequestForm
							copy={{
								title: siteSettings.interview_form_title,
								description: renderMarkupBlocks(
									siteSettings.interview_form_description,
								),
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
