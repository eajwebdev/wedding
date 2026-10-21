type Props = { lines: string[]; className?: string; as?: "h1" | "h2" | "p" };

/** Renders each word in a mask so GSAP can lift it into view. Wrap words in *asterisks* for italics. */
export default function SplitTitle({ lines, className = "", as: Tag = "h2" }: Props) {
  const label = lines.join(" ").replace(/\*/g, "");
  let italic = false;
  return (
    <Tag className={`split ${className}`} aria-label={label}>
      {lines.map((line, li) => (
        <span className="split-line" key={li} aria-hidden="true">
          {line.split(" ").map((word, wi) => {
            if (word.startsWith("*")) italic = true;
            const isItalic = italic;
            if (word.endsWith("*")) italic = false;
            const clean = word.replace(/\*/g, "");
            return <span className="split-word" key={wi}><span className="split-inner">{isItalic ? <i>{clean}</i> : clean}</span></span>;
          })}
        </span>
      ))}
    </Tag>
  );
}
