import type { ReactNode } from "react";
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { Section } from "@/lib/auth/roles";

const ICONS: Record<Section, ReactNode> = {
  dashboard: <DashboardOutlined />,
  users: <TeamOutlined />,
  roles: <SafetyCertificateOutlined />,
  analytics: <BarChartOutlined />,
  team: <ApartmentOutlined />,
  tasks: <CheckSquareOutlined />,
  approvals: <SafetyCertificateOutlined />,
  documents: <FileTextOutlined />,
  ai: <ThunderboltOutlined />,
  audit: <AuditOutlined />,
  settings: <SettingOutlined />,
  profile: <UserOutlined />,
};

export function NavIcon({ section }: { section: Section }) {
  return (
    <span aria-hidden="true" className="text-base leading-none">
      {ICONS[section]}
    </span>
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
