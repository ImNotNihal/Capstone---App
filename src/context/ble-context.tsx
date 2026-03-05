// BleProvider.tsx
import React, {createContext, useContext, ReactNode} from "react";
import useBLEInternal from "@/src/hooks/useBLE"; // rename your current hook

type BleContextValue = ReturnType<typeof useBLEInternal>;

const BleContext = createContext<BleContextValue | null>(null);

export function BleProvider({children}: {children: ReactNode}) {
    const ble = useBLEInternal(); // this runs ONCE for the whole app

    return <BleContext.Provider value={ble}>{children}</BleContext.Provider>;
}

export function useBLE() {
    const ctx = useContext(BleContext);
    if (!ctx) {
        throw new Error("useBLE must be used inside <BleProvider>");
    }
    return ctx;
}
