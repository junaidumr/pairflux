export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[20%] -top-[30%] h-[70vh] w-[70vh] rounded-full bg-violet-600/20 blur-[120px] dark:bg-violet-600/15" />
      <div className="absolute -right-[15%] top-[10%] h-[60vh] w-[60vh] rounded-full bg-cyan-500/15 blur-[100px] dark:bg-cyan-500/10" />
      <div className="absolute bottom-[-20%] left-[30%] h-[50vh] w-[50vh] rounded-full bg-indigo-500/15 blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        }}
      />
    </div>
  );
}
