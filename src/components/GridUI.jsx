import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CONFIG } from "./grid/gridConfig";
// 1. THE PHYSICS
// High stiffness, moderate damping = "Snappy but smooth" (Apple feel)
const islandTransition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 1,
};

export function UnifiedControlBar({
  currentCollection,
  onSwitch,
  setZoomTrigger,
  isZoomedIn,
  hasActiveSelection,
  nikeFilter,
  onFilterChange,
  activeProduct,
  onAddToCart,
  selectedSize,
}) {
  const collections = [
    "Nike",
    "New Balance",
    "Under $150",
  ];

  const nikeFilters = [
    { id: "all", label: "All" },
    { id: "jordan", label: "Jordan" },
    { id: "dunk", label: "Dunk" },
  ];

  return (
    <div
      className="control-bar-container"
      style={{
        position: "fixed",
        bottom: "40px",
        left: "0",
        right: "0",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      {/* 
        THE ISLAND CONTAINER
        - layout: Animates width/height changes
        - borderRadius: 32px is standard for pill shapes
      */}
      <motion.div
        className="control-bar-island"
        layout
        transition={islandTransition}
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 248, 248, 0.9) 52%, rgba(238, 238, 238, 0.92) 100%)",
          backdropFilter: "blur(26px) saturate(110%)",
          WebkitBackdropFilter: "blur(26px) saturate(110%)",
          borderRadius: "32px",
          border: "1px solid rgba(0, 0, 0, 0.07)",
          boxShadow:
            "0 10px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          pointerEvents: "auto",
          height: "56px",
          overflow: "visible",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* 
          mode="popLayout" is CRITICAL. 
          It lets the outgoing component "pop" out of the layout flow 
          so the container can instantly shrink/grow to the new content's size.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          {hasActiveSelection ? (
            /* ---------------- STATE 1: BUY NOW (Active Selection) ---------------- */
            <motion.button
              key="buy-now-mode"
              initial={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              onClick={() => onAddToCart?.(activeProduct)}
              disabled={!selectedSize}
              style={{
                background: "#000",
                color: selectedSize ? "#fff" : "rgba(255,255,255,0.55)",
                border: "none",
                borderRadius: "24px",
                padding: "0 24px",
                height: "44px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: selectedSize ? "pointer" : "not-allowed",
                opacity: selectedSize ? 1 : 0.6,
                display: "flex",
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {selectedSize ? `Add size ${selectedSize}` : "Choose a size"}
            </motion.button>
          ) : isZoomedIn ? (
            /* ---------------- STATE 2: COMPACT (Zoomed In) ---------------- */
            <motion.div
              key="compact-mode"
              initial={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              style={{ display: "flex" }}
            >
              <ControlButton
                icon="remove"
                onClick={() => setZoomTrigger("OUT")}
                label="Zoom Out"
              />
            </motion.div>
          ) : (
            /* ---------------- STATE 2: EXPANDED (Zoomed Out) ---------------- */
            <motion.div
              key="expanded-mode"
              initial={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                filter: "blur(4px)",
              }}
              transition={{
                ...islandTransition,
                opacity: { duration: 0.2 },
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ControlButton
                icon="add"
                onClick={() =>
                  setZoomTrigger(CONFIG.zoomIn)
                }
                label="Zoom In"
              />

              {/* Vertical Divider */}
              <motion.div
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "24px" }}
                transition={{ delay: 0.1 }}
                style={{
                  width: "1px",
                  background: "rgba(0,0,0,0.08)",
                  margin: "0 2px",
                  boxShadow:
                    "0 0 1px rgba(255, 255, 255, 0.3)", // Subtle highlight for glassy feel
                }}
              />

              {/* Collection Tabs Group */}
              <div style={{ display: "flex", gap: "2px" }}>
                {collections.map((name, index) => {
                  const isActive =
                    currentCollection === index;
                  return (
                    <TabButton
                      key={name}
                      isActive={isActive}
                      onClick={() => onSwitch(index)}
                    >
                      {name}
                    </TabButton>
                  );
                })}
              </div>

              {/* Nike Filters - single clickable group so the interaction is stable across layouts */}
              {currentCollection === 0 && (
                <div className="filter-rail">
                  <motion.div
                    layout
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={islandTransition}
                    style={{
                      width: "1px",
                      height: "24px",
                      background: "rgba(0,0,0,0.08)",
                      margin: "0 6px",
                      transformOrigin: "center",
                    }}
                  />

                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={islandTransition}
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    {nikeFilters.map((filter) => (
                      <FilterChip
                        key={filter.id}
                        isActive={nikeFilter === filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        layoutGroup="desktop"
                      >
                        {filter.label}
                      </FilterChip>
                    ))}
                  </motion.div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Responsive scaling for shorter viewports (tablets) and mobile */}
      <style>{`
        .filter-rail {
          display: flex;
          align-items: center;
          pointer-events: auto;
          z-index: 2;
        }
        .tab-button,
        .filter-chip,
        .control-button {
          pointer-events: auto !important;
        }
        @media (max-height: 800px) {
          .control-bar-container {
            bottom: 24px !important;
          }
          .control-bar-island {
            height: 48px !important;
            border-radius: 24px !important;
            padding: 4px !important;
          }
        }
        @media (max-height: 650px) {
          .control-bar-container {
            bottom: 16px !important;
          }
          .control-bar-island {
            height: 44px !important;
          }
        }
        @media (max-width: 768px) {
          .control-bar-container {
            bottom: 20px !important;
          }
          .control-bar-island {
            height: 48px !important;
            padding: 4px !important;
          }
          .filter-rail {
            transform: scale(0.96);
            transform-origin: center;
          }
        }
        @media (max-width: 480px) {
          .control-bar-container {
            bottom: 16px !important;
          }
          .control-bar-island {
            height: 44px !important;
          }
          .control-button {
            width: 36px !important;
            height: 36px !important;
          }
          .tab-button {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .filter-chip {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- Sub-components for cleaner code & isolated animations ---

function ControlButton({ onClick, icon, label }) {
  return (
    <motion.button
      layout="position" // Prevents icon distortion during resize
      onClick={onClick}
      className="control-button"
      whileHover={{
        scale: 1.05,
        backgroundColor: "rgba(0,0,0,0.05)",
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
      }}
      aria-label={label}
    >
      {/* Simple SVG Icons instead of text for a sharper look */}
      {icon === "add" ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      )}
    </motion.button>
  );
}

function TabButton({ children, isActive, onClick }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className="tab-button"
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        color: isActive ? "#111" : "#666",
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap", // Prevents text wrapping during resize
        zIndex: 1,
        transition: "color 0.2s ease",
      }}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          transition={islandTransition}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow:
              "0 3px 10px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
            zIndex: -1,
          }}
        />
      )}
    </motion.button>
  );
}

function FilterChip({ children, isActive, onClick, layoutGroup = "default" }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      className="filter-chip"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={islandTransition}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        color: isActive ? "#fff" : "#555",
        padding: "6px 10px",
        borderRadius: "14px",
        fontSize: "12px",
        fontWeight: "500",
        cursor: "pointer",
        whiteSpace: "nowrap",
        zIndex: 1,
        pointerEvents: "auto",
      }}
    >
      {/* Animated background pill */}
      {isActive && (
        <motion.div
          layoutId={`activeFilterIndicator-${layoutGroup}`}
          transition={islandTransition}
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #121212 0%, #222 40%, #111 100%)",
            borderRadius: "14px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 14px rgba(0,0,0,0.12)",
            zIndex: -1,
          }}
        />
      )}
      {!isActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.62)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: "14px",
            zIndex: -1,
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}
