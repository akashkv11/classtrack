export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return <p className="text-slate-600">{message}</p>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-slate-600">{message}</p>;
}
