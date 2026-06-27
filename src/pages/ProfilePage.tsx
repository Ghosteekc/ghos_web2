import { useState } from "react";
import { motion } from "framer-motion";
import { User, Crown, Trophy, Flame, Settings } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { useTelegram } from "@/hooks";

export function ProfilePage() {
  const { tg, user } = useTelegram();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cr-text tracking-tight">Профиль</h1>

      <Card>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cr-blue to-cr-gold p-[3px] shadow-glow">
            <div className="w-full h-full rounded-full bg-cr-surface flex items-center justify-center">
              <User className="w-8 h-8 text-cr-muted" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-cr-text">
              {user?.first_name ?? user?.username ?? "Игрок"}
            </h2>
            <p className="text-cr-muted text-sm font-mono mt-1">
              @{user?.username ?? "—"}
            </p>
            <p className="text-xs text-cr-muted mt-2">ID: {user?.id ?? "—"}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-5 h-5 text-cr-gold" />
            <h3 className="text-sm font-semibold text-cr-text">Уровень аккаунта</h3>
          </div>
          <p className="text-2xl font-bold text-cr-text">Shop Level {user?.id ?? "—"}</p>
          <p className="text-xs text-cr-muted mt-1">Клиент Telegram</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-5 h-5 text-cr-blue" />
            <h3 className="text-sm font-semibold text-cr-text">Подписка</h3>
          </div>
          <p className="text-lg font-bold text-cr-text">Premium</p>
          <p className="text-xs text-cr-muted mt-1">Активна до конца месяца</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5 text-cr-gold" />
          <h3 className="text-sm font-semibold text-cr-text">Достижения</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          {["Первый бой", "10 побед", "100 игр", "Винрейт 60%", "Легенда"].map((achievement, i) => (
            <motion.div
              key={achievement}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="px-4 py-2 rounded-xl bg-cr-gold/10 border border-cr-gold/20 text-xs font-medium text-cr-gold"
            >
              {achievement}
            </motion.div>
          ))}
        </div>
      </Card>

      <Button variant="secondary" className="w-full">
        <Settings className="w-4 h-4 mr-2" />
        Открыть настройки
      </Button>
    </div>
  );
}

export { ProfilePage as default };