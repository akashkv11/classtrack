type TableProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Table({ children, className = "" }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <table className="min-w-[640px] w-full text-left text-xs sm:text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-slate-200 bg-slate-50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-slate-100">{children}</tr>;
}

export function TableHeaderCell({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium text-slate-700 sm:px-4 sm:py-3">{children}</th>;
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 sm:px-4 sm:py-3 ${className}`}>{children}</td>;
}
