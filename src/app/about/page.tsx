import type { Metadata } from "next";
import { BadgePercent, Boxes, Handshake, PackageCheck, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about The Bulk Supplier, a direct godown wholesale supplier for bulk products."
};

const sections = [
  {
    title: "Who we are",
    text: "We are a wholesale supplier providing spices, agarbatti, tea and daily goods in bulk. We supply directly from our godown at best rates.",
    icon: Handshake
  },
  {
    title: "What we supply",
    text: "Spices, agarbatti, dhoop, tea patti, machis and high movement daily goods for traders and shops.",
    icon: PackageCheck
  },
  {
    title: "Our promise",
    text: "Clear bulk rates, practical packing options and dependable follow-up before dispatch.",
    icon: ShieldCheck
  },
  {
    title: "Direct godown supply",
    text: "Orders are handled with a godown-first process for better wholesale consistency.",
    icon: Boxes
  },
  {
    title: "Bulk discount available",
    text: "Repeat and larger quantity buyers can request sharper rates based on stock and transport.",
    icon: BadgePercent
  }
];

export default function AboutPage() {
  return (
    <section className="py-14">
      <div className="container-page">
        <SectionHeading
          eyebrow="About us"
          title="A wholesale supply partner for everyday trade goods"
          description="We focus on practical bulk supply for buyers who need reliable product availability, clear quantities and fast communication."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <section.icon className="h-8 w-8 text-accent" />
              <h2 className="mt-5 text-xl font-extrabold text-primary">{section.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
