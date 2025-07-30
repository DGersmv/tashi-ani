"use client";
import { motion } from "framer-motion";
import React from "react";

function SplitChinaHeadline({ text }: { text: string }) {
  return (
    <h2
      className="font-extrabold text-[clamp(1.8rem, 5vw, 2.8rem)] mb-7" // Responsive size с clamp
      style={{
        fontFamily: "'ChinaCyr', Arial, Helvetica, sans-serif", 
        letterSpacing: "0.04em",
        background: "linear-gradient(90deg, #3ffdfd 0%, #1ecce6 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block",
        lineHeight: 1.1,
      }}
    >
      {Array.from(text).map((char, i) => ( // Анимация по буквам (знакам)
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.66, ease: [0.62, 0.14, 0.42, 1.12] }} // Меньший delay для плавности
          style={{ display: "inline-block", marginRight: char === " " ? 8 : 0 }} // Пробелы с margin, буквы без
        >
          {char}
        </motion.span>
      ))}
    </h2>
  );
}

export default function CompanyDescription() {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="text-white flex flex-col space-y-6" // Улучшенный spacing для воздуха
      style={{ width: "100%", fontFamily: "'Montserrat Alternates', sans-serif" }} // Montserrat Alternates для всего компонента — прорыв в стиле!
      initial="hidden"
      whileInView="visible"
      variants={variants}
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.2 }} // Stagger для последовательного появления абзацев
    >
      <SplitChinaHeadline text="Ландшафт, который рекомендуют" />
      <motion.p variants={variants}><b>Нам доверяют уже более 15 лет</b></motion.p>
      <motion.p variants={variants}>
        90% наших клиентов приходят по личным рекомендациям — потому что мы создаём не просто красивые пространства, 
        а действительно комфортные и функциональные участки, которые работают на ваш стиль жизни.
      </motion.p>
      <motion.p variants={variants} className="mt-2"><b>Мы умеем решать сложные задачи:</b></motion.p>
      <motion.ul variants={variants} className="list-disc pl-6 space-y-2">
        <li><b>Перепады высот, затопление, сложные грунты — любая сложность участка для нас решаема;</b></li>
        <li><b>Индивидуальный подход к каждому проекту: вы получаете ландшафт, отражающий ваши вкусы и привычки;</b></li>
        <li><b>Подбираем растения по вашим критериям: цвет, простота ухода, эксклюзивность;</b></li>
        <li><b>Опираемся только на реальные примеры и референсы, которые будут уместны именно в наших климатических условиях.</b></li>
      </motion.ul>
      <motion.p variants={variants}><span className="font-bold">Наши принципы:</span> логика, функциональность, эстетика.</motion.p>
      <motion.p variants={variants}>
        <b>Только у нас — личный онлайн-кабинет заказчика.</b><br />
        Это ваш персональный доступ ко всему процессу: вы видите все этапы работ, актуальные документы, 
        фото- и видеоотчёты, комментарии и рекомендации специалистов.
      </motion.p>
      <motion.p variants={variants}>Все важные материалы всегда под рукой — в любое время, с любого устройства.</motion.p>
      <motion.p variants={variants}>Мы ведём проект от первого выезда на участок до финальной сдачи и последующего сервисного обслуживания.</motion.p>
      <motion.p variants={variants}>Благодаря архитектурному образованию мы принимаем грамотные решения как на этапе проектирования, так и при реализации.</motion.p>
      <motion.p variants={variants}><b>Экономим ваш бюджет</b> за счёт детально продуманной организации и прозрачной последовательности всех работ.</motion.p>
      <motion.p variants={variants}>Для нас важно, чтобы весь процесс для заказчика был чётким, понятным и комфортным — без лишней суеты и избыточной информации.</motion.p>
      <motion.p variants={variants}><b>Вы получаете не просто проект, а надёжного партнёра на всех этапах — с современным сервисом и максимальной заботой о вашем времени.</b></motion.p>
    </motion.div>
  );
}