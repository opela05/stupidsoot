const todoTab = document.getElementById("todo");

if (todoTab) {
  let container = document.createElement("div");
  container.className = "todo-container";

  container.innerHTML = `
    <textarea id="todoText" class="todo-input" placeholder="task it!" rows="1"></textarea>
    <ul id="todoList" class="todo-list"></ul>
  `;

  todoTab.appendChild(container);

  const input = container.querySelector("#todoText");
  const todoList = container.querySelector("#todoList");

  let tasks = [];

  const saveTasks = async () => {
    try {
      await chrome.storage.local.set({ todos: tasks });
    } catch (error) {
      console.error("error saving todos:", error);
    }
  };

  const loadTasks = async () => {
    try {
      const result = await chrome.storage.local.get("todos");
      if (result.todos) {
        tasks = result.todos;
        tasks.forEach((task) => {
          renderTask(task.text, task.completed);
        });
      }
    } catch (error) {
      console.error("error loading todos:", error);
    }
  };

  const renderTask = (text, completed) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    if (completed) {
      li.classList.add("done");
    }

    const checkboxIconClass = completed ? "bi-check2-square" : "bi-square";
    const checkboxTitle = completed ? "Mark as undone" : "Mark as done";

    li.innerHTML = `
      <i class="bi ${checkboxIconClass} task-checkbox" title="${checkboxTitle}"></i>
      <span class="task-text">${text}</span>
      <span class="task-actions">
        <i class="bi bi-x-circle remove-icon" title="Remove task"></i>
      </span>
    `;

    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("click", () => {
      li.classList.toggle("done");
      const isDone = li.classList.contains("done");
      checkbox.classList.toggle("bi-check2-square", isDone);
      checkbox.classList.toggle("bi-square", !isDone);
      checkbox.title = isDone ? "Mark as undone" : "Mark as done";

      const taskIndex = tasks.findIndex(item => item.text === text);
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = isDone;
        saveTasks();
      }
    });

    li.querySelector(".remove-icon").addEventListener("click", () => {
      li.remove();
      tasks = tasks.filter(item => item.text !== text);
      saveTasks();
    });

    todoList.appendChild(li);
  };

  const addTask = (taskText) => {
    const task = taskText.trim();
    if (task !== "") {
      tasks.push({ text: task, completed: false });
      saveTasks();
      renderTask(task, false);
      input.value = "";
      input.focus();
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      const lines = input.value.split('\n');
      const currentLineText = lines[lines.length - 1]; // Get the last line
      addTask(currentLineText);
      input.value = ""; // Clear the input after adding the task
      input.focus();
    } else if (e.key === "Enter") {
      // Just move to the next line in textarea
      // No explicit action needed as default behavior for Enter in textarea is new line
    }
  });

  loadTasks();
  input.focus();
}