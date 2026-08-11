import express from "express";
import cors from "cors";
import { db } from "./database/connection";
import { AddTaskInput, addTaskSchema } from "./schemas";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

const corsOptions = {
    origin: "*"
}

app.use(cors(corsOptions));

app.get("/healthy", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
})

app.post("/task", async (req, res) => {
    const { title, description, statusId, priorityId, categoryId } = req.body as AddTaskInput;

    // 1. Validar o body da requisição ( zod validação de entrada )
    const validatedData = addTaskSchema.safeParse({ title, description, statusId, priorityId, categoryId });

    if (!validatedData.success) {
        const errors = validatedData.error.issues.map((err) => ({
            field: err.path[0],
            message: err.message
        }));

        return res.status(400).json({ message: "Existem erros ao enviar sua requisição.", errors });
    }


    // 2. Insere no banco 
    await db("tasks").insert({ title, description, status_id: statusId, priority_id: priorityId, category_id: categoryId });

    // 3. Retorna status 201, com as infomações criadas
    return res.status(201).json({ message: "Task criada com sucesso !", data: { title, description, statusId, priorityId, categoryId } });
})

app.get("/task", async (req, res) => {
    try {
        const tasks = await db("tasks").select("*").orderBy("id", "desc");
        return res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar tarefas." });
    }
})

app.get("/task/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Verificar se o id enviado existe no banco
        const task = await db("tasks").where({ id }).first();

        // 2. Retorna erro em caso de nao existir
        if (!task) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        // 3. Retorna as informações se existir
        return res.status(200).json(task);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar tarefa." });
    }
})

app.patch("/task/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, statusId, priorityId, categoryId } = req.body;

    try {
        // 1. Verificar se o id enviado existe no banco
        const existing = await db("tasks").where({ id }).first();

        // 2. Retorna erro em caso de nao existir
        if (!existing) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        // 3. Atualiza as informações conforme body da requisição
        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (statusId !== undefined) updateData.status_id = statusId;
        if (priorityId !== undefined) updateData.priority_id = priorityId;
        if (categoryId !== undefined) updateData.category_id = categoryId;

        await db("tasks").where({ id }).update(updateData);
        const updated = await db("tasks").where({ id }).first();

        return res.status(200).json({ message: "Tarefa atualizada com sucesso!", data: updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao atualizar tarefa." });
    }
})

app.delete("/task/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await db("tasks").where({ id }).del();

        if (!deleted) {
            return res.status(404).json({ message: "Tarefa não encontrada." });
        }

        return res.status(200).json({ message: "Tarefa excluída com sucesso!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao excluir tarefa." });
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
