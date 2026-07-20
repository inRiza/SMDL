import { About } from "@/components/landing/about";
import { Cta } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Security } from "@/components/landing/security";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <About />
        <Security />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
