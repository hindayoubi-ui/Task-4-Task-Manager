
// Get the task form
const taskForm = document.getElementById("taskForm");

// Get the form inputs
const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDeadlineInput = document.getElementById("taskDeadline");
const taskStatusInput = document.getElementById("taskStatus");

// Get the task list and empty message
const taskList = document.getElementById("taskList");
const noTasksMessage = document.getElementById("noTasksMessage");

// Get search and filter inputs
const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const statusFilter = document.getElementById("statusFilter");

// Get the form heading and save button
const formHeading = document.getElementById("formHeading");
const formDescription = document.getElementById("formDescription");
const saveTaskButton = document.getElementById("saveTaskButton");

// Name used to save tasks in localStorage
const STORAGE_KEY = "taskManagerTasks";

// Load saved tasks, or start with an empty array
let tasks = loadTasks();

// Read saved tasks safely
function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error("Could not load tasks:", error);
    return [];
  }
}

// Save the current tasks in localStorage
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Create a unique ID for every task
function createTaskId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

// Handle adding a new task or editing an existing one
taskForm.addEventListener("submit", function (event) {
  // Stop the page from refreshing when the form is submitted
  event.preventDefault();

  // Read the form values
  const taskId = taskIdInput.value;
  const title = taskTitleInput.value.trim();
  const description = taskDescriptionInput.value.trim();
  const priority = taskPriorityInput.value;
  const deadline = taskDeadlineInput.value;
  const status = taskStatusInput.value;

  // Do not save a task without a title or deadline
  if (!title || !deadline) {
    return;
  }

  // Check whether this task already exists
  const existingTask = tasks.find(function (task) {
    return task.id === taskId;
  });

  // Keep the original creation date when editing
  const taskData = {
    id: taskId || createTaskId(),
    title: title,
    description: description,
    priority: priority,
    deadline: deadline,
    status: status,
    createdAt: existingTask
      ? existingTask.createdAt
      : new Date().toISOString()
  };

  // Update an existing task, or add a new task
  if (existingTask) {
    tasks = tasks.map(function (task) {
      return task.id === taskId ? taskData : task;
    });
  } else {
    tasks.push(taskData);
  }

  // Save, update the list, and clear the form
  saveTasks();
  renderTasks();
  resetTaskForm();
});

