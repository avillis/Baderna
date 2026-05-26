import { PanelShell } from "@/features/panel/components/panel-shell";

/* ─── Tipos & cores das tags ────────────────────────────────────────────── */
type LogType = "feat" | "fix" | "perf" | "refactor" | "chore";

const TYPE_META: Record<
  LogType,
  { label: string; bg: string; text: string }
> = {
  feat: { label: "Novidade", bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
  fix: { label: "Correção", bg: "bg-[#fff1ea]", text: "text-[#ff4100]" },
  perf: { label: "Performance", bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  refactor: {
    label: "Refatoração",
    bg: "bg-[#f3e8ff]",
    text: "text-[#7e22ce]",
  },
  chore: { label: "Geral", bg: "bg-[#f3f4f6]", text: "text-[#525252]" },
};

interface LogEntry {
  date: string; // YYYY-MM-DD
  type: LogType;
  title: string;
  description?: string;
}

/* ─── Histórico (do mais recente pro mais antigo) ───────────────────────── */
const LOGS: LogEntry[] = [
  // ╔══════ 26 de Maio de 2026 ══════╗
  {
    date: "2026-05-26",
    type: "feat",
    title: "Bot 'Baderna Ranking' no Discord",
    description:
      "Webhook horário que posta (e atualiza in-place) o Placar de Liderança no canal de rank. Mostra Ranking Baderna (todos membros, posicional) + Ranking Flex (com Riot ID, ordenado por elo). Custom emojis por tier (Ferro/Bronze/.../Desafiante), layout em duas colunas (Jogadores | Ranque), PDL ao invés de LP.",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Bot 'Baderna Inhouse' no Discord",
    description:
      "Webhook que anuncia novos inhouses no canal #-inhouse-. Duas fases pro modo Líder: 'Novo Inhouse criado!' com os líderes + Aguardando draft, depois '⚔️ Times prontos!' quando o draft fecha. Modo Aleatório dispara só uma vez completo. Mostra team_name custom dos líderes, fallback pra 'Time {nick}'.",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Página /logs com changelog público",
    description:
      "Esta página aqui mesmo. Linha do tempo de tudo que mudou desde o lançamento, agrupada por dia e categorizada (Novidade/Correção/Performance/etc).",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Sistema de @menções em posts, comentários e respostas",
    description:
      "Digite @ em qualquer caixa de texto e selecione um membro. Os mencionados recebem notificação automaticamente. Suporta navegação por teclado (setas, Enter, Esc) e renderiza menções como links pro perfil.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Sistema de notificações voltou a funcionar",
    description:
      "As rotas da API estavam faltando — 99 notificações estavam armazenadas mas inacessíveis. Agora tudo aparece no sino corretamente.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Curtir comentários/respostas sem layout shift",
    description:
      "O contador agora sempre reserva espaço (mesmo zerado), então clicar em curtir não empurra mais o conteúdo abaixo.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Emojis preservam a posição quando o contador muda",
    description:
      "Antes a lista reordenava por contagem — clicar num emoji no fim podia jogá-lo pro início. Agora cada emoji fica fixo onde apareceu pela primeira vez.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Picker de emoji abre pra dentro do post + snap",
    description:
      "Antes estourava pela direita. Setinhas de scroll agora fazem fade suave (não mais layout shift). Emojis fazem snap pra nunca ficar um cortado pela metade.",
  },
  {
    date: "2026-05-26",
    type: "perf",
    title: "Cliques em emoji reduzem requests pela metade",
    description:
      "Antes cada clique fazia POST + GET. Agora usa só a resposta do POST quando não há concorrência — você bate menos no rate limit do Laravel.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Race condition de reações concorrentes resolvida",
    description:
      "Cliques rápidos em vários emojis perdiam o estado por respostas chegando fora de ordem. Agora usa generation ref pra invalidar respostas atrasadas.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Bug histórico: emojis sendo tratados como iguais",
    description:
      "A coluna emoji usava utf8mb4_unicode_ci, que considera 🔥 = 😂 = 👽 (collation sem distinção pra muitos pontos Unicode). Migrado pra utf8mb4_bin (byte-exato).",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Reações por emoji reconstruídas do zero",
    description:
      "Picker completo com 8 categorias e ~250 emojis. Múltiplas reações por usuário no mesmo post. Scroll horizontal com setinhas pra navegar.",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Curtir e responder comentários no feed",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Colar imagem da área de transferência no composer e comentários",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Selecionar duo favorito no próprio perfil",
  },
  {
    date: "2026-05-26",
    type: "feat",
    title: "Título do jogo favorito desliza como player de música",
    description:
      "Quando o nome é muito longo pra caber, faz marquee suave com ease-in-out.",
  },
  {
    date: "2026-05-26",
    type: "fix",
    title: "Múltiplos ajustes mobile no perfil",
    description:
      "Espaçamentos, alinhamento de títulos e burger icon refinados.",
  },

  // ╔══════ 25 de Maio de 2026 ══════╗
  {
    date: "2026-05-25",
    type: "feat",
    title: "Sistema modular de perfil",
    description:
      "Escolha quais cards exibir (ranking, mains, jogo favorito, etc). Cada usuário monta o próprio layout.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Card de Mains editável",
    description:
      "A vitrine de campeões virou um card editável onde você seleciona seus 3 mains manualmente.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Estados vazios pra quem não joga LoL",
    description:
      "Cards de LoL desabilitam quando não há Riot ID conectada. Ranking Baderna aparece em destaque pra esse perfil.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Áudio da roleta sincronizado com a desaceleração",
    description:
      "O som acelera junto com a roleta e desacelera no fim. Som de vitória ao tirar épico, exclusivo ou lendário.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Confetti ao tirar exclusivo ou lendário na loja",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Drawer mobile reusando a sidebar (com gesto swipe)",
    description:
      "Menu mobile virou um drawer que empurra a página. Pode ser fechado com swipe horizontal.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Página de Regras",
    description:
      "Lista de regras da comunidade com navegação por scroll-spy.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Cartão compartilhável do perfil",
    description:
      "Gera uma imagem PNG do perfil (com capa, rank e identidade Baderna) pra compartilhar no Discord/WhatsApp.",
  },
  {
    date: "2026-05-25",
    type: "feat",
    title: "Aprovação de cadastros pendentes",
    description:
      "Novos cadastros ficam em fila até serem aprovados ou rejeitados pelo admin.",
  },

  // ╔══════ 24 de Maio de 2026 ══════╗
  {
    date: "2026-05-24",
    type: "feat",
    title: "Sistema de notificações (sino + página)",
    description:
      "Sino no header com badge. Notifica curtidas em post, comentários no perfil e (agora também) menções.",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Comparação de 2 membros lado a lado",
    description:
      "Aba Membros agora permite escolher 2 perfis e ver rank, winrate e mains comparados.",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Página de Ranking (leaderboard por elo)",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Toggle Flex/Inhouse no ranking",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Busca e filtro por lane na página de Membros",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Painel admin de aprovação de contas",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Lightbox de imagens no feed e comentários",
    description: "Toque na imagem pra abrir em tela cheia com zoom.",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Trocar avatar pelo próprio perfil",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Conceito de Dono protege contra remoção por outros admins",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Auto-logout quando a sessão expira (401)",
  },
  {
    date: "2026-05-24",
    type: "fix",
    title: "iOS: bloqueia auto-zoom ao focar inputs",
  },
  {
    date: "2026-05-24",
    type: "feat",
    title: "Sistema de toast no canto inferior direito",
    description: "Mensagens de erro/sucesso unificadas, substituindo erros inline.",
  },

  // ╔══════ 23 de Maio de 2026 ══════╗
  {
    date: "2026-05-23",
    type: "feat",
    title: "Player de vídeo customizado",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Upload de vídeo em posts (até 20MB)",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Responsividade mobile end-to-end",
    description:
      "Toda a interface foi adaptada pra mobile, incluindo perfil, feed, modais e comparações.",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Sistema de comentários nos posts",
    description: "Com suporte a imagem, GIF e menções ao autor.",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Recuperação de senha por email",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Pull-to-refresh no feed",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "Short codes em posts (URLs amigáveis)",
    description: "Posts agora têm URL tipo /post/abc123 em vez de /post/42.",
  },
  {
    date: "2026-05-23",
    type: "feat",
    title: "StyledName e nome real nos comentários e feed",
    description:
      "O nickname com estilo aparece no topo, com o nome real abaixo em cinza (padrão Twitter).",
  },

  // ╔══════ 22 de Maio de 2026 ══════╗
  {
    date: "2026-05-22",
    type: "feat",
    title: "Feed completo com posts, composer e Giphy",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Sistema de logs do admin",
    description:
      "Auditoria de todas as ações administrativas (mudanças de cargo, banimentos, etc).",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "55 estilos de nome desbloqueáveis",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Loja com roleta de raridades",
    description:
      "Roleta animada, raridades de Comum até Lendário e moedas como economia.",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Avatar picker com aba Riot",
    description: "Use o ícone da sua conta Riot como avatar.",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Bônus de 250 moedas pra novos cadastros",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Painel admin completo",
    description:
      "Gerenciamento de membros, settings, emails, error logs e Riot API key.",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "2225 splash arts de campeões via storage",
  },
  {
    date: "2026-05-22",
    type: "feat",
    title: "Sistema de winrates por season",
  },

  // ╔══════ 19 de Maio de 2026 ══════╗
  {
    date: "2026-05-19",
    type: "feat",
    title: "Lançamento inicial — Baderna v1",
    description:
      "Setup inicial do projeto: Next.js 14 (frontend, deploy Vercel) + Laravel 12 (API, deploy Hostinger). Autenticação via Sanctum, primeiros endpoints de membros e perfis.",
  },
];

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function formatDateLong(iso: string): string {
  // 2026-05-26 → "26 de maio de 2026"
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ─── Página ────────────────────────────────────────────────────────────── */
export default function LogsPage() {
  // Agrupa por data preservando a ordem do array (já está do mais recente
  // pro mais antigo). Usa Map pra manter inserção.
  const byDate = new Map<string, LogEntry[]>();
  for (const log of LOGS) {
    if (!byDate.has(log.date)) byDate.set(log.date, []);
    byDate.get(log.date)!.push(log);
  }

  return (
    <PanelShell showBanner={false}>
      <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-6 sm:py-10">
        {/* Cabeçalho */}
        <header className="mb-[36px]">
          <h1 className="text-[32px] font-bold tracking-[-0.04em] text-[#0f0f0f] sm:text-[40px]">
            Logs
          </h1>
          <p className="mt-[6px] text-[14px] text-[#7c7c7c] sm:text-[15px]">
            Tudo que mudou no Baderna desde o início. Em ordem cronológica
            reversa, do mais recente pro lançamento.
          </p>
        </header>

        {/* Timeline */}
        <div className="space-y-[40px]">
          {Array.from(byDate.entries()).map(([date, entries]) => (
            <section key={date}>
              <h2 className="mb-[14px] flex items-baseline gap-[10px] text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                <span>{formatDateLong(date)}</span>
                <span className="text-[12px] font-medium text-[#a4a4a4]">
                  {entries.length}{" "}
                  {entries.length === 1 ? "atualização" : "atualizações"}
                </span>
              </h2>
              <ul className="space-y-[12px]">
                {entries.map((log, i) => {
                  const meta = TYPE_META[log.type];
                  return (
                    <li
                      key={`${date}-${i}`}
                      className="flex flex-col gap-[10px] rounded-[14px] bg-white p-[16px] shadow-[0px_4px_24px_rgba(0,0,0,0.04)] sm:flex-row sm:items-start sm:gap-[14px]"
                    >
                      <span
                        className={`inline-flex h-[22px] w-fit flex-shrink-0 items-center justify-center rounded-full px-[10px] text-[11px] font-bold tracking-[-0.01em] ${meta.bg} ${meta.text}`}
                      >
                        {meta.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0f0f0f] sm:text-[15px]">
                          {log.title}
                        </p>
                        {log.description && (
                          <p className="mt-[4px] text-[12px] leading-[1.5] text-[#7c7c7c] sm:text-[13px]">
                            {log.description}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <footer className="mt-[48px] text-center text-[12px] text-[#a4a4a4]">
          {LOGS.length} atualizações registradas
        </footer>
      </div>
    </PanelShell>
  );
}
