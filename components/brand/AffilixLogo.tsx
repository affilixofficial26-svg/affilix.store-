import Image from "next/image";

type AffilixLogoProps = {
  compact?: boolean;
  className?: string;
};

export function AffilixLogo({ compact = false, className = "" }: AffilixLogoProps) {
  if (compact) {
    return <Image className={`${className} object-contain`} src="/brand/logo/affilix-logo-symbol.png" alt="AFFILIX" width={512} height={512} priority />;
  }

  return (
    <Image
      className={`${className} object-contain`}
      src="/brand/logo/affilix-logo-horizontal.png"
      alt="AFFILIX Digital Hub"
      width={1400}
      height={460}
      priority
    />
  );
}
