import React from "react";

export default function Header({ cartCount = 0, onCartClick }) {
  return (
    <header
      className="site-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          pointerEvents: "auto",
        }}
      >
        {/* Text logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontFamily:
                  "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                color: "#000",
                textTransform: "uppercase",
              }}
            >
              SNEAK
            </span>
            <span
              style={{
                fontFamily:
                  "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: "13px",
                fontWeight: "300",
                letterSpacing: "0.12em",
                color: "#000",
                textTransform: "uppercase",
              }}
            >
              X
            </span>
          </div>
          <span
            style={{
              fontFamily:
                "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: "6.5px",
              fontWeight: "400",
              letterSpacing: "0.2em",
              color: "#969696",
              textTransform: "uppercase",
              marginTop: "-1px",
            }}
          >
            STYLE LAB
          </span>
        </div>
      </div>

      {/* Right side - minimal nav hints */}
      <div
        className="header-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          pointerEvents: "auto",
        }}
      >
        <NavItem label="DROP" number="01" />
        <NavItem label="CURATED" number="02" />
        <Divider />
        <QuoteText text="SNEAKX" />
        <CartButton count={cartCount} onClick={onCartClick} />
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .site-header {
            padding: 16px 20px !important;
          }
          .header-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

function CartButton({ count = 0, onClick }) {
  return (
    <button
      type="button"
      aria-label="Carrinho"
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "34px",
        height: "34px",
        borderRadius: "999px",
        border: "1px solid rgba(0,0,0,0.05)",
        background: "rgba(17,17,17,0.82)",
        boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 12px 22px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.12)";
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 5H5L7.2 14.5C7.38 15.25 8.07 15.75 8.85 15.75H16.8C17.55 15.75 18.23 15.28 18.42 14.56L20.4 8.25H6.1"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="18.5" r="1.3" fill="#ffffff" />
        <circle cx="17" cy="18.5" r="1.3" fill="#ffffff" />
      </svg>

      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-4px",
            right: "-2px",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "999px",
            background: "#d4a373",
            color: "#111111",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NavItem({ label, number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "6px",
        cursor: "pointer",
        opacity: 0.6,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) =>
      (e.currentTarget.style.opacity = 1)
      }
      onMouseLeave={(e) =>
      (e.currentTarget.style.opacity = 0.6)
      }
    >
      <span
        style={{
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "9px",
          fontWeight: "400",
          color: "#999",
        }}
      >
        {number}
      </span>
      <span
        style={{
          fontFamily:
            "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "11px",
          fontWeight: "500",
          letterSpacing: "0.08em",
          color: "#000",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "12px",
        background: "rgba(0,0,0,0.15)",
      }}
    />
  );
}

function QuoteText({ text }) {
  return (
    <span
      style={{
        fontFamily:
          "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "11px",
        fontWeight: "400",
        letterSpacing: "0.05em",
        color: "#000",
        opacity: 0.4,
      }}
    >
      "{text}"
    </span>
  );
}
