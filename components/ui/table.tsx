type TableProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Table({ children, className = "" }: TableProps) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <table className="min-w-full text-left text-sm">{children}</table>
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
  return <th className="px-4 py-3 font-medium text-slate-700">{children}</th>;
}

export function TableCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
