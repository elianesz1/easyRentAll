import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white font-sans text-brandText">
      <Header />
      <main className="mt-20 px-6 max-w-screen-xl mx-auto">{children}</main>
    </div>
  );
}
