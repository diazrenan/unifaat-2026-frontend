import clientApi from "./_clientApi";
import type { User, UserSearchFilters, PaginatedResponse } from "../types/api";

/**
 * Busca usuários via Elasticsearch (POST /users/search).
 * O backend faz a busca no ES, pega os ids e consulta o Postgres com WHERE IN.
 *
 * @param filters  Pelo menos um campo preenchido (name, email, job_title, bio, city, state)
 * @param page     Página atual (começa em 1)
 * @param limit    Itens por página (1–100, padrão do backend: 20)
 */
export async function userSearchApi(
  filters: UserSearchFilters,
  page: number,
  limit: number
): Promise<PaginatedResponse<User>> {
  const { data } = await clientApi.post<PaginatedResponse<User>>("/users/search", {
    filters,
    page,
    limit,
  });

  return data;
}
