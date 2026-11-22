import { getTranslations } from "next-intl/server";
import { TableSkeleton } from "@/components/ui/DataTable";

export default async function Loading() {
  const t = await getTranslations("errors");
  return <TableSkeleton label={t("loading")} />;
}
