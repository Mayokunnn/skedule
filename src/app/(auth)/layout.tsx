export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className=" h-screen bg-[url(/authbg.png)] bg-no-repeat">
      <div className="bg-white/10 backdrop-blur-lg h-screen w-full flex justify-center">{children}</div>
    </div>
  );
}
