import type { User, UserSearchFilters } from "../types/api";
import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";

/**
 * Registra todos os listeners do modal #assign-task-modal:
 * busca de usuário e criação da tarefa para outro usuário.
 *
 * @param idUser  ID do usuário autenticado
 */
export default function assignTaskModalListeners(idUser: number): void {
  const modalEl = document.querySelector<HTMLElement>("#assign-task-modal");
  const searchBtn = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const searchFieldSelect = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValueInput = document.querySelector<HTMLInputElement>("#assign-search-value");
  const resultsContainer = document.querySelector<HTMLDivElement>("#assign-search-results");
  const submitBtn = document.querySelector<HTMLButtonElement>("#assign-task-submit");

  // Usuário escolhido — compartilhado entre busca e criação
  let selectedUser: User | null = null;

  // ── Helpers ──────────────────────────────────────────────

  function showResultsMessage(message: string, isError = false): void {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = "";
    const p = document.createElement("p");
    p.classList.add("small", "mb-0", isError ? "text-danger" : "text-muted");
    p.textContent = message;
    resultsContainer.append(p);
  }

  function showSubmitMessage(message: string, isError = false): void {
    const selectedContainer = document.querySelector<HTMLDivElement>("#assign-selected-user");
    if (!selectedContainer) return;

    selectedContainer.querySelector(".assign-feedback")?.remove();

    const alertEl = document.createElement("div");
    alertEl.classList.add(
      "alert",
      "assign-feedback",
      "py-2",
      "mb-0",
      "mt-2",
      isError ? "alert-danger" : "alert-info"
    );
    alertEl.textContent = message;
    selectedContainer.append(alertEl);
  }

  function closeModal(): void {
    // Fecha via atributo data-bs-dismiss para não depender da instância JS do Bootstrap
    modalEl
      ?.querySelector<HTMLButtonElement>("[data-bs-dismiss='modal']")
      ?.click();
  }

  // ── Escolher usuário ─────────────────────────────────────

  function handleUserSelect(user: User): void {
    selectedUser = user;

    const selectedContainer = document.querySelector<HTMLDivElement>("#assign-selected-user");
    if (!selectedContainer) return;

    selectedContainer.innerHTML = "";

    const badge = document.createElement("div");
    badge.classList.add("alert", "alert-success", "py-2", "mb-0");
    badge.textContent = `Atribuir para: ${user.name} (${user.email})`;
    selectedContainer.append(badge);
  }

  // ── Monta o filtro a partir do campo escolhido no <select> ───────────────
  // Necessário porque { [field]: value } não é atribuível a UserSearchFilters
  // diretamente — o TypeScript não consegue estreitar a chave dinâmica.

  const fieldMap: Record<string, keyof UserSearchFilters> = {
    name: "name",
    email: "email",
    job_title: "job_title",
    bio: "bio",
    city: "city",
    state: "state",
  };

  function buildFilters(field: string, value: string): UserSearchFilters | null {
    const key = fieldMap[field];
    if (!key) return null;
    return { [key]: value };
  }

  // ── Busca ────────────────────────────────────────────────

  async function handleSearch(): Promise<void> {
    const field = searchFieldSelect?.value ?? "";
    const value = searchValueInput?.value.trim() ?? "";

    if (!value) {
      showResultsMessage("Digite algo para buscar.");
      return;
    }

    const filters = buildFilters(field, value);
    if (!filters) {
      showResultsMessage("Campo de busca inválido.", true);
      return;
    }

    try {
      const results = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(results, handleUserSelect);
    } catch {
      showResultsMessage("Erro ao buscar usuários. Tente novamente.", true);
    }
  }

  searchBtn?.addEventListener("click", handleSearch);

  searchValueInput?.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    handleSearch();
  });

  // ── Criar tarefa ─────────────────────────────────────────

  async function handleSubmit(): Promise<void> {
    const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
    const taskName = taskNameInput?.value.trim() ?? "";

    if (!taskName) {
      showSubmitMessage("Digite o nome da tarefa.", true);
      return;
    }

    if (!selectedUser) {
      showSubmitMessage("Escolha um usuário antes de criar a tarefa.", true);
      return;
    }

    const targetUser = selectedUser;

    try {
      await taskCreateApi(targetUser.id, { name: taskName });

      closeModal();

      // Alerta de sucesso temporário na tela de tarefas (fora do modal)
      const tasksContainer = document.querySelector<HTMLElement>("#tasks-container");
      if (tasksContainer) {
        const successAlert = document.createElement("div");
        successAlert.classList.add("alert", "alert-success", "alert-dismissible", "fade", "show");
        successAlert.setAttribute("role", "alert");
        successAlert.innerHTML =
          `Tarefa criada para <strong>${targetUser.name}</strong>.` +
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;
        tasksContainer.prepend(successAlert);
        setTimeout(() => successAlert.remove(), 4000);
      }

      // Recarrega a lista só se a tarefa foi criada para o próprio usuário logado
      if (targetUser.id === idUser) {
        await tasksListRender(idUser);
      }
    } catch {
      showSubmitMessage("Erro ao criar a tarefa. Tente novamente.", true);
    }
  }

  submitBtn?.addEventListener("click", handleSubmit);

  // ── Limpar ao fechar o modal ──────────────────────────────

  modalEl?.addEventListener("hidden.bs.modal", () => {
    selectedUser = null;

    const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
    if (taskNameInput) taskNameInput.value = "";
    if (searchValueInput) searchValueInput.value = "";
    if (resultsContainer) resultsContainer.innerHTML = "";

    const selectedContainer = document.querySelector<HTMLDivElement>("#assign-selected-user");
    if (selectedContainer) selectedContainer.innerHTML = "";
  });
}
