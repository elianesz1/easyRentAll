import Header from "./Header";
import { Toaster } from "react-hot-toast";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white font-sans text-brandText">
      <Header />

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { direction: "rtl", textAlign: "right" },
        }}
      />

      <main className="mt-20 px-6 max-w-screen-xl mx-auto">{children}</main>
    </div>
  );
}
