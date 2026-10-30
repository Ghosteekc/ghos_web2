import { ArrowLeft, FileText, ShieldCheck, Star } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, NavRowButton, PageHeader } from "@/components/ui";

const supportUrl = "https://t.me/ghosteekcomp?direct";
const sections = [
  { id: "privacy", title: "Информация о данных", hint: "Какие данные используются", icon: ShieldCheck },
  { id: "terms", title: "Использование сервиса", hint: "О Ghosteek Royale и его функциях", icon: FileText },
  { id: "pro", title: "Ghosteek Pro и оплата", hint: "Подписка, Stars и поддержка", icon: Star },
] as const;

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="text-cr-accent underline underline-offset-2 break-words" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export function InformationPage() {
  const navigate = useNavigate();
  const { section } = useParams();
  const selected = sections.find((item) => item.id === section);
  const back = section ? "/information" : "/";

  return (
    <div className="space-y-5 pb-2">
      <PageHeader
        title={selected?.title ?? "Информация для пользователя"}
        action={<Button variant="ghost" onClick={() => navigate(back)} className="!p-2 shrink-0" aria-label="Назад"><ArrowLeft className="w-5 h-5" /></Button>}
      />
      {!section ? (
        <div className="space-y-2">
          {sections.map((item) => (
            <NavRowButton key={item.id} icon={item.icon} label={item.title} hint={item.hint} onClick={() => navigate(`/information/${item.id}`)} />
          ))}
        </div>
      ) : selected ? (
        <Card className="!p-4">
          <div className="space-y-4 text-sm leading-relaxed text-cr-text break-words">
            {selected.id === "privacy" ? <PrivacyText /> : selected.id === "terms" ? <TermsText /> : <ProText />}
          </div>
        </Card>
      ) : (
        <Card>Раздел не найден.</Card>
      )}
    </div>
  );
}

function PrivacyText() {
  return <>
    <p>Временный информационный текст. Подробная политика обработки персональных данных находится в подготовке.</p>
    <p>Ghosteek Royale использует Telegram ID для работы аккаунта. Если ты привязываешь профиль Clash Royale, сервис также использует игровой тег и доступные игровые сведения: имя игрока, колоды, статистику и историю боёв. В данных о боях могут присутствовать имена и теги соперников.</p>
    <p>Для работы функций могут сохраняться настройки, избранные колоды и информация о покупках Ghosteek Pro. Игровые данные также используются для общей статистики колод и режимов. История сообщений Ghosteek AI может сохраняться на твоём устройстве, а данные текущего диалога — временно в памяти сервиса.</p>
    <p>При использовании внешнего AI-сервиса ему могут передаваться твой вопрос и относящийся к нему игровой контекст. Не отправляй в Ghosteek AI пароли, платёжные реквизиты и другую лишнюю личную информацию.</p>
    <p>Команда /unlink отвязывает игровой тег, но не удаляет аккаунт и все связанные данные. Возможность полного удаления аккаунта пока находится в подготовке. По вопросам о своих данных, их исправлении или удалении обратись в <ExternalLink href={supportUrl}>поддержку</ExternalLink>.</p>
    <p>Информация о размещении сервиса, получателях данных и сроках хранения будет уточнена при подготовке полной политики.</p>
  </>;
}

function TermsText() {
  return <>
    <p>Временный информационный текст. Полное пользовательское соглашение находится в подготовке.</p>
    <p>Ghosteek Royale — независимый сервис для игроков Clash Royale. Бот <ExternalLink href="https://t.me/ghosteek_bot">@ghosteek_bot</ExternalLink> и Mini App помогают просматривать игровой профиль, анализировать бои и колоды и получать рекомендации.</p>
    <p>Для персональных функций можно привязать игровой тег через бота. Используй только тот игровой профиль, которым вправе пользоваться. Пароль от Supercell ID для привязки не требуется.</p>
    <p>Сведения и рекомендации зависят от доступных игровых данных и могут быть неполными или неточными. Рекомендации Ghosteek AI не гарантируют победы или роста рейтинга. Функции сервиса могут быть временно недоступны из-за технических работ или работы сторонних сервисов.</p>
    <p>Базовые функции доступны бесплатно; часть аналитики и Ghosteek AI относится к Ghosteek Pro. Условия оплаты описаны в <Link className="text-cr-accent underline underline-offset-2" to="/information/pro">информации о Pro</Link>.</p>
    <p>Ghosteek Royale — неофициальный проект, который не создан, не спонсируется и не одобряется Supercell. Подробнее: <ExternalLink href="https://supercell.com/en/fan-content-policy/">правила фан-контента Supercell</ExternalLink>.</p>
    <p>По вопросам работы сервиса напиши в <ExternalLink href={supportUrl}>поддержку Ghosteek Royale</ExternalLink>. Информация о данных — в <Link className="text-cr-accent underline underline-offset-2" to="/information/privacy">отдельном тексте</Link>.</p>
  </>;
}

function ProText() {
  return <>
    <p>Временный информационный текст. Подробные условия Pro и возвратов находятся в подготовке.</p>
    <p>Ghosteek Pro открывает дополнительные функции аналитики и Ghosteek AI. Доступные тарифы, срок и итоговая стоимость показываются перед подтверждением покупки.</p>
    <p>Оплата в боте и Mini App проходит через Telegram Stars. Каждый платёж подтверждается отдельно; автоматического ежемесячного списания в текущей версии нет. Если Pro уже действует, повторная покупка продлевает его срок. Дата окончания доступа отображается в приложении после обработки оплаты.</p>
    <p>По вопросам оплаты и возможного возврата обратись в <ExternalLink href={supportUrl}>поддержку</ExternalLink> или отправь боту <ExternalLink href="https://t.me/ghosteek_bot">@ghosteek_bot</ExternalLink> команду /paysupport. Каждое обращение рассматривается отдельно. Автоматический возврат Stars в сервисе не предусмотрен.</p>
    <p>Если Stars списались, а доступ не появился, укажи дату покупки и опиши проблему. Идентификатор платежа сообщай только в личном диалоге с поддержкой; не отправляй пароли и данные банковской карты.</p>
    <p>Команда /unlink отвязывает игровой тег, но не удаляет аккаунт. Публичная функция полного удаления аккаунта пока находится в подготовке. По вопросам данных и действующего Pro можно обратиться в поддержку.</p>
  </>;
}

export default InformationPage;
