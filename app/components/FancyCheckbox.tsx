type Props = {
    label?: React.ReactNode;
    checked: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
    className?: string;
};

export default function FancyCheckbox({ label, checked, onChange, disabled, className }: Props) {
    return (
        <label className={`inline-flex items-center gap-3 cursor-pointer select-none group ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className ?? ""}`}>
            <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
            <span
                className="relative inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-slate-300 bg-white shadow-sm transition-all duration-200 transform group-hover:scale-110 peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500 peer-checked:border-purple-500 peer-checked:shadow-lg peer-checked:shadow-purple-500/25"
                aria-hidden
            >
                <svg
                    viewBox="0 0 24 24"
                    className="absolute h-4 w-4 text-white opacity-0 transition-all duration-200 transform scale-75 peer-checked:opacity-100 peer-checked:scale-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </span>
            {label !== undefined && (
                <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600 transition-colors">
                    {label}
                </span>
            )}
        </label>
    );
}
