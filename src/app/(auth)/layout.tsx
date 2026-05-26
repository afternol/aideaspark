import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center">
        <Image src="/logo.png" alt="AideaSpark" width={400} height={100} className="h-20 w-auto" priority />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
