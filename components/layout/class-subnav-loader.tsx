import { notFound } from "next/navigation";
import { ClassMetaSync } from "@/components/classes/class-provider";
import ClassSubnav from "@/components/layout/class-subnav";
import { getClassNavContext } from "@/lib/queries/classes";

type ClassSubnavLoaderProps = {
  classId: string;
};

export default async function ClassSubnavLoader({ classId }: ClassSubnavLoaderProps) {
  const cls = await getClassNavContext(classId);
  if (!cls) notFound();

  return (
    <>
      <ClassMetaSync
        meta={{
          displayName: cls.displayName,
          whatsappNumber: cls.whatsappNumber,
          whatsappChannelUrl: cls.whatsappChannelUrl,
        }}
      />
      <ClassSubnav displayName={cls.displayName} />
    </>
  );
}
