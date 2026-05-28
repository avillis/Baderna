"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Eye, EyeOff, X } from "lucide-react";

import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { AvatarPickerModal } from "@/features/panel/components/avatar-picker-modal";
import { NameStyleModal } from "@/features/panel/components/name-style-modal";
import { PanelBannerPicker } from "@/features/panel/components/panel-banner-picker";
import { TitleModal } from "@/features/panel/components/title-modal";
import type { SplashGroup } from "@/features/panel/splash-catalog";
import { StyledName } from "@/features/panel/components/styled-name";
import { NAME_BY_ID } from "@/features/panel/names-data";
import { panelProfile } from "@/features/panel/panel-data";
import { changePassword, useAccount, useCurrentUserId } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";
import { useMemberUnlockedTitles } from "@/features/panel/use-member-titles";
import { useMemberUnlockedNames } from "@/features/panel/use-member-unlocked-names";
import { useTitles } from "@/features/panel/use-titles";
import { useUnlockedBanners } from "@/features/panel/use-unlocked-banners";
import { RARITY_META, type Title } from "@/features/panel/titles-data";
import { SpotifyConnectCard } from "@/features/panel/components/spotify-card";

type CollectionKey = "capas" | "titulos" | "nomes";

export function MinhaContaClient({
  bannersTotal,
  namesTotal,
  splashGroups,
}: {
  bannersTotal: number;
  namesTotal: number;
  splashGroups: SplashGroup[];
}) {
  const { account, updateField, updateSlug } = useAccount();
  const { user } = useAuth();
  const userId = useCurrentUserId() ?? "__guest__";
  const { unlocked: unlockedBanners } = useUnlockedBanners(userId);
  const { unlocked: unlockedTitles } = useMemberUnlockedTitles(userId);
  const { unlocked: unlockedNames } = useMemberUnlockedNames(userId);
  const { titles: allTitles } = useTitles();
  const titlesById = new Map<string, Title>(allTitles.map((t) => [t.id, t]));
  const [openCollection, setOpenCollection] = useState<CollectionKey | null>(null);

  return (
    <div className="grid grid-cols-1 gap-[18px] pt-[1.5vh] sm:pt-[6vh] xl:grid-cols-[minmax(0,1fr)_280px]">
      <BasicInfoCard
        account={account}
        updateField={updateField}
        updateSlug={updateSlug}
        email={user?.email ?? panelProfile.email}
        avatarSrc={
          account.avatarSrc ||
          getChampionAvatarSrc(
            account.gameNick.split("#")[0]?.toLowerCase() || "guest",
          )
        }
        onChangeAvatar={(src) => updateField("avatarSrc", src)}
        ownerId={
          account.gameNick.split("#")[0]?.toLowerCase() || userId
        }
      />

      <section className="flex flex-col gap-[18px]">
        <SpotifyConnectCard />
        <CollectionSummary
          title="Capas"
          count={unlockedBanners.length}
          total={bannersTotal}
          onClick={() => setOpenCollection("capas")}
        />
        <CollectionSummary
          title="Títulos"
          count={unlockedTitles.length}
          total={allTitles.length}
          onClick={() => setOpenCollection("titulos")}
        />
        <CollectionSummary
          title="Nomes"
          count={unlockedNames.length}
          total={namesTotal}
          onClick={() => setOpenCollection("nomes")}
        />
      </section>

      <CollectionModal
        open={openCollection}
        onClose={() => setOpenCollection(null)}
        banners={unlockedBanners}
        titleIds={unlockedTitles}
        titlesById={titlesById}
        nameIds={unlockedNames}
      />

      {/* Picker montado invisível — só pra escutar o evento custom disparado
          pelo botão "Editar capa". O wrapper `hidden` esconde o botão flutuante
          do picker; o modal vira portal pro body, então abre normal. */}
      {splashGroups.length > 0 && (
        <div className="hidden" aria-hidden="true">
          <PanelBannerPicker splashGroups={splashGroups} defaultBannerFileName="" />
        </div>
      )}
    </div>
  );
}

