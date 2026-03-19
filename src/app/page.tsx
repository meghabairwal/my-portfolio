import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import JourneyMap from "@/components/JourneyMap";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import Publications from "@/components/Publications";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";

export default function Page() {
  return (
    <main className="grid-bg">
      <Nav />
      <Hero />
      <JourneyMap />
      <Skills />
      <Experience />
      <Publications />
      <Projects />
      <Contact />
    </main>
  );
}
