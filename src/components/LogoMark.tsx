type LogoMarkProps = {
  className?: string;
};

export const LogoMark = ({ className }: LogoMarkProps) => (
  <svg
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path
      d="M18 42L58 12h44L72 42l34 36H63z"
      fill="currentColor"
      fillRule="evenodd"
    />
    <path
      d="M102 78L62 108H18l28-30L12 42h43z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);












