import { RhShell } from "@/components/layout/RhShell";

export default function RhLayout({ children }: { children: React.ReactNode }) {
  return <RhShell>{children}</RhShell>;
}
