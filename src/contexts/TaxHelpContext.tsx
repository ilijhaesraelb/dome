import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type HelpMode = "beginner" | "professional";

interface TaxHelpContextValue {
  helpMode: HelpMode;
  setHelpMode: (mode: HelpMode) => void;
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
  toggleHelp: () => void;
}

const TaxHelpContext = createContext<TaxHelpContextValue | null>(null);

export function TaxHelpProvider({ children, defaultMode = "beginner" }: { children: ReactNode; defaultMode?: HelpMode }) {
  const [helpMode, setHelpMode] = useState<HelpMode>(() => {
    const saved = localStorage.getItem("dome_tax_help_mode");
    return (saved === "professional" ? "professional" : defaultMode);
  });
  const [showHelp, setShowHelp] = useState(true);

  const handleSetMode = useCallback((mode: HelpMode) => {
    setHelpMode(mode);
    localStorage.setItem("dome_tax_help_mode", mode);
  }, []);

  const toggleHelp = useCallback(() => setShowHelp(prev => !prev), []);

  return (
    <TaxHelpContext.Provider value={{ helpMode, setHelpMode: handleSetMode, showHelp, setShowHelp, toggleHelp }}>
      {children}
    </TaxHelpContext.Provider>
  );
}

export function useTaxHelp() {
  const ctx = useContext(TaxHelpContext);
  if (!ctx) throw new Error("useTaxHelp must be used within TaxHelpProvider");
  return ctx;
}
