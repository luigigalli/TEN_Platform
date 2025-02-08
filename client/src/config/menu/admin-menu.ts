import {
  LayoutDashboard,
  Users,
  Shield,
  Lock,
  Settings,
  FileText,
  Database,
  Building2,
  GraduationCap,
  Calendar,
  MessageSquare,
  Star,
  Activity,
  BarChart,
  FileCode2,
  Mail,
  Bell,
} from "lucide-react";
import { MenuItem } from "@/types/menu";

export const adminMenuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    label: "User Management",
    icon: Users,
    href: "/admin/users",
    subItems: [
      {
        label: "Users",
        icon: Users,
        href: "/admin/users",
      },
      {
        label: "Roles",
        icon: Shield,
        href: "/admin/roles",
      },
      {
        label: "Permissions",
        icon: Lock,
        href: "/admin/permissions",
      },
    ],
  },
  {
    label: "Organizations",
    icon: Building2,
    href: "/admin/organizations",
    subItems: [
      {
        label: "List",
        icon: Building2,
        href: "/admin/organizations",
      },
      {
        label: "Types",
        icon: FileText,
        href: "/admin/organization-types",
      },
    ],
  },
  {
    label: "Education",
    icon: GraduationCap,
    href: "/admin/education",
    subItems: [
      {
        label: "Courses",
        icon: FileText,
        href: "/admin/courses",
      },
      {
        label: "Categories",
        icon: FileText,
        href: "/admin/course-categories",
      },
      {
        label: "Enrollments",
        icon: Calendar,
        href: "/admin/enrollments",
      },
    ],
  },
  {
    label: "Community",
    icon: MessageSquare,
    href: "/admin/community",
    subItems: [
      {
        label: "Forums",
        icon: MessageSquare,
        href: "/admin/forums",
      },
      {
        label: "Reviews",
        icon: Star,
        href: "/admin/reviews",
      },
      {
        label: "Activities",
        icon: Activity,
        href: "/admin/activities",
      },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart,
    href: "/admin/analytics",
    subItems: [
      {
        label: "Overview",
        icon: BarChart,
        href: "/admin/analytics",
      },
      {
        label: "Reports",
        icon: FileText,
        href: "/admin/reports",
      },
    ],
  },
  {
    label: "System",
    icon: Settings,
    href: "/admin/system",
    subItems: [
      {
        label: "Settings",
        icon: Settings,
        href: "/admin/settings",
      },
      {
        label: "API",
        icon: FileCode2,
        href: "/admin/api",
      },
      {
        label: "Email",
        icon: Mail,
        href: "/admin/email",
      },
      {
        label: "Notifications",
        icon: Bell,
        href: "/admin/notifications",
      },
      {
        label: "Logs",
        icon: FileText,
        href: "/admin/logs",
      },
      {
        label: "Database",
        icon: Database,
        href: "/admin/database",
      },
    ],
  },
];
