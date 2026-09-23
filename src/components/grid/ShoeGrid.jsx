import React, {
    useMemo,
    useState,
    useEffect,
    Suspense,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Leva } from "leva";
// --- REAL DATA IMPORT ---
import shoes from "../../../backend/shoes.json";
import MiniMap from "../MiniMap";
import { DEFAULT_CONFIG, CONFIG } from "./gridConfig";
import { rigState, calculateGridDimensions, EMPTY_COLORS, matchesFilter } from "./gridState";
import { useGridConfig } from "./useGridConfig";
import { Rig } from "./Rig";
import { GridCanvas } from "./GridCanvas";
import { UnifiedControlBar } from "../GridUI";
import Header from "../Header";
import { TopologyBackground } from "../TopologyBackground";
import "../HoloCardMaterial"; // Registers <holoCardMaterial /> with R3F

// --- PRELOAD ALL TEXTURES ---
// This ensures all shoe images are cached before switching collections
shoes.forEach((shoe) => {
    useTexture.preload(shoe.image_url);
});

// --- MAIN EXPORT ---
export default function ShoeGrid() {
    const [zoomTarget, setZoomTarget] = useState(null);
    const [initialZoom] = useState(DEFAULT_CONFIG.zoomOut);
    const [currentZoom, setCurrentZoom] = useState(
        rigState.zoom
    );
    const controls = useGridConfig();
    // Track zoom state for UI components
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentZoom(rigState.zoom);
        }, 50); // Update every 50ms
        return () => clearInterval(interval);
    }, []);
    // Track active selection state
    const [hasActiveSelection, setHasActiveSelection] =
        useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const availableSizes = [38, 39, 40, 41, 42, 43, 44];
    useEffect(() => {
        const interval = setInterval(() => {
            setHasActiveSelection(rigState.activeId !== null);
        }, 16); // Update every frame (60fps) for smoother updates
        return () => clearInterval(interval);
    }, []);
    const isZoomedIn = currentZoom <= CONFIG.zoomIn + 0.5;

    // Responsive zoom for mobile viewports
    useEffect(() => {
        const updateResponsiveZoom = () => {
            const width = window.innerWidth;
            let newZoomOut;
            if (width < 480) {
                newZoomOut = 48; // Phone
            } else if (width < 768) {
                newZoomOut = 38; // Tablet portrait
            } else {
                newZoomOut = DEFAULT_CONFIG.zoomOut; // Desktop default (31)
            }
            CONFIG.zoomOut = newZoomOut;
            // Only update current zoom if we're in zoomed-out state
            if (rigState.zoom > CONFIG.zoomIn + 2) {
                rigState.zoom = newZoomOut;
                setCurrentZoom(newZoomOut);
            }
        };
        updateResponsiveZoom();
        window.addEventListener("resize", updateResponsiveZoom);
        return () => window.removeEventListener("resize", updateResponsiveZoom);
    }, []);

    // Filter state for Nike collection
    const [nikeFilter, setNikeFilter] = useState("all"); // 'all' | 'jordan' | 'dunk'
    const [colorFilter, setColorFilter] = useState(EMPTY_COLORS); // [] = all, ['blue','green'] = blue OR green

    // Collections - Nike (all, unfiltered), New Balance, Under $150
    const collectionsData = useMemo(() => {
        // All Nike shoes (filtering happens in GridCanvas)
        const nike = shoes.filter((s) => s.brand === "Nike");
        // New Balance shoes - take half and double to make 30+ items
        const newBalanceFull = shoes.filter(
            (s) => s.brand === "New Balance"
        );
        const newBalanceHalf = newBalanceFull.slice(0, Math.ceil(newBalanceFull.length / 2));
        const newBalance = [
            ...newBalanceHalf,
            ...newBalanceHalf.map((s, i) => ({
                ...s,
                product_url: `${s.product_url}-dup-${i}`,
            })),
        ];
        // Under $150 (all brands)
        const budget = shoes.filter((s) => {
            const price = parseInt(
                s.price?.replace(/[$,]/g, "") || "999"
            );
            return price < 150;
        });
        return [nike, newBalance, budget];
    }, []);
    // --- Grid Stack State ---
    // Instead of one list of items, we keep a stack of "Rendered Layers".
    // This allows us to have one layer exiting and one layer entering simultaneously.
    // Initial grid uses Nike collection (index 0)
    const [gridLayers, setGridLayers] = useState(() => [
        {
            id: "init",
            items: shoes.filter((s) => s.brand === "Nike"),
            mode: "enter", // 'enter' | 'exit'
            startTime: 0,
        },
    ]);
    const [activeCollectionIdx, setActiveCollectionIdx] =
        useState(0);
    const handleCollectionSwitch = (index) => {
        if (index === activeCollectionIdx) return;
        const now = Date.now();
        setGridLayers((prev) => {
            // 1. Mark existing 'enter' layers as 'exit'
            const exitingLayers = prev.map((layer) =>
                layer.mode === "enter"
                    ? { ...layer, mode: "exit", startTime: now }
                    : layer
            );
            // 2. Add new 'enter' layer
            const newLayer = {
                id: `grid-${index}-${now}`, // Unique ID for key
                items: collectionsData[index],
                mode: "enter",
                startTime: now,
            };
            return [...exitingLayers, newLayer];
        });
        setActiveCollectionIdx(index);
        // Clear Nike filters when leaving Nike collection
        setNikeFilter("all");
        setColorFilter(EMPTY_COLORS);
        rigState.target.set(0, 2, 0);
        rigState.activeId = null;
        // 3. Cleanup old layers after transition time
        setTimeout(() => {
            setGridLayers((prev) =>
                prev.filter((layer) => layer.mode === "enter")
            );
        }, CONFIG.cleanupTimeout);
    };
    // Handle filter change (for Nike collection) - just update filter state
    // The grid will animate items in place
    const handleFilterChange = (filter) => {
        if (filter === nikeFilter) return;
        setNikeFilter(filter);
        rigState.activeId = null;
    };

    // Handle color filter change (accepts array of colors)
    const handleColorFilterChange = (colors) => {
        setColorFilter(colors.length > 0 ? colors : EMPTY_COLORS);
        rigState.activeId = null;
    };

    useEffect(() => {
        if (zoomTarget === "OUT") {
            rigState.zoom = CONFIG.zoomOut;
            setCurrentZoom(CONFIG.zoomOut);
            rigState.target.set(0, 2, 0);
        } else if (typeof zoomTarget === "number") {
            rigState.zoom = zoomTarget;
            setCurrentZoom(zoomTarget);
        }
        setZoomTarget(null);
    }, [zoomTarget]);
    // Determine active grid dimensions for the Rig
    // We use the dimensions of the LAST layer (the incoming one)
    const activeLayer = gridLayers[gridLayers.length - 1];
    // Calculate filtered item count for Nike collection
    const filteredItemCount = useMemo(() => {
        if (activeCollectionIdx !== 0)
            return activeLayer.items.length;
        return activeLayer.items.filter((item) =>
            matchesFilter(item, nikeFilter, colorFilter)
        ).length;
    }, [activeLayer.items, activeCollectionIdx, nikeFilter, colorFilter]);

    const activeDims = calculateGridDimensions(
        filteredItemCount
    );
    const activeProduct = useMemo(() => {
        if (typeof rigState.activeId !== "number") return null;
        return activeLayer?.items?.[rigState.activeId] ?? null;
    }, [activeLayer, gridLayers, rigState.activeId]);

    useEffect(() => {
        setSelectedSize(null);
    }, [activeProduct]);

    const addToCart = (shoe, size = selectedSize) => {
        if (!shoe || !size) return;
        setCartItems((prev) => {
            const existing = prev.find(
                (item) => item.product_url === shoe.product_url && item.size === size
            );
            if (existing) {
                return prev.map((item) =>
                    item.product_url === shoe.product_url && item.size === size
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            const priceNumber = Number(String(shoe.price || "0").replace(/[^\d.]/g, "")) || 0;
            return [...prev, { ...shoe, size, quantity: 1, unitPrice: priceNumber }];
        });
        setCartOpen(true);
    };

    const removeFromCart = (productUrl, size) => {
        setCartItems((prev) => prev.filter((item) => item.product_url !== productUrl || item.size !== size));
    };

    const updateCartQuantity = (productUrl, size, delta) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.product_url === productUrl && item.size === size
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce(
        (sum, item) => sum + (item.unitPrice || 0) * item.quantity,
        0
    );

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                backgroundColor: "#f0f0f0",
                position: "relative",
                overflow: "hidden",
                touchAction: "none", // Prevent mobile browser touch gestures
            }}
        >
            <Leva collapsed={true} hidden={true} />
            <Header cartCount={cartCount} onCartClick={() => setCartOpen((prev) => !prev)} />
            <Canvas
                camera={{ position: [0, 0, initialZoom], fov: 45 }}
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    toneMapping: THREE.NoToneMapping,
                }}
            >
                {/* Rig is now shared, based on the dimensions of the active grid */}
                <Rig
                    gridW={activeDims.width}
                    gridH={activeDims.height}
                />
                {/* Tech Background - geometric lines and crosshairs for CAD/architectural feel */}
                <TopologyBackground
                    isZoomedIn={isZoomedIn}
                    color={CONFIG.bgColor}
                    opacity={CONFIG.bgOpacity}
                    speed={CONFIG.bgSpeed}
                    scale={CONFIG.bgScale}
                    lineThickness={CONFIG.bgLineThickness}
                />
                <fog
                    attach="fog"
                    args={[
                        "#f0f0f0",
                        controls?.fogNear ?? DEFAULT_CONFIG.fogNear,
                        controls?.fogFar ?? DEFAULT_CONFIG.fogFar,
                    ]}
                />
                {/* Suspense boundary for texture loading */}
                <Suspense fallback={null}>
                    {/* Render all active layers (Entering + Exiting) */}
                    {gridLayers.map((layer, layerIdx) => (
                        <GridCanvas
                            key={layer.id} // Essential for React to treat them as different trees
                            items={layer.items}
                            gridVisible={layer.mode === "enter"}
                            transitionStartTime={layer.startTime}
                            interactive={layer.mode === "enter"} // Only entering grid is clickable
                            filter={
                                activeCollectionIdx === 0
                                    ? nikeFilter
                                    : "all"
                            }
                            colorFilter={
                                activeCollectionIdx === 0
                                    ? colorFilter
                                    : EMPTY_COLORS
                            }
                        />
                    ))}
                </Suspense>
            </Canvas>
            <MiniMap
                gridDims={activeDims}
                rigState={rigState}
                config={CONFIG}
                totalItems={filteredItemCount}
                isZoomedIn={isZoomedIn}
            />
            {activeProduct && (
                <div
                    style={{
                        position: "fixed",
                        left: 24,
                        bottom: 92,
                        width: 210,
                        background: "rgba(255,255,255,0.72)",
                        border: "1px solid rgba(0,0,0,0.05)",
                        borderRadius: 20,
                        boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
                        backdropFilter: "blur(14px)",
                        padding: 10,
                        zIndex: 110,
                    }}
                >
                    <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#777", textTransform: "uppercase" }}>
                        Selected sneaker
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 7, alignItems: "center" }}>
                        <img
                            src={activeProduct.image_url}
                            alt={activeProduct.title}
                            style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 12, background: "#eee" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{activeProduct.title}</div>
                            <div style={{ color: "#666", marginTop: 2, fontSize: 10 }}>{activeProduct.price}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 9, color: "#777", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                            Size
                        </div>
                        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                            {availableSizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        minWidth: 26,
                                        height: 24,
                                        padding: "0 6px",
                                        borderRadius: 7,
                                        border: selectedSize === size ? "1px solid #111" : "1px solid rgba(0,0,0,0.12)",
                                        background: selectedSize === size ? "#111" : "#fff",
                                        color: selectedSize === size ? "#fff" : "#222",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => addToCart(activeProduct)}
                        disabled={!selectedSize}
                        style={{
                            width: "100%",
                            marginTop: 9,
                            border: "none",
                            background: "#111",
                            color: "#fff",
                            borderRadius: 999,
                            height: 32,
                            fontWeight: 700,
                            cursor: selectedSize ? "pointer" : "not-allowed",
                            opacity: selectedSize ? 1 : 0.55,
                            fontSize: 11,
                        }}
                    >
                        {selectedSize ? `Add size ${selectedSize}` : "Choose a size"}
                    </button>
                </div>
            )}

            <UnifiedControlBar
                currentCollection={activeCollectionIdx}
                onSwitch={handleCollectionSwitch}
                setZoomTrigger={setZoomTarget}
                isZoomedIn={isZoomedIn}
                hasActiveSelection={hasActiveSelection}
                nikeFilter={nikeFilter}
                onFilterChange={handleFilterChange}
                activeProduct={activeProduct}
                onAddToCart={addToCart}
                selectedSize={selectedSize}
            />

            {cartOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 88,
                        right: 18,
                        width: 232,
                        background: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(18px) saturate(180%)",
                        border: "1px solid rgba(0,0,0,0.04)",
                        borderRadius: 16,
                        boxShadow: "0 12px 24px rgba(0,0,0,0.06)",
                        padding: 10,
                        zIndex: 120,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 10,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "#777", textTransform: "uppercase" }}>
                                Your bag
                            </div>
                            <h3 style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 700 }}>Cart</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCartOpen(false)}
                            style={{
                                border: "none",
                                background: "transparent",
                                fontSize: 24,
                                cursor: "pointer",
                                color: "#000",
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>

                    {cartItems.length === 0 ? (
                        <div style={{ padding: "8px 0 4px", color: "#666" }}>
                            <p style={{ margin: 0, lineHeight: 1.4, fontSize: 13 }}>Seu carrinho está vazio.</p>
                            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#888" }}>Selecione um sneaker para adicionar.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: "grid", gap: 6 }}>
                                {cartItems.map((item) => (
                                    <div
                                        key={`${item.product_url}-${item.size}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "5px 0",
                                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 10,
                                                overflow: "hidden",
                                                background: "linear-gradient(135deg, #f3f3f3, #eaeaea)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <img
                                                src={item.image_url}
                                                alt={item.title}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.2 }}>{item.title}</div>
                                            <div style={{ color: "#666", fontSize: 10, marginTop: 2 }}>
                                                {item.price} · Size {item.size}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <button
                                                type="button"
                                                onClick={() => updateCartQuantity(item.product_url, item.size, -1)}
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: "1px solid rgba(0,0,0,0.12)",
                                                    borderRadius: "50%",
                                                    background: "#fff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                −
                                            </button>
                                            <span style={{ minWidth: 18, textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateCartQuantity(item.product_url, item.size, 1)}
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    border: "1px solid rgba(0,0,0,0.12)",
                                                    borderRadius: "50%",
                                                    background: "#fff",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div
                                style={{
                                    marginTop: 8,
                                    paddingTop: 7,
                                    borderTop: "1px solid rgba(0,0,0,0.05)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: 13 }}>
                                    <span>Total</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, color: "#666", fontSize: 11 }}>
                                    <span>Items</span>
                                    <span>{cartCount}</span>
                                </div>
                            </div>

                            <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
                                <button
                                    type="button"
                                    style={{
                                        background: "#111",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 999,
                                        height: 36,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        fontSize: 12,
                                    }}
                                >
                                    Checkout · ${cartTotal.toFixed(2)}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCartItems([])}
                                    style={{
                                        background: "rgba(0,0,0,0.04)",
                                        color: "#000",
                                        border: "none",
                                        borderRadius: 999,
                                        height: 32,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: 11,
                                    }}
                                >
                                    Clear cart
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
