export function CareerIcon({
  name,
  className = "h-6 w-6",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "stethoscope":
      return (
        <svg {...common}>
          <path d="M5 3v5a4 4 0 0 0 8 0V3" />
          <path d="M4 3h2M12 3h2" />
          <path d="M9 12v3a5 5 0 0 0 10 0v-1" />
          <circle cx="19" cy="11" r="2" />
        </svg>
      );
    case "knife":
      return (
        <svg {...common}>
          <path d="M4 15 15 4l3 3-9 11-5 1z" />
          <path d="M14 12l4 4 2 4" />
        </svg>
      );
    case "scales":
      return (
        <svg {...common}>
          <path d="M12 3v18M7 21h10" />
          <path d="M5 7h14" />
          <path d="M5 7 2 14h6L5 7zM19 7l-3 7h6l-3-7z" />
        </svg>
      );
    /* Architect: a pair of dividers over the drawing. */
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="1.5" />
          <path d="M11.3 5.8 6 20M12.7 5.8 18 20" />
          <path d="M8 14.5h8" />
        </svg>
      );
    /* Engineer: a gear. */
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
          <circle cx="12" cy="12" r="6.5" />
        </svg>
      );
    /* Founder: a rocket leaving the ground. */
    case "rocket":
      return (
        <svg {...common}>
          <path d="M12 2.5c3 2.2 4.5 5.6 4.5 9.5v4h-9v-4c0-3.9 1.5-7.3 4.5-9.5z" />
          <circle cx="12" cy="10" r="1.6" />
          <path d="M7.5 13.5 5 16v3l2.5-1.5M16.5 13.5 19 16v3l-2.5-1.5" />
          <path d="M10.5 18.5 12 21.5l1.5-3" />
        </svg>
      );
    /* Politician: a lectern. */
    case "podium":
      return (
        <svg {...common}>
          <path d="M5 8h14l-1.5 3h-11z" />
          <path d="M8 11v10M16 11v10M6 21h12" />
          <path d="M12 8V4.5M10.5 4.5h3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function ActionIcon({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "clinic":
      return (
        <svg {...common}>
          <path d="M12 7v8M8 11h8" />
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 4V2M16 4V2" />
        </svg>
      );
    case "study":
      return (
        <svg {...common}>
          <path d="M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z" />
          <path d="M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z" />
        </svg>
      );
    case "rest":
      return (
        <svg {...common}>
          <path d="M20 14a8 8 0 1 1-9.9-9.9A7 7 0 0 0 20 14z" />
        </svg>
      );
    case "paperwork":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "outreach":
      return (
        <svg {...common}>
          <path d="M3 11v3a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
          <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}
