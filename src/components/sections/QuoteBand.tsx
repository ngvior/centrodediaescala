export const QUOTE_BAND_TEXT =
	"Nosotros mismos debemos ser el cambio que deseamos ver en el mundo";

export const QUOTE_BAND_BACKGROUND_IMAGE = "/poligan_bg.jpg";

export function QuoteBand() {
	return (
		<section
			aria-label="Frase institucional"
			className="relative flex min-h-[180px] w-full items-center justify-center overflow-hidden px-4 py-10 text-center md:min-h-[230px] md:py-14"
			style={{
				backgroundImage: `url(${QUOTE_BAND_BACKGROUND_IMAGE})`,
				backgroundPosition: "left top",
				backgroundRepeat: "no-repeat",
				backgroundSize: "cover",
			}}
		>
			<p className="max-w-5xl font-sans text-[25px] font-normal normal-case leading-tight text-white">
				{QUOTE_BAND_TEXT}
			</p>
		</section>
	);
}
