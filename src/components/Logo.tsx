export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="120" rx="28" fill="#96FE17" />
      <path
        d="M60 25C41.222 25 26 40.222 26 59C26 77.778 41.222 93 60 93C78.778 93 94 77.778 94 59C94 40.222 78.778 25 60 25Z"
        stroke="#0A0A0A"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M60 25V93"
        stroke="#0A0A0A"
        strokeWidth="3"
      />
      <path
        d="M26 59H94"
        stroke="#0A0A0A"
        strokeWidth="3"
      />
      <path
        d="M35 35C45 45 55 52 60 59C65 52 75 45 85 35"
        stroke="#0A0A0A"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M35 83C45 73 55 66 60 59C65 66 75 73 85 83"
        stroke="#0A0A0A"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}
