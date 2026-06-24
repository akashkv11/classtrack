import FieldError from "@/components/ui/field-error";
import { inputClassName } from "@/lib/validation";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export default function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  inputClassName?: string;
};

export function TextInput({ error, className = "", ...props }: TextInputProps) {
  return (
    <input className={inputClassName(!!error, className)} {...props} />
  );
}

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export function SelectInput({ error, className = "", children, ...props }: SelectInputProps) {
  return (
    <select className={inputClassName(!!error, className)} {...props}>
      {children}
    </select>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