/* ── Informações básicas ──────────────────────────────── */
function BasicInfoCard({
  account,
  updateField,
  updateSlug,
  email,
  avatarSrc,
  onChangeAvatar,
  ownerId,
}: {
  account: ReturnType<typeof useAccount>["account"];
  updateField: ReturnType<typeof useAccount>["updateField"];
  updateSlug: ReturnType<typeof useAccount>["updateSlug"];
  email: string;
  avatarSrc: string;
  onChangeAvatar: (src: string) => void;
  ownerId: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [namesOpen, setNamesOpen] = useState(false);
  const [titlesOpen, setTitlesOpen] = useState(false);
  const { unlocked: unlockedTitleIds } = useMemberUnlockedTitles(ownerId, ["aprendiz"]);
  const { unlocked: unlockedNameIds } = useMemberUnlockedNames(ownerId);
  const toast = useToast();
  return (
    <section className="rounded-[25px] bg-white px-[20px] py-[28px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] sm:px-[36px] sm:py-[32px]">
      <SectionTitle>Informações básicas</SectionTitle>

      <div className="mt-[24px] flex flex-col items-center gap-[24px] sm:grid sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start sm:gap-[32px]">
        <div className="flex flex-col items-center gap-[10px]">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Trocar avatar"
            className="group relative h-[120px] w-[120px] overflow-hidden rounded-full bg-[#f0eded] ring-1 ring-black/[0.04] transition-transform hover:scale-[1.02]"
          >
            <Image
              src={avatarSrc}
              alt="Avatar"
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-[11px] font-bold text-white opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
              Trocar
            </span>
          </button>
          <AvatarPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            currentSrc={avatarSrc}
            ownerId={ownerId}
            onSelect={(src) => {
              onChangeAvatar(src);
              toast.show("Avatar atualizado.", "success");
            }}
          />

          {/* Atalhos pros modais de personalização */}
          <div className="flex w-full max-w-[220px] flex-col gap-[10px] pt-[8px] sm:max-w-none">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("panel:open-banner-picker"))
              }
              className="w-full rounded-[18px] bg-[#ededed] py-[14px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
            >
              Editar capa
            </button>
            <button
              type="button"
              onClick={() => setNamesOpen(true)}
              className="w-full rounded-[18px] bg-[#ededed] py-[14px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
            >
              Editar nome
            </button>
            <button
              type="button"
              onClick={() => setTitlesOpen(true)}
              className="w-full rounded-[18px] bg-[#ededed] py-[14px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3]"
            >
              Editar títulos
            </button>
          </div>

          <NameStyleModal
            open={namesOpen}
            onClose={() => setNamesOpen(false)}
            activeNameId={account.activeNameId ?? "preto"}
            onSelect={(id) => {
              updateField("activeNameId", id);
              setNamesOpen(false);
              toast.show("Estilo de nome salvo.", "success");
            }}
            unlockedIds={unlockedNameIds}
          />

          <TitleModal
            open={titlesOpen}
            onClose={() => setTitlesOpen(false)}
            activeTitleIds={account.activeTitleSlugs ?? ["aprendiz"]}
            onToggle={(id) => {
              const prev = account.activeTitleSlugs ?? ["aprendiz"];
              let next: string[];
              if (prev.includes(id)) {
                if (prev.length === 1) return;
                next = prev.filter((t) => t !== id);
              } else if (prev.length >= 2) {
                next = [...prev.slice(1), id];
              } else {
                next = [...prev, id];
              }
              updateField("activeTitleSlugs", next);
              toast.show("Títulos atualizados.", "success");
            }}
            unlockedTitleIds={unlockedTitleIds}
            maxActive={2}
          />
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-[18px] md:grid-cols-2">
          <Field
            label="Nome"
            defaultValue={account.name}
            onCommit={(v) => updateField("name", v)}
          />
          <GameNickField
            value={account.gameNick}
            onCommit={(v) => updateField("gameNick", v)}
          />
          <Field
            label="Email"
            defaultValue={account.email || email}
            onCommit={(v) => updateField("email", v)}
          />
          {(() => {
            const teamNick =
              account.gameNick.split("#")[0] || account.name;
            return (
              <Field
                label="Nome do time"
                defaultValue={account.teamName}
                onCommit={(v) => updateField("teamName", v || `Time ${teamNick}`)}
                help={`Padrão: "Time ${teamNick}". Aparece quando você é sorteado como líder.`}
              />
            );
          })()}
          <div className="md:col-span-2">
            <Field
              label="Descrição"
              defaultValue={account.bio}
              onCommit={(v) => updateField("bio", v)}
              multiline
              maxLength={150}
            />
          </div>
          <div className="md:col-span-2">
            <SlugField value={account.slug} onCommit={updateSlug} />
          </div>
          <div className="md:col-span-2">
            <BirthdayField
              value={account.birthday ?? null}
              hidden={account.birthdayHidden ?? false}
              onCommitDate={(date) => updateField("birthday", date)}
              onCommitHidden={(h) => updateField("birthdayHidden", h)}
            />
          </div>
          <PasswordFields />
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[18px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
      {children}
    </h2>
  );
}

