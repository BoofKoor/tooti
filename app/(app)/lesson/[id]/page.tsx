export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-extrabold text-text-1">Lesson</h1>
      <p className="text-text-2">
        Exercise runner for lesson <span className="font-bold text-text-1">{id}</span> arrives in
        Phase 5.
      </p>
    </main>
  );
}
