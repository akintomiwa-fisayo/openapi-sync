import DocsLayout from "@/components/docs/DocsLayout";
import DocsContent from "@/components/docs/DocsContent";

export const metadata = {
  title: "Documentation - OpenAPI Sync",
  description:
    "Complete documentation for OpenAPI Sync including configuration, features, and examples",
};

export default function DocsPage() {
  return (
    <DocsLayout>
      <DocsContent />
    </DocsLayout>
  );
}