function Field({
  label,
  defaultValue,
  onCommit,
  disabled = false,
  multiline = false,
  maxLength,
  help,
}: {
  label: string;
  defaultValue: string;
  onCommit?: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
  help?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const toast = useToast();
  // Sync local state when the prop changes (eg. when the parent finishes
  // hydrating account data from localStorage after mount).
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleBlur = () => {
    if (value !== defaultValue) {
      onCommit?.(value);
      toast.show("Alterações salvas.", "success");
    }
  };

  const inputClasses =
    "w-full border-none bg-[#ededed] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20 disabled:cursor-not-allowed disabled:bg-[#f4f1ef] disabled:text-[#8d8d8d]";
  const singleLineClasses = `${inputClasses} rounded-full px-6 py-4`;
  const multilineClasses = `${inputClasses} resize-none rounded-[20px] px-6 py-4`;
  return (
    <label className="flex flex-col gap-[8px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
          {label}
        </span>
        {multiline && maxLength && (
          <span className="text-[11px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          rows={3}
          maxLength={maxLength}
          className={multilineClasses}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={maxLength}
          className={singleLineClasses}
        />
      )}
      {help && (
        <span className="text-[11px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
          {help}
        </span>
      )}
    </label>
  );
}

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function BirthdayField({
  value,
  hidden,
  onCommitDate,
  onCommitHidden,
}: {
  value: string | null;
  hidden: boolean;
  onCommitDate: (date: string | null) => void;
  onCommitHidden: (hidden: boolean) => void;
}) {
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [day, setDay] = useState(parsed ? String(parsed.getDate()) : "");
  const [month, setMonth] = useState(parsed ? String(parsed.getMonth() + 1) : "");
  const [year, setYear] = useState(parsed ? String(parsed.getFullYear()) : "");
  const [hiddenLocal, setHiddenLocal] = useState(hidden);
  const [monthOpen, setMonthOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const p = value ? new Date(value + "T00:00:00") : null;
    setDay(p ? String(p.getDate()) : "");
    setMonth(p ? String(p.getMonth() + 1) : "");
    setYear(p ? String(p.getFullYear()) : "");
  }, [value]);
  useEffect(() => { setHiddenLocal(hidden); }, [hidden]);

  function commitDate(d = day, m = month, y = year) {
    const di = parseInt(d, 10);
    const mi = parseInt(m, 10);
    const yi = parseInt(y, 10);
    if (!di || !mi || !yi || yi < 1900 || yi > new Date().getFullYear()) return;
    const padded = `${yi}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`;
    onCommitDate(padded);
    toast.show("Aniversário salvo.", "success");
  }

  const inputBase =
    "border-none bg-[#ededed] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20 rounded-full px-4 py-4";

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
        Aniversário
      </span>
      <div className="flex flex-wrap gap-[8px]">
        <input
          type="number"
          min={1}
          max={31}
          placeholder="Dia"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          onBlur={() => commitDate()}
          className={`${inputBase} w-[90px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
        />
        {/* Select com seta customizada animada */}
        <div className="relative flex-1 min-w-[130px]">
          <select
            value={month}
            onChange={(e) => { setMonth(e.target.value); commitDate(day, e.target.value, year); }}
            onFocus={() => setMonthOpen(true)}
            onBlur={() => setMonthOpen(false)}
            className={`${inputBase} w-full appearance-none pr-10`}
          >
            <option value="">Mês</option>
            {MONTHS_PT.map((name, i) => (
              <option key={i + 1} value={String(i + 1)}>{name}</option>
            ))}
          </select>
          <ChevronDown
            className={`pointer-events-none absolute right-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#8d8d8d] transition-transform duration-200 ${
              monthOpen ? "rotate-180" : "rotate-0"
            }`}
            strokeWidth={2.2}
          />
        </div>
        <input
          type="number"
          min={1900}
          max={new Date().getFullYear()}
          placeholder="Ano"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          onBlur={() => commitDate()}
          className={`${inputBase} w-[110px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-[8px]">
        <div
          role="checkbox"
          aria-checked={hiddenLocal}
          onClick={() => {
            const next = !hiddenLocal;
            setHiddenLocal(next);
            onCommitHidden(next);
            toast.show("Alterações salvas.", "success");
          }}
          className={`relative h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full transition-colors ${
            hiddenLocal ? "bg-[#ff4100]" : "bg-[#d4d4d4]"
          }`}
        >
          <span
            className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow transition-transform ${
              hiddenLocal ? "translate-x-[18px]" : "translate-x-[2px]"
            }`}
          />
        </div>
        <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
          Ocultar meu ano de nascimento e idade
        </span>
      </label>
    </div>
  );
}

function SlugField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (slug: string) => Promise<string | null>;
}) {
  const [local, setLocal] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Strip qualquer char que não é a-z 0-9 - e força lowercase.
  const sanitize = (raw: string) =>
    raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);

  const validate = (s: string): string | null => {
    if (s.length < 3) return "Mínimo de 3 caracteres.";
    if (s.length > 30) return "Máximo de 30 caracteres.";
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s)) {
      return "Use só letras, números e hífen (sem hífen no começo/fim).";
    }
    return null;
  };

  const commit = async () => {
    if (local === value) {
      setError(null);
      return;
    }
    const formatErr = validate(local);
    if (formatErr) {
      setError(formatErr);
      return;
    }
    setSaving(true);
    const apiErr = await onCommit(local);
    setSaving(false);
    if (apiErr) {
      setError(apiErr);
    } else {
      setError(null);
      toast.show("Endereço do perfil salvo.", "success");
    }
  };

  const inputClasses =
    "flex-1 border-none bg-transparent text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-gray-400";
  const wrapperClasses = `flex items-center gap-[2px] rounded-full bg-[#ededed] pl-6 pr-4 py-4 focus-within:ring-2 ${
    error ? "focus-within:ring-red-300 ring-1 ring-red-300" : "focus-within:ring-[#ff4100]/20"
  }`;

  return (
    <label className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
        Endereço do perfil
      </span>
      <div className={wrapperClasses}>
        <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
          bdrn.com.br/membro/
        </span>
        <input
          type="text"
          value={local}
          onChange={(e) => {
            setLocal(sanitize(e.target.value));
            if (error) setError(null);
          }}
          onBlur={() => void commit()}
          disabled={saving}
          maxLength={30}
          className={inputClasses}
          placeholder="seu-nick"
        />
      </div>
      {error ? (
        <span className="text-[11px] font-medium tracking-[-0.02em] text-red-500">
          {error}
        </span>
      ) : (
        <span className="text-[11px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
          Letras minúsculas, números e hífen. Trocar não redireciona links antigos.
        </span>
      )}
    </label>
  );
}

function GameNickField({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [name, setName] = useState(() => {
    const i = value.indexOf("#");
    return i === -1 ? value : value.slice(0, i);
  });
  const [tag, setTag] = useState(() => {
    const i = value.indexOf("#");
    return i === -1 ? "" : value.slice(i + 1);
  });
  const toast = useToast();

  // Re-sync split fields when the prop changes (post-hydration from localStorage).
  // We use a ref of the last value we emitted so we don't overwrite the user's
  // in-flight edits with the same string we just committed.
  const lastEmitted = useRef(value);
  useEffect(() => {
    if (value === lastEmitted.current) return;
    const i = value.indexOf("#");
    setName(i === -1 ? value : value.slice(0, i));
    setTag(i === -1 ? "" : value.slice(i + 1));
    lastEmitted.current = value;
  }, [value]);

  function commit(nextName: string, nextTag: string) {
    const clean = nextTag.trim();
    const joined = clean ? `${nextName}#${clean}` : nextName;
    if (joined !== lastEmitted.current) {
      toast.show("Alterações salvas.", "success");
    }
    lastEmitted.current = joined;
    onCommit(joined);
  }

  const baseClasses =
    "w-full rounded-full border-none bg-[#ededed] py-4 text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20";

  return (
    <label className="flex flex-col gap-[8px]">
      <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
        Nick da conta
      </span>
      <div className="flex gap-[8px]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => commit(name, tag)}
          className={`${baseClasses} flex-1 px-6`}
        />
        <div className="relative w-[110px] shrink-0">
          <span className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-[14px] font-semibold text-gray-400">
            #
          </span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onBlur={() => commit(name, tag)}
            maxLength={5}
            className={`${baseClasses} pl-[34px] pr-4`}
          />
        </div>
      </div>
    </label>
  );
}

