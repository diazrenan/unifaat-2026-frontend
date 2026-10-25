import type { PaginatedResponse, User } from "../types/api";

/**
 * Renderiza os resultados da busca de usuários dentro de #assign-search-results.
 * Cada item mostra nome, e-mail, cargo e cidade/UF com um botão "Escolher".
 *
 * @param results   Resposta paginada da userSearchApi
 * @param onSelect  Callback chamado com o User quando o botão "Escolher" é clicado
 */
export default function userSearchResultsRender(
  results: PaginatedResponse<User>,
  onSelect: (user: User) => void
): void {
  const container = document.querySelector<HTMLDivElement>("#assign-search-results");
  if (!container) return;

  container.innerHTML = "";

  // ── Total encontrado ─────────────────────────────────────
  const totalEl = document.createElement("p");
  totalEl.classList.add("text-muted", "small", "mb-2");

  if (results.total === 0) {
    totalEl.textContent = "Nenhum usuário encontrado.";
    container.append(totalEl);
    return;
  }

  totalEl.textContent =
    results.total === 1
      ? "1 usuário encontrado"
      : `${results.total} usuários encontrados`;
  container.append(totalEl);

  // ── Lista de resultados ──────────────────────────────────
  const listEl = document.createElement("ul");
  listEl.classList.add("list-group");

  results.data.forEach((user) => {
    const liEl = document.createElement("li");
    liEl.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "gap-2"
    );

    const infoEl = document.createElement("div");
    infoEl.classList.add("d-flex", "flex-column", "flex-grow-1");

    const nameEl = document.createElement("span");
    nameEl.classList.add("fw-semibold");
    nameEl.textContent = user.name;

    const emailEl = document.createElement("span");
    emailEl.classList.add("text-muted", "small");
    emailEl.textContent = user.email;

    infoEl.append(nameEl, emailEl);

    // Cargo e cidade/UF — monta só com os campos não-nulos
    const parts: string[] = [];
    if (user.job_title) parts.push(user.job_title);

    const cityState = buildLocation(user.city, user.state);
    if (cityState) parts.push(cityState);

    if (parts.length > 0) {
      const detailEl = document.createElement("span");
      detailEl.classList.add("text-muted", "small");
      detailEl.textContent = parts.join(" · ");
      infoEl.append(detailEl);
    }

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.classList.add("btn", "btn-sm", "btn-outline-primary", "flex-shrink-0");
    selectBtn.textContent = "Escolher";
    selectBtn.addEventListener("click", () => onSelect(user));

    liEl.append(infoEl, selectBtn);
    listEl.append(liEl);
  });

  container.append(listEl);
}

// Monta "Cidade/UF", "Cidade", "UF" ou null — sem else
function buildLocation(city: string | null, state: string | null): string | null {
  if (city && state) return `${city}/${state}`;
  if (city) return city;
  if (state) return state;
  return null;
}
