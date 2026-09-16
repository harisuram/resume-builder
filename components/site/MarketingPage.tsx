import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }} />
      ))}
    </>
  );
}

export function MarketingPage({
  children,
  jsonLd,
  home = false,
}: {
  children: React.ReactNode;
  jsonLd?: unknown | unknown[];
  home?: boolean;
}) {
  return (
    <div className="marketing-shell flex flex-1 flex-col">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <SiteHeader home={home} />
      <main className={`flex min-w-0 flex-1 flex-col px-6 pb-24 sm:px-10 ${home ? "pt-12 sm:pt-16" : "pt-10"}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function Article({ children }: { children: React.ReactNode }) {
  return <article className="mx-auto w-full max-w-2xl">{children}</article>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-[32px] font-semibold tracking-tight leading-[1.15] text-[var(--color-ink)] sm:text-[40px]">
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">{children}</p>;
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 font-display text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">{children}</h2>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-ink-soft)]">{children}</p>;
}
