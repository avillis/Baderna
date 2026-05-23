import { MembroPageClient } from "@/features/panel/components/membro-page-client";

type MembroPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MembroPage({ params }: MembroPageProps) {
  const { slug } = await params;
  return <MembroPageClient slug={slug} />;
}
