import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { Profile } from "@/types";
import { usePageRefresh } from "@/hooks";
import { PlayerCard, HomeServicePanel, SupercellDisclaimer } from "@/components/home";
import { Card, Button, Loader } from "@/components/ui";

export function HomePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getProfile();
      setProfile(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  usePageRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Loader />;
  }

  if (error || !profile) {
    return (
      <Card className="text-center">
        <p className="text-cr-loss mb-2">{error ?? "Ошибка загрузки"}</p>
        <p className="text-xs text-cr-muted mb-4">
          Нет связи с сервером. Потяните вниз для обновления.
        </p>
        <Button onClick={() => void load()}>Повторить</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PlayerCard profile={profile} />
      <HomeServicePanel profile={profile} onNavigate={navigate} />
      <SupercellDisclaimer />
    </div>
  );
}

export { HomePage as default };
