"use client";
import React from "react";
import { motion } from "framer-motion";
import { useLoginFlow } from "@/components/ui/LoginFlowContext";
import { useSiteSettings } from "@/components/ui/SiteSettingsContext";

const LINE_DELAY = 0.06;
const DURATION = 0.35;
const TOTAL_LINES = 14;

function AnimatedLine({
  index,
  totalLines,
  enteredHome,
  forceHidden,
  children,
  className = "",
}: {
  index: number;
  totalLines: number;
  enteredHome: boolean;
  forceHidden: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const { loginRequested } = useLoginFlow();
  const isHiding = loginRequested || forceHidden;
  const isRevealing = !loginRequested && !forceHidden;
  const revealDelay = (totalLines - 1 - index) * LINE_DELAY;
  const hideDelay = index * LINE_DELAY;
  return (
    <motion.div
      initial={enteredHome ? { x: "-120%", opacity: 0 } : false}
      animate={{
        x: isHiding ? "-120%" : 0,
        opacity: isHiding ? 0 : 1,
      }}
      transition={{
        duration: DURATION,
        ease: [0.4, 0, 0.2, 1],
        delay: isHiding ? hideDelay : isRevealing ? revealDelay : 0,
      }}
      style={{ willChange: isHiding || isRevealing ? "transform, opacity" : "auto" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function CompanyDescription({ enteredHome = false, forceHidden = false }: { enteredHome?: boolean; forceHidden?: boolean }) {
  const settings = useSiteSettings();
  const headingFont = settings.mainPageHeadingFont || "ChinaCyr";
  const textFont = settings.mainPageTextFont || "ChinaCyr";
  const maxWidth = settings.mainPageTextMaxWidth ?? 720;

  return (
    <div
      className="text-white flex flex-col space-y-6 text-left"
      style={{
        width: "100%",
        maxWidth: maxWidth,
        fontFamily: `${textFont}, ChinaCyr, Arial, Helvetica, sans-serif`,
        marginLeft: 0,
        alignSelf: "flex-start",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      <AnimatedLine index={0} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <h2
          className="font-extrabold text-[clamp(1.8rem,5vw,2.8rem)] mb-6"
          style={{
            fontFamily: `${headingFont}, ChinaCyr, Arial, sans-serif`,
            letterSpacing: "0.04em",
            background: "linear-gradient(90deg, #faecd1 0%, #d3a373 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
            lineHeight: 1.1,
            maxWidth: "100%",
          }}
        >
          Ландшафт, который рекомендуют
        </h2>
      </AnimatedLine>

      <AnimatedLine index={1} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p className="font-semibold">Нам доверяют уже более 15 лет</p>
      </AnimatedLine>
      <AnimatedLine index={2} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>90% наших клиентов приходят по личным рекомендациям — потому что мы создаём</p>
      </AnimatedLine>
      <AnimatedLine index={3} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>не просто красивые пространства, а действительно комфортные и функциональные</p>
      </AnimatedLine>
      <AnimatedLine index={4} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>участки, которые работают на ваш стиль жизни.</p>
      </AnimatedLine>

      <AnimatedLine index={5} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p className="mt-2 font-semibold">Мы умеем решать сложные задачи:</p>
      </AnimatedLine>
      <AnimatedLine index={6} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <ul className="list-disc pl-6 space-y-2">
          <li>Перепады высот, затопление, сложные грунты — решаем.</li>
          <li>Индивидуальный подход: отражение вкусов и привычек клиента.</li>
          <li>Подбор растений по цвету, простоте ухода и эксклюзивности.</li>
          <li>Ориентация только на реальные примеры в нашем климате.</li>
        </ul>
      </AnimatedLine>

      <AnimatedLine index={7} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>Наши принципы: логика, функциональность, эстетика.</p>
      </AnimatedLine>
      <AnimatedLine index={8} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p className="font-semibold">Личный онлайн-кабинет заказчика</p>
      </AnimatedLine>
      <AnimatedLine index={9} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>Все этапы, документы, фото- и видеоотчёты, комментарии — в одном месте, с любого устройства.</p>
      </AnimatedLine>

      <AnimatedLine index={10} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>Мы ведём проект от первого выезда до сдачи и последующего сервиса.</p>
      </AnimatedLine>
      <AnimatedLine index={11} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>Архитектурное образование и опыт позволяют принимать грамотные решения на всех стадиях.</p>
      </AnimatedLine>
      <AnimatedLine index={12} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p>Экономим бюджет за счёт продуманной последовательности и прозрачных процессов.</p>
      </AnimatedLine>
      <AnimatedLine index={13} totalLines={TOTAL_LINES} enteredHome={enteredHome} forceHidden={forceHidden}>
        <p className="font-semibold">Вы получаете не просто проект, а надёжного партнёра на всех этапах.</p>
      </AnimatedLine>
    </div>
  );
}
