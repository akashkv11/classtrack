type ActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export default function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div
      className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${className}`}
    >
      {children}
    </div>
  );
}

export const actionButtonClassName = "w-full sm:w-auto";
