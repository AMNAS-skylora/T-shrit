import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="site-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 ? (
                <span className="breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              ) : null}

              {item.href && !current ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span
                  className="breadcrumb-current"
                  aria-current={current ? "page" : undefined}
                  title={item.label}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
