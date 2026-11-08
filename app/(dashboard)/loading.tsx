export default function Loading() {
  return (
    <div
      className="flex min-h-100 items-center justify-center gap-3 text-xs text-zinc-500"
      role="status"
    >
      <span className="loader motion-reduce:animate-none!" aria-hidden="true" />
    </div>
  );
}
