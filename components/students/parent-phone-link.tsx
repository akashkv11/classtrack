import { parentPhoneCallUrl, parentPhoneInputValue } from "@/lib/phone";

export default function ParentPhoneLink({ phone }: { phone: string }) {
  const number = parentPhoneInputValue(phone);
  return (
    <a href={parentPhoneCallUrl(phone)} aria-label={`Call parent at ${number}`} title="Call parent"
      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800">
      {number}
    </a>
  );
}
