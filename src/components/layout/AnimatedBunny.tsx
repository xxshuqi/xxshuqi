"use client";

export default function AnimatedBunny() {
  return (
    <svg
      className="bunny-mark"
      viewBox="0 0 96 72"
      role="img"
      aria-label="The Wandering Bunny"
    >
      <g className="bunny-mark-float">
        <g className="bunny-mark-ears">
          <path
            d="M31 27c-7-9-7-18-2.5-19.5C33.8 5.8 38 15.5 38.5 26"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <path
            d="M47 26c1.2-10.8 6.5-20.2 11.8-17.8C63.5 10.4 61.7 20 54 28"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
        </g>

        <path
          d="M26.7 45.6c-7.2 4.3-7.5 13.6-1.1 17.1 5.3 2.8 13.2-.2 15.5-7"
          fill="rgba(255,255,255,0.9)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        <path
          d="M44 55.8c.4 6.8 6.2 11 12.1 8.7 4.8-1.9 7-7.2 5.1-12.1"
          fill="rgba(255,255,255,0.9)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />

        <path
          d="M25.4 31.7c3.9-5.3 10.7-8.1 18-7.3 11.3 1.3 19.4 10.3 18.1 20.3-1.2 9.4-10.4 15.9-20.8 14.8l-8.2-.9C23.7 57.6 17 50.8 18 43.4c.6-5.1 3.5-9.2 7.4-11.7Z"
          fill="rgba(255,255,255,0.94)"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />

        <circle cx="34.8" cy="41.2" r="2.5" fill="currentColor" />
        <circle cx="49.2" cy="41.2" r="2.5" fill="currentColor" />
        <path
          d="M41 48.3l3 2.4 3-2.4"
          fill="none"
          stroke="#c66f78"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3.4"
        />

        <g className="bunny-mark-globe">
          <circle
            cx="67.5"
            cy="51"
            r="15.5"
            fill="#9fbccc"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            d="M57.5 45.9c3.7.3 4.9 2.8 8 2.2 2.8-.6 3.2-3 6.1-3 2 0 3.5 1.4 4.9 2.7"
            fill="none"
            stroke="#78996d"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.8"
          />
          <path
            d="M56.2 55.4c2.7-2 5.5-.9 6.2 1.2.5 1.7-.5 3.5-2 4.9"
            fill="none"
            stroke="#78996d"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.8"
          />
          <path
            d="M69.4 59.2c1.9-2.1 4.8-1.8 6.2-.2"
            fill="none"
            stroke="#78996d"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.8"
          />
        </g>

        <path
          d="M55.2 49.8c3.2 4.1 6.3 5.8 10.7 5.7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4.6"
        />
      </g>
    </svg>
  );
}
