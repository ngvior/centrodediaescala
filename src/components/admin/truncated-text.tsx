type TruncatedTextProps = {
	value: string | null | undefined;
	max?: number;
};

/**
 * Renders text truncated to `max` characters with the full value exposed via
 * the native `title` attribute (hover tooltip). Zero-dependency and
 * server-renderable; used for long professional roles/bios in admin tables.
 */
export function TruncatedText({ value, max = 25 }: TruncatedTextProps) {
	if (!value) {
		return null;
	}

	if (value.length <= max) {
		return <span>{value}</span>;
	}

	return <span title={value}>{value.slice(0, max)}…</span>;
}
