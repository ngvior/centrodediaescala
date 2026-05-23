export const QUOTE_BAND_TEXT =
  'Nosotros mismos debemos ser el cambio que deseamos ver en el mundo'

export const QUOTE_BAND_BACKGROUND_IMAGE = '/poligan_bg.jpg'

export function QuoteBand() {
  return (
    <section
      aria-label="Frase institucional"
      className="relative isolate flex min-h-[260px] w-full items-center justify-center overflow-hidden bg-[#222222] px-4 py-16 text-center md:min-h-[340px] md:py-24"
      style={{
        backgroundImage: `url(${QUOTE_BAND_BACKGROUND_IMAGE})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 -z-10 bg-black/55" aria-hidden="true" />
      <p className="max-w-5xl font-heading text-2xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-md md:text-4xl md:leading-tight">
        {QUOTE_BAND_TEXT}
      </p>
    </section>
  )
}
