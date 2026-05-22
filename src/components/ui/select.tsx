"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

// ─── Context ─────────────────────────────────────────────────────────────────

interface SelectContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  onValueChange: (v: string) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  registerItem: (value: string, label: string) => void;
  getLabel: (value: string) => string | undefined;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

// ─── Select Root ─────────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value: controlledValue, defaultValue = "", onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const itemLabels = React.useRef<Map<string, string>>(new Map());

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = React.useCallback(
    (v: string) => {
      if (controlledValue === undefined) setInternalValue(v);
      onValueChange?.(v);
    },
    [controlledValue, onValueChange]
  );

  const registerItem = React.useCallback((itemValue: string, label: string) => {
    itemLabels.current.set(itemValue, label);
  }, []);

  const getLabel = React.useCallback((itemValue: string) => {
    return itemLabels.current.get(itemValue);
  }, []);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      const dropdown = document.querySelector("[data-select-content]");
      if (dropdown?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <SelectContext.Provider value={{ open, setOpen, value, onValueChange: handleValueChange, triggerRef, registerItem, getLabel }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

// ─── SelectTrigger ───────────────────────────────────────────────────────────

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, triggerRef } = useSelectContext();

    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref, triggerRef]
    );

    return (
      <button
        ref={mergedRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-[#1a1f36]/80 px-3 py-2 text-sm text-white/90 transition-all duration-200",
          "hover:border-[#C1D82F]/30 hover:bg-[#1a1f36]",
          "focus:outline-none focus:ring-2 focus:ring-[#C1D82F]/40 focus:border-[#C1D82F]/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[#C1D82F]/50 ring-2 ring-[#C1D82F]/20",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-white/40 transition-transform duration-200 shrink-0 ml-2",
            open && "rotate-180 text-[#C1D82F]"
          )}
        />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

// ─── SelectValue ─────────────────────────────────────────────────────────────

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

function SelectValue({ placeholder, className }: SelectValueProps) {
  const { value, getLabel } = useSelectContext();
  const [displayLabel, setDisplayLabel] = React.useState<string | null>(null);

  // Re-check label whenever value changes
  React.useEffect(() => {
    if (!value) {
      setDisplayLabel(null);
      return;
    }
    // Try immediately
    const label = getLabel(value);
    if (label) {
      setDisplayLabel(label);
    } else {
      // Retry after items register
      const timer = setTimeout(() => {
        setDisplayLabel(getLabel(value) || null);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [value, getLabel]);

  return (
    <span className={cn("block truncate", !displayLabel && "text-white/40", className)}>
      {displayLabel || placeholder || "Seleccionar..."}
    </span>
  );
}

// ─── SelectContent ───────────────────────────────────────────────────────────

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

function SelectContent({ children, className }: SelectContentProps) {
  const { open } = useSelectContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-select-content
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className={cn(
            "absolute left-0 right-0 z-[9999] mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#C1D82F]/20 bg-[#141824] shadow-2xl shadow-black/40 backdrop-blur-xl",
            className
          )}
          style={{ minWidth: 180 }}
        >
          <div className="p-1">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── SelectItem ──────────────────────────────────────────────────────────────

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function SelectItem({ value: itemValue, children, className }: SelectItemProps) {
  const { value, onValueChange, setOpen, registerItem } = useSelectContext();
  const isSelected = value === itemValue;

  // Register this item's label on mount
  const labelText = typeof children === "string" ? children : "";
  React.useEffect(() => {
    if (labelText) {
      registerItem(itemValue, labelText);
    }
  }, [itemValue, labelText, registerItem]);

  // Also register via ref for non-string children
  const itemRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!labelText && itemRef.current) {
      const text = itemRef.current.textContent || "";
      if (text) registerItem(itemValue, text);
    }
  }, [itemValue, labelText, registerItem]);

  return (
    <button
      ref={itemRef}
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        onValueChange(itemValue);
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150 text-left",
        "hover:bg-[#C1D82F]/10 hover:text-[#C1D82F]",
        isSelected
          ? "bg-[#C1D82F]/15 text-[#C1D82F] font-medium"
          : "text-white/70",
        className
      )}
    >
      <span className="flex-1 truncate">{children}</span>
      {isSelected && <Check className="h-3.5 w-3.5 text-[#C1D82F] shrink-0" />}
    </button>
  );
}

// ─── Stubs for compatibility ─────────────────────────────────────────────────

function SelectGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-1", className)}>{children}</div>;
}

function SelectLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-3 py-1.5 text-xs font-medium text-white/40", className)}>{children}</div>;
}

function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-white/10", className)} />;
}

const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
