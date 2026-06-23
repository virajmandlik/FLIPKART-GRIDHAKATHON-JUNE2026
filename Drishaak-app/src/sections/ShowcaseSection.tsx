import { m } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Reveal, SectionHead } from "./_ui";

export default function ShowcaseSection() {
  return (
    <section id="showcase" className="relative overflow-hidden py-24 sm:py-28">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full bg-ss-gold/[0.07] blur-[120px]" />
      </div>

      <div className="ss-pad relative z-10">
        <SectionHead
          center
          kicker="Drishaak · in motion"
          title={
            <>
              A glimpse of the <span className="ss-gold-text">future of enforcement</span>
            </>
          }
          sub="From a live CCTV frame to court-ready, explainable evidence — rendered the way Bengaluru's command centre will see it."
        />

        <Reveal delay={0.1} className="mx-auto mt-14 max-w-5xl">
          <m.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
          >
            {/* gold gradient frame */}
            <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-ss-gold/50 via-white/10 to-ss-gold/30 opacity-70 blur-[1px]" />

            {/* video frame — overflow-hidden clips the corner watermark */}
            <div className="relative aspect-video overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
              <video
                className="h-full w-full object-cover"
                src="/drishaak-cinematic.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="Drishaak cinematic showcase"
              />

              {/* cinematic vignette + subtle top sheen */}
              <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-white/10" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent" />

              {/* floating label */}
              <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[12px] font-medium text-white/85 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-ss-gold" />
                Drishaak vision
              </div>
            </div>
          </m.div>
        </Reveal>
      </div>
    </section>
  );
}
