import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <section className="flex min-h-[90vh] items-center justify-center">
        <h1 className="text-center text-6xl font-bold text-white">
          Welcome to Veldic Wear
        </h1>
      </section>
    </main>
  );
}