// Display tasks according to search and filters
function renderTasks() {
  // Get the current search and filter values
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedPriority = priorityFilter.value;
  const selectedStatus = statusFilter.value;

  // Keep only tasks that match all selected conditions
  const filteredTasks = tasks.filter(function (task) {
    const matchesSearch =
      task.title.toLowerCase().includes(searchText);

    const matchesPriority =
      selectedPriority === "All" ||
      task.priority === selectedPriority;

    const matchesStatus =
      selectedStatus === "All" ||
      task.status === selectedStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Remove the old task cards before drawing the new list
  taskList.replaceChildren();

  // Show the empty message if there are no matching tasks
  noTasksMessage.classList.toggle("d-none", filteredTasks.length > 0);

  // Create a card for every matching task
  filteredTasks.forEach(function (task) {
    taskList.appendChild(createTaskCard(task));
  });
}

// Create one task card
function createTaskCard(task) {
  // Create the outer column
  const column = document.createElement("div");
  column.className = "col-12 col-md-6 col-xl-4 task-card";

  // Add a special class if the task is completed
  if (task.status === "Completed") {
    column.classList.add("completed");
  }

  // Create the card body
  const card = document.createElement("article");
  card.className = "task-card-inner";

  // Create the title
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  // Create the description
  const description = document.createElement("p");
  description.className = "task-description";

  if (task.description) {
    description.textContent = task.description;
  } else {
    description.textContent = "No description provided.";
    description.classList.add("task-description-empty");
  }

  // Create the badges container
  const badges = document.createElement("div");
  badges.className = "task-badges";

  // Create the priority badge
  const priorityBadge = document.createElement("span");
  priorityBadge.className =
    "task-badge priority-" + task.priority.toLowerCase();
  priorityBadge.textContent = task.priority + " Priority";

  // Create the status badge
  const statusClass = task.status
    .toLowerCase()
    .replace(/\s+/g, "-");

  const statusBadge = document.createElement("span");
  statusBadge.className = "task-badge status-" + statusClass;
  statusBadge.textContent = task.status;

  badges.append(priorityBadge, statusBadge);

  // Create the deadline section
  const meta = document.createElement("div");
  meta.className = "task-meta";

  const deadline = document.createElement("div");
  deadline.className = "task-deadline";

  // Add a calendar icon
  const calendarIcon = document.createElement("i");
  calendarIcon.className = "bi bi-calendar-event";

  // Format the deadline for display
  const deadlineText = document.createElement("span");
  deadlineText.textContent = formatDate(task.deadline);

  deadline.append(calendarIcon, deadlineText);

  // Mark overdue tasks that are not completed
  const today = getLocalDateString();

  if (task.deadline < today && task.status !== "Completed") {
    deadline.classList.add("overdue");
    deadlineText.textContent += " (Overdue)";
  }

  meta.appendChild(deadline);

  // Create the action buttons container
  const actions = document.createElement("div");
  actions.className = "task-actions";

  // Create the complete or reopen button
  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "btn btn-sm btn-outline-success";

  if (task.status === "Completed") {
    completeButton.innerHTML =
      '<i class="bi bi-arrow-counterclockwise"></i> Reopen';
  } else {
    completeButton.innerHTML =
      '<i class="bi bi-check2-circle"></i> Complete';
  }

  completeButton.addEventListener("click", function () {
    toggleCompleted(task.id);
  });

  // Create the edit button
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn btn-sm btn-outline-primary";
  editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';

  editButton.addEventListener("click", function () {
    editTask(task.id);
  });

  // Create the delete button
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-sm btn-outline-danger";
  deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';

  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  // Add the buttons to the card
  actions.append(completeButton, editButton, deleteButton);

  // Add all card sections together
  card.append(title, description, badges, meta, actions);
  column.appendChild(card);

  // Return the finished task card
  return column;
}

// Format a date as day, month, and year
function formatDate(dateString) {
  if (!dateString) {
    return "No deadline";
  }

  const parts = dateString.split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

// Get today's date in local YYYY-MM-DD format
function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

// Fill the form with the selected task for editing
function editTask(id) {
  const task = tasks.find(function (item) {
    return item.id === id;
  });

  // Stop if the task does not exist
  if (!task) {
    return;
  }

  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskDescriptionInput.value = task.description;
  taskPriorityInput.value = task.priority;
  taskDeadlineInput.value = task.deadline;
  taskStatusInput.value = task.status;

  // Change the form text to editing mode
  formHeading.textContent = "Edit Task";
  formDescription.textContent = "Update the task details below.";
  saveTaskButton.innerHTML =
    '<i class="bi bi-check-lg"></i> Update Task';

  // Move the page to the form
  document.getElementById("task-form-section").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Delete a task
function deleteTask(id) {
  const confirmed = confirm("Are you sure you want to delete this task?");

  if (!confirmed) {
    return;
  }

  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });

  saveTasks();
  renderTasks();

  // Clear the form if the deleted task was being edited
  if (taskIdInput.value === id) {
    resetTaskForm();
  }
}

// Mark a task completed or reopen it
function toggleCompleted(id) {
  tasks = tasks.map(function (task) {
    if (task.id !== id) {
      return task;
    }

    const newStatus =
      task.status === "Completed" ? "Pending" : "Completed";

    return {
      ...task,
      status: newStatus
    };
  });

  saveTasks();
  renderTasks();

  // Reset the form if it was editing this task
  if (taskIdInput.value === id) {
    resetTaskForm();
  }
}

// Clear the form and return it to create mode
function resetTaskForm() {
  taskForm.reset();
  taskIdInput.value = "";

  formHeading.textContent = "Create a New Task";
  formDescription.textContent =
    "Fill in the details below to add a task.";

  saveTaskButton.innerHTML =
    '<i class="bi bi-check-lg"></i> Save Task';
}

// Search tasks while the user types
searchInput.addEventListener("input", renderTasks);

// Update the list when a priority is selected
priorityFilter.addEventListener("change", renderTasks);

// Update the list when a status is selected
statusFilter.addEventListener("change", renderTasks);

// Return to create mode when Clear Form is clicked
taskForm.addEventListener("reset", function () {
  taskIdInput.value = "";
  formHeading.textContent = "Create a New Task";
  formDescription.textContent =
    "Fill in the details below to add a task.";

  saveTaskButton.innerHTML =
    '<i class="bi bi-check-lg"></i> Save Task';
});

// Display saved tasks when the page opens
renderTasks();
