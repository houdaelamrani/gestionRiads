"use client";

/**
 * Reusable clean and minimalist Moroccan Arch & Zellige Star Logo Icon
 * Supports both custom size and style overrides.
 */
export default function LogoIcon({ size = 40, className = "" }) {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: `${Math.round(size * 0.28)}px`,
        background: "linear-gradient(135deg, #D96B43 0%, #B85028 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 14px rgba(217, 107, 67, 0.35)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0
      }}
    >
      <svg
        width={Math.round(size * 0.72)}
        height={Math.round(size * 0.72)}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Moroccan Keyhole Arch Outline */}
        <path
          d="M12 40V24C12 17.3726 17.3726 12 24 12C30.6274 12 36 17.3726 36 24V40"
          stroke="#FAF6F0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M15 24C15 19.0294 19.0294 15 24 15C28.9706 15 33 19.0294 33 24C33 27 30 29 30 32H18C18 29 15 27 15 24Z"
          fill="#0F52BA"
          fillOpacity="0.4"
          stroke="#FAF6F0"
          strokeWidth="1.2"
        />
        {/* 8-point Moroccan Star in Gold */}
        <path
          d="M24 18L25.5 21.5L29 20L27.5 23.5L31 25L27.5 26.5L29 30L25.5 28.5L24 32L22.5 28.5L19 30L20.5 26.5L17 25L20.5 23.5L19 20L22.5 21.5L24 18Z"
          fill="#D4AF37"
        />
        {/* Central Fountain base */}
        <path
          d="M19 36C21 34.5 27 34.5 29 36"
          stroke="#F3E5AB"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="25" r="1.5" fill="#FAF6F0" />
      </svg>
    </div>
  );
}
