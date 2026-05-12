import { DemoChrome } from "@/components/demo/DemoChrome";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DemoLayout({ children }: Props) {
  return <DemoChrome>{children}</DemoChrome>;
}
