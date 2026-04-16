import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import JournalEditor from "@/components/admin/JournalEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJournalEntryPage({ params }: PageProps) {
  const { id } = await params;

  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: { photos: { select: { id: true } } },
  });
  if (!entry) notFound();

  return (
    <div>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 400,
          marginBottom: "8px",
          fontFamily: "Libre Caslon Display, Georgia, serif",
        }}
      >
        Edit Entry
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        {entry.title}
      </p>

      <JournalEditor
        initial={{
          id: entry.id,
          title: entry.title,
          subtitle: entry.subtitle,
          slug: entry.slug,
          body: entry.body,
          category: entry.category,
          published: entry.published,
          photoIds: entry.photos.map((p) => p.id),
        }}
      />
    </div>
  );
}
