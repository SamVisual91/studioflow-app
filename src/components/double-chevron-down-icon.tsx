export function DoubleChevronDownIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 80 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 10L40 40L70 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
      <path
        d="M10 34L40 64L70 34"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="8"
      />
    </svg>
  );
}
