const sizes = {
  lg: "max-w-6xl",
  md: "max-w-2xl",
} as const;

type PageContainerProps = {
  children: React.ReactNode;
  size?: keyof typeof sizes;
  className?: string;
};

export default function PageContainer({
  children,
  size = "lg",
  className = "",
}: PageContainerProps) {
  return (
    <main className={`mx-auto w-full ${sizes[size]} px-6 py-8 ${className}`}>
      {children}
    </main>
  );
}
