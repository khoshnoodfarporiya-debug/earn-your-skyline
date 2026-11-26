import Image from "next/image";

/**
 * The lit-window mark beside the name (Nov 2026, docs/BRAND.md).
 *
 * The name is real text in the game's display face, not a picture of text:
 * it stays sharp at any size, reads to a screen reader as the heading it is,
 * and changes with the type if the design system changes. The mark beside it
 * is decorative (empty alt) because the words already say what it is.
 */
export function BrandLockup({
  as: Heading = "h1",
  size = "lg",
}: {
  as?: "h1" | "p";
  size?: "lg" | "md";
}) {
  const mark = size === "lg" ? 72 : 52;
  return (
    <Heading className="flex items-center gap-4">
      <Image
        src="/visuals/brand/logo-mark-256.webp"
        alt=""
        width={mark}
        height={mark}
        priority
        className="shrink-0 shadow-[0_8px_30px_-12px_rgba(244,184,96,0.45)]"
        style={{ borderRadius: mark * 0.22 }}
      />
      <span
        className={`display leading-[0.95] tracking-tight text-ink ${
          size === "lg" ? "text-[40px] sm:text-[52px]" : "text-[30px]"
        }`}
      >
        Earn Your
        <br />
        <span className="text-gold">Skyline</span>
      </span>
    </Heading>
  );
}
