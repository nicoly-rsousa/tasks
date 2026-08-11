"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = "http://localhost:5000";

// Como o banco só guarda os IDs (status_id, priority_id, category_id),
// os rótulos ficam mapeados aqui no front. Ajuste os textos/IDs se
// no seu banco a numeração for diferente.
const STATUS_OPTIONS = [
  { id: 1, label: "A Fazer" },
  { id: 2, label: "Em Andamento" },
  { id: 3, label: "Concluída" },
];

const PRIORITY_OPTIONS = [
  { id: 1, label: "Baixa" },
  { id: 2, label: "Média" },
  { id: 3, label: "Alta" },
];

const CATEGORY_OPTIONS = [
  { id: 1, label: "Estudos" },
  { id: 2, label: "Trabalho" },
  { id: 3, label: "Pessoal" },
];

function labelFor(options: { id: number; label: string }[], id: number) {
  return options.find((option) => option.id === id)?.label ?? "—";
}

type Task = {
  id: number;
  title: string;
  description: string | null;
  status_id: number;
  priority_id: number;
  category_id: number;
};

type FormState = {
  title: string;
  description: string;
  statusId: number;
  priorityId: number;
  categoryId: number;
};

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  statusId: STATUS_OPTIONS[0].id,
  priorityId: PRIORITY_OPTIONS[0].id,
  categoryId: CATEGORY_OPTIONS[0].id,
};

export default function Home() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/healthy`);
      setApiOnline(response.ok);
    } catch {
      setApiOnline(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(`${API_URL}/task`);
      if (!response.ok) {
        throw new Error("A API respondeu com erro.");
      }
      const data: Task[] = await response.json();
      setTasks(data);
      setApiOnline(true);
    } catch {
      setLoadError(
        `Não foi possível conectar em ${API_URL}. Verifique se a API está rodando.`
      );
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkApiStatus();
    fetchTasks();
  }, [checkApiStatus, fetchTasks]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      const response = await fetch(`${API_URL}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          statusId: form.statusId,
          priorityId: form.priorityId,
          categoryId: form.categoryId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errors: Record<string, string> = {};
        (data.errors ?? []).forEach((err: { field: string; message: string }) => {
          errors[err.field] = err.message;
        });
        setFormErrors(errors);
        return;
      }

      setForm(INITIAL_FORM);
      await fetchTasks();
    } catch {
      setFormErrors({ title: "Não foi possível criar a tarefa. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTask(id: number) {
    const confirmed = window.confirm("Excluir esta tarefa?");
    if (!confirmed) return;

    try {
      await fetch(`${API_URL}/task/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch {
      fetchTasks();
    }
  }

  async function handleStatusChange(id: number, statusId: number) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status_id: statusId } : task))
    );
    try {
      await fetch(`${API_URL}/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
    } catch {
      fetchTasks();
    }
  }

  function handleReload() {
    checkApiStatus();
    fetchTasks();
  }

  return (
    <div className="min-h-full bg-emerald-50/40">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Gerenciador de Tarefas</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Consumindo a API REST em{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{API_URL}</code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
                apiOnline
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  apiOnline ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {apiOnline === null
                ? "Verificando..."
                : apiOnline
                ? "API Online / Conectada"
                : "API Offline / Desconectada"}
            </span>
            <button
              onClick={handleReload}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Recarregar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Coluna de tarefas */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Tarefas</h2>
            <span className="text-sm text-zinc-500">
              {tasks.length} encontrada(s)
            </span>
          </div>

          {loading && (
            <p className="py-10 text-center text-sm text-zinc-400">Carregando tarefas...</p>
          )}

          {!loading && loadError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="font-medium text-rose-700">Falha na requisição</p>
              <p className="mt-1 text-sm text-rose-600">{loadError}</p>
            </div>
          )}

          {!loading && !loadError && tasks.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-400">
              Nenhuma tarefa cadastrada ainda. Crie a primeira ao lado.
            </p>
          )}

          {!loading && !loadError && tasks.length > 0 && (
            <ul className="flex flex-col gap-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-zinc-200 p-4 transition-colors hover:border-zinc-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-900">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 text-sm text-zinc-500">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="shrink-0 text-sm text-zinc-400 hover:text-rose-600"
                      aria-label="Excluir tarefa"
                    >
                      Excluir
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={task.status_id}
                      onChange={(e) => handleStatusChange(task.id, Number(e.target.value))}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      {labelFor(PRIORITY_OPTIONS, task.priority_id)}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      {labelFor(CATEGORY_OPTIONS, task.category_id)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Coluna de criação */}
        <section className="h-fit rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Nova tarefa</h2>
          <p className="mt-1 text-sm text-zinc-500">Envia um POST /task para a API.</p>

          <form onSubmit={handleCreateTask} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Título <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder="Ex.: Estudar HTML"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {formErrors.title && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Detalhe o que precisa ser feito"
                rows={3}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
              />
              {formErrors.description && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Status</label>
                <select
                  value={form.statusId}
                  onChange={(e) => updateForm("statusId", Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm outline-none focus:border-teal-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Prioridade
                </label>
                <select
                  value={form.priorityId}
                  onChange={(e) => updateForm("priorityId", Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm outline-none focus:border-teal-500"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Categoria
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateForm("categoryId", Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 px-2 py-2 text-sm outline-none focus:border-teal-500"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Criando..." : "Criar tarefa"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
