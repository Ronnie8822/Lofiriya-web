import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Is LOFIRIYA free to use?", a: "Yes! The core music bot features are completely free. We offer Premium tiers for advanced audio filters, higher volume limits, and priority nodes." },
  { q: "What platforms are supported?", a: "We support high-quality playback from YouTube, Spotify, SoundCloud, Apple Music, and direct HTTP streams." },
  { q: "How do I setup 24/7 mode?", a: "Premium users can use the /247 command to keep the bot in the voice channel indefinitely, perfect for lofi radio setups." },
  { q: "Can I self-host the bot?", a: "Currently, LOFIRIYA is a hosted service to ensure the highest quality streaming and reliability for all users." },
  { q: "What is DJ mode?", a: "DJ mode allows server admins to restrict music commands to specific roles, preventing queue spam and abuse." }
];

export function FAQSection() {
  return (
    <section className="py-32 bg-background relative">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-glow mb-4">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-surface/30 border border-white/10 rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors">
                <AccordionTrigger className="text-white hover:text-primary transition-colors text-left font-medium text-lg py-6">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-white/70 text-base leading-relaxed pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