function PasswordFields() {
  const [expanded, setExpanded] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;

  async function handleCommit() {
    if (submitting) return;
    if (!current) {
      toast.show("Informe sua senha atual.");
      return;
    }
    if (next.length < 6) {
      toast.show("Mínimo 6 caracteres.");
      return;
    }
    if (next !== confirm) {
      toast.show("As senhas não coincidem.");
      return;
    }
    setSubmitting(true);
    const err = await changePassword(current, next);
    setSubmitting(false);
    if (err) {
      toast.show(err);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setExpanded(false);
    toast.show("Senha alterada com sucesso!", "success");
  }

  if (!expanded) {
    return (
      <>
        <div className="flex items-center justify-between rounded-full bg-[#ededed] px-6 py-4 md:col-span-2">
          <span className="text-[14px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">Senha</span>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-[13px] font-bold tracking-[-0.02em] text-[#ff4100] hover:opacity-80 transition-opacity"
          >
            Alterar senha
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <label className="flex flex-col gap-[8px] sm:col-span-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
            Redefinir senha
          </span>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setCurrent("");
              setNext("");
              setConfirm("");
            }}
            className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d] hover:opacity-70 transition-opacity"
          >
            Cancelar
          </button>
        </div>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Sua senha atual"
            autoComplete="current-password"
            className="w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((s) => !s)}
            aria-label={showCurrent ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#0f0f0f]"
          >
            {showCurrent ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-[8px]">
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Nova senha"
            autoComplete="new-password"
            className="w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
          />
          <button
            type="button"
            onClick={() => setShowNext((s) => !s)}
            aria-label={showNext ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#0f0f0f]"
          >
            {showNext ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </label>
      <label className="flex flex-col gap-[8px]">
        <div className="flex items-center gap-[8px]">
          <div className="relative flex-1 min-w-0">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar"
              autoComplete="new-password"
              className={`w-full rounded-full border-none bg-[#ededed] py-4 pl-6 pr-12 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                mismatch ? "focus:ring-[#c53030]/30" : "focus:ring-[#ff4100]/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#0f0f0f]"
            >
              {showConfirm ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={handleCommit}
            disabled={submitting}
            className="flex h-[52px] w-[110px] shrink-0 items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "..." : "Salvar"}
          </button>
        </div>
      </label>
    </>
  );
}

/* ── Collection summaries ─────────────────────────────── */
function CollectionSummary({
  title,
  count,
  total,
  onClick,
}: {
  title: string;
  count: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-[25px] bg-white px-[28px] py-[24px] text-left shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:scale-[1.01]"
    >
      <SectionTitle>{title}</SectionTitle>
      <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#b0a8a4]">
        {count}/{total}
      </span>
    </button>
  );
}

/* ── Collection modal ─────────────────────────────────── */
function CollectionModal({
  open,
  onClose,
  banners,
  titleIds,
  titlesById,
  nameIds,
}: {
  open: CollectionKey | null;
  onClose: () => void;
  banners: string[];
  titleIds: string[];
  titlesById: Map<string, Title>;
  nameIds: string[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const titleByKey: Record<CollectionKey, string> = {
    capas: "Capas",
    titulos: "Títulos",
    nomes: "Nomes",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[80vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[25px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
        </button>
        <div className="shrink-0 border-b border-[#ece7e2] px-[36px] py-[24px]">
          <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            {titleByKey[open]}
          </h2>
        </div>
        <div className="no-scrollbar min-h-0 overflow-y-auto px-[36px] py-[28px]">
          {open === "capas" && <FullBannersGrid banners={banners} />}
          {open === "titulos" && (
            <FullTitlesGrid titleIds={titleIds} titlesById={titlesById} />
          )}
          {open === "nomes" && <FullNamesGrid nameIds={nameIds} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FullBannersGrid({ banners }: { banners: string[] }) {
  if (banners.length === 0)
    return <EmptyMsg>Você ainda não tem nenhuma capa.</EmptyMsg>;
  return (
    <div className="grid grid-cols-2 gap-[14px] sm:grid-cols-3 md:grid-cols-4">
      {banners.map((fileName) => (
        <div
          key={fileName}
          className="relative aspect-[16/9] overflow-hidden rounded-[14px] bg-[#f0eded] ring-1 ring-black/[0.04]"
        >
          <Image
            src={getSplashImageSrc(fileName, "thumb")}
            alt={fileName}
            fill
            className="object-cover"
            sizes="240px"
          />
        </div>
      ))}
    </div>
  );
}

function FullTitlesGrid({
  titleIds,
  titlesById,
}: {
  titleIds: string[];
  titlesById: Map<string, Title>;
}) {
  const titles = titleIds
    .map((id) => titlesById.get(id))
    .filter(Boolean) as Title[];
  if (titles.length === 0)
    return <EmptyMsg>Você ainda não tem nenhum título.</EmptyMsg>;
  return (
    <div className="flex flex-wrap gap-[10px]">
      {titles.map((t) => {
        const meta = RARITY_META[t.rarity];
        return (
          <span
            key={t.id}
            className="inline-flex items-center rounded-full px-[14px] py-[7px] text-[12px] font-bold tracking-[-0.01em]"
            style={{ background: meta.pillGradient, color: meta.pillText }}
          >
            {t.label}
          </span>
        );
      })}
    </div>
  );
}

function FullNamesGrid({ nameIds }: { nameIds: string[] }) {
  const styles = nameIds.map((id) => NAME_BY_ID[id]).filter(Boolean);
  if (styles.length === 0)
    return <EmptyMsg>Você ainda não tem nenhum estilo de nome.</EmptyMsg>;
  return (
    <div className="flex flex-wrap gap-[14px]">
      {styles.map((s) => (
        <div
          key={s.id}
          className="rounded-[12px] border border-[#ece7e2] bg-[#fbfaf8] px-[14px] py-[10px]"
        >
          <StyledName
            styleId={s.id}
            className="text-[14px] font-bold tracking-[-0.02em]"
          >
            {s.label}
          </StyledName>
        </div>
      ))}
    </div>
  );
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-[40px] text-center text-[13px] font-semibold tracking-[-0.02em] text-[#b0a8a4]">
      {children}
    </p>
  );
}
