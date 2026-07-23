const FAN_CONTENT_POLICY_URL = "https://supercell.com/en/fan-content-policy/";

export function SupercellDisclaimer() {
  return (
    <footer className="pt-2 pb-4 px-1">
      <p className="text-[10px] leading-relaxed text-cr-muted/75 text-center">
        Статистика, колоды и изображения карт загружаются из игровых данных Clash Royale по вашему
        игровому тегу — те же данные, что доступны любому игроку в игре.
      </p>
      <p className="text-[10px] leading-relaxed text-cr-muted/75 text-center mt-2">
        Материалы неофициальны и не одобрены Supercell.{" "}
        <a
          href={FAN_CONTENT_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cr-muted underline underline-offset-2"
        >
          правилам фан-контента
        </a>
      </p>
    </footer>
  );
}

export { SupercellDisclaimer as default };
