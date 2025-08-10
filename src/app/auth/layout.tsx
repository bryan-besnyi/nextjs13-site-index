export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen w-full light"
      style={{ 
        background: 'linear-gradient(135deg, #012147 0%, #2563eb 100%)',
        minHeight: '100vh',
        colorScheme: 'light'
      }}
    >
      {children}
    </div>
  );
}