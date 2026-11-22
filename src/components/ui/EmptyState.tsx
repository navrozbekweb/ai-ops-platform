import type { ReactNode } from "react";
import { InboxOutlined } from "@ant-design/icons";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span aria-hidden="true" className="text-muted text-3xl">
        <InboxOutlined />
      </span>
      <p className="text-base font-semibold">{title}</p>
      {text ? <p className="text-muted max-w-sm text-sm">{text}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
