type NavigationProgressProps = {
  active: boolean;
};

export default function NavigationProgress({ active }: NavigationProgressProps) {
  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-16 z-40 h-0.5 overflow-hidden bg-blue-100 lg:left-56"
    >
      <div className="navigation-progress-bar h-full w-2/5 bg-blue-600" />
    </div>
  );
}
