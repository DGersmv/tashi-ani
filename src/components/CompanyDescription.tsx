"use client";
import { motion } from "framer-motion";
import React from "react";

function SplitChinaHeadline({ text }: { text: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="font-extrabold text-[clamp(1.8rem,5vw,2.8rem)] mb-6"
      style={{
        fontFamily: "'ChinaCyr', Arial, sans-serif",
        letterSpacing: "0.04em",
        background: "linear-gradient(90deg, #faecd1 0%, #d3a373 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block",
        lineHeight: 1.1,
      }}
    >
      {text}
    </motion.h2>
  );
}

export default function CompanyDescription() {
  const blocks = [
    { text: "Нам доверяют уже более 15 лет", strong: true },
    {
      text: "90% наших клиентов приходят по личным рекомендациям — потому что мы создаём",
    },
    {
      text: "не просто красивые пространства, а действительно комфортные и функциональные",
    },
    { text: "участки, которые работают на ваш стиль жизни." },
    { text: "Мы умеем решать сложные задачи:", strong: true },
    { text: "Наши принципы: логика, функциональность, эстетика." },
    { text: "Личный онлайн-кабинет заказчика", strong: true },
    {
      text: "Все этапы, документы, фото- и видеоотчёты, комментарии — в одном месте, с любого устройства.",
    },
    {
      text: "Мы ведём проект от первого выезда до сдачи и последующего сервиса.",
    },
    {
      text: "Архитектурное образование и опыт позволяют принимать грамотные решения на всех стадиях.",
    },
    {
      text: "Экономим бюджет за счёт продуманной последовательности и прозрачных процессов.",
    },
    {
      text: "Вы получаете не просто проект, а надёжного партнёра на всех этапах.",
      strong: true,
    },
  ];

  const listItems = [
    "Перепады высот, затопление, сложные грунты — решаем.",
    "Индивидуальный подход: отражение вкусов и привычек клиента.",
    "Подбор растений по цвету, простоте ухода и эксклюзивности.",
    "Ориентация только на реальные примеры в нашем климате.",
  ];

  return (
    <div
      className="text-white flex flex-col space-y-6 text-left"
      style={{
        width: "100%",
        fontFamily: "'Montserrat Alternates', sans-serif",
        marginLeft: 0,
        alignSelf: "flex-start",
      }}
    >
      <SplitChinaHeadline text="Ландшафт, который рекомендуют" />

      {blocks.map((block, idx) => (
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: idx * 0.15 }}
          className={block.strong ? "font-semibold" : ""}
        >
          {block.text}
        </motion.p>
      ))}

      <ul className="list-disc pl-6 space-y-2">
        {listItems.map((line, idx) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: blocks.length * 0.15 + idx * 0.2 }}
          >
            {line}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
