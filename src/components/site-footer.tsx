import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

// Brand glyphs — lucide-react has no Discord/Instagram, so inline SVGs.
function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const TEXT_SECTIONS = [
  {
    label: "Navegue",
    items: [
      { label: "Feed", href: "/" },
      { label: "Ranking", href: "/ranking" },
      { label: "Loja", href: "/loja" },
      { label: "Inhouse", href: "/inhouse" },
      { label: "Flex", href: "/flex" },
    ],
  },
  {
    label: "Sobre",
    items: [
      { label: "Comunidade", href: "/comunidade" },
      { label: "Regras", href: "/regras" },
      { label: "FAQ", href: "/faq" },
      { label: "Suporte", href: "/suporte" },
      { label: "Logs", href: "/logs" },
    ],
  },
];

const CONNECT_ITEMS: Array<{
  icon: IconCmp;
  label: string;
  href: string;
  external: boolean;
}> = [
  {
    icon: DiscordIcon,
    label: "Discord",
    href: "https://discord.gg/c6jV9RFAwG",
    external: true,
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-[60px] w-full border-t border-[#ececec] bg-[#f7f7f7] xl:mt-[80px]">
      <div className="w-full px-4 pb-[20px] pt-[40px] sm:px-6 xl:px-[45px] xl:pb-[28px] xl:pt-[60px]">
        <div className="grid grid-cols-1 gap-y-[32px] md:grid-cols-[35fr_65fr] md:gap-x-[40px]">
          {/* Left: isolated logo (33%) */}
          <div>
            <Link
              href="/"
              aria-label="Baderna"
              className="flex w-fit -ml-[12px] text-[#0f0f0f] transition-colors duration-200 hover:text-[#ff4100] sm:-ml-[12px] xl:ml-0"
            >
              <span
                className="block h-[44px] w-[64px] bg-current"
                style={{
                  maskImage: "url('/logo.svg')",
                  maskPosition: "left center",
                  maskRepeat: "no-repeat",
                  maskSize: "contain",
                  WebkitMaskImage: "url('/logo.svg')",
                  WebkitMaskPosition: "left center",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                }}
              />
            </Link>
          </div>

          {/* Right: all rows (66%) */}
          <div>
            {TEXT_SECTIONS.map((section) => (
              <div
                key={section.label}
                className="grid grid-cols-1 gap-y-[22px] md:gap-y-[14px] border-b border-[#ececec] py-[32px] first:pt-0 md:grid-cols-[140px_1fr] md:gap-x-[40px]"
              >
                <span className="text-[14px] font-medium text-[#9c9c9c]">
                  {section.label}
                </span>
                <div className="grid grid-cols-2 gap-x-[24px] gap-y-[24px] sm:grid-cols-3 sm:gap-y-[10px] md:grid-cols-5">
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-60"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Connect cards */}
            <div className="grid grid-cols-1 gap-y-[22px] md:gap-y-[14px] py-[32px] md:grid-cols-[140px_1fr] md:gap-x-[40px]">
              <span className="text-[14px] font-medium text-[#9c9c9c]">
                Conecte-se
              </span>
              <div className="grid grid-cols-1 gap-[12px]">
                {CONNECT_ITEMS.map(({ icon: Icon, label, href, external }) => (
                  <a
                    key={label}
                    href={href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="group relative flex h-[120px] items-end overflow-hidden rounded-[18px] bg-[#ededed] p-[16px] transition-colors hover:bg-[#e3e3e3]"
                  >
                    <Icon
                      className="absolute left-[16px] top-[16px] h-[18px] w-[18px] text-[#a8a8a8] transition-colors group-hover:text-[#0f0f0f]"
                      strokeWidth={2}
                    />
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                      {label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
