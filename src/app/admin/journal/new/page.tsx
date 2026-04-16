import JournalEditor from "@/components/admin/JournalEditor";

export default function NewJournalEntryPage() {
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
        New Journal Entry
      </h1>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "40px" }}>
        Write in Markdown. Toggle published when ready.
      </p>

      <JournalEditor />
    </div>
  );
}
