interface LoaderProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    className?: string;
}

export default function Loader({ size = "md", text, className = "" }: LoaderProps) {
    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-8 h-8", 
        lg: "w-12 h-12"
    };

    const textSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg"
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div className="relative">
                <div className={`${sizeClasses[size]} border-2 border-slate-200/30 rounded-full`}></div>
                <div className={`${sizeClasses[size]} border-2 border-transparent border-t-purple-500 rounded-full animate-spin absolute top-0`}></div>
                <div className={`${sizeClasses[size]} border-2 border-transparent border-b-pink-500 rounded-full animate-spin absolute top-0`} style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
            </div>
            {text && (
                <div className={`${textSizes[size]} text-slate-600 font-medium animate-pulse`}>
                    {text}
                </div>
            )}
        </div>
    );
}