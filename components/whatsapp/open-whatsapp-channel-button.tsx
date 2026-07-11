import { ButtonLink } from "@/components/ui/button";

type OpenWhatsAppChannelButtonProps = {
  channelUrl: string;
  className?: string;
};

export default function OpenWhatsAppChannelButton({
  channelUrl,
  className,
}: OpenWhatsAppChannelButtonProps) {
  return (
    <ButtonLink
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="whatsapp"
      size="sm"
      className={className}
    >
      Open WhatsApp Channel
    </ButtonLink>
  );
}
