// page.tsx
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import GlassTextPanel from "@/components/GlassTextPanel";

export default function Home() {
  return (
    <div className="
      w-full max-w-6xl mx-auto
      grid grid-cols-1 lg:grid-cols-[auto_1fr]
      gap-8 lg:gap-14
      px-4 md:px-8 lg:px-12
      pt-8
      items-start
    ">
      {/* Левая панель */}
      <div className="w-full flex justify-center lg:justify-start">
        <GlassTextPanel>
          <CompanyDescription />
        </GlassTextPanel>
      </div>

      {/* Правая панель с картой */}
      <div className="w-full flex justify-center lg:justify-end">
        <GlassMapPanel />
      </div>
    </div>
  );
}
