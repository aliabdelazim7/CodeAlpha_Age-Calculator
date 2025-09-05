class TodoApp {
    constructor() {
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.draggedTask = null;
        this.draggedOverTask = null;
        
        this.elements = {
            taskList: document.getElementById('task-list'),
            taskCount: document.getElementById('task-count'),
            addTaskForm: document.getElementById('add-task-form'),
            taskTitle: document.getElementById('task-title'),
            dueDate: document.getElementById('due-date'),
            priority: document.getElementById('priority'),
            searchInput: document.getElementById('search-input'),
            filterButtons: document.querySelectorAll('.filter-btn'),
            clearCompleted: document.getElementById('clear-completed'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            emptyState: document.getElementById('empty-state'),
            statsFooter: document.getElementById('stats-footer'),
            deleteModal: document.getElementById('delete-confirm'),
            deleteCancel: document.getElementById('delete-cancel'),
            deleteConfirm: document.getElementById('delete-confirm-btn'),
            announcements: document.getElementById('announcements')
        };
        
        this.init();
    }
    
    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.render();
        this.announce('To-Do List loaded successfully');
    }
    
    setupEventListeners() {
        this.elements.addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        
        let searchTimeout;
        this.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.applyFilters();
            }, 300);
        });
        
        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
        
        this.elements.clearCompleted.addEventListener('click', () => this.clearCompleted());
        
        this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        this.elements.deleteCancel.addEventListener('click', () => this.hideDeleteModal());
        this.elements.deleteConfirm.addEventListener('click', () => this.confirmDelete());
        
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        this.setupDragAndDrop();
        
        this.elements.taskList.addEventListener('click', (e) => this.handleTaskListClick(e));
        this.elements.taskList.addEventListener('change', (e) => this.handleTaskListChange(e));
    }
    
    setupDragAndDrop() {
        this.elements.taskList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });
        
        this.elements.taskList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
                this.draggedTask = null;
            }
        });
        
        this.elements.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const taskItem = e.target.closest('.task-item');
            if (taskItem && taskItem !== this.draggedTask) {
                this.draggedOverTask = taskItem;
                taskItem.classList.add('drag-over');
            }
        });
        
        this.elements.taskList.addEventListener('dragleave', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                taskItem.classList.remove('drag-over');
            }
        });
        
        this.elements.taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedTask && this.draggedOverTask) {
                const draggedId = this.draggedTask.dataset.taskId;
                const targetId = this.draggedOverTask.dataset.taskId;
                
                this.reorderTasks(draggedId, targetId);
                this.announce(`Task moved`);
            }
            
            document.querySelectorAll('.task-item').forEach(item => {
                item.classList.remove('drag-over');
            });
        });
    }
    
    handleKeyboardShortcuts(e) {
        if (e.key === 'Escape') {
            const editInput = document.querySelector('.task-title-edit');
            if (editInput) {
                this.cancelEdit(editInput);
            } else if (this.elements.deleteModal.classList.contains('show')) {
                this.hideDeleteModal();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const editInput = document.querySelector('.task-title-edit');
            if (editInput) {
                this.saveEdit(editInput);
            }
        }
    }
    
    handleAddTask(e) {
        e.preventDefault();
        
        const title = this.elements.taskTitle.value.trim();
        const dueDate = this.elements.dueDate.value || null;
        const priority = this.elements.priority.value;
        
        if (!title) {
            this.announce('Please enter a task title');
            this.elements.taskTitle.focus();
            return;
        }
        
        const isDuplicate = this.tasks.some(task => 
            task.title.toLowerCase() === title.toLowerCase()
        );
        
        if (isDuplicate) {
            this.announce('A task with this title already exists');
            this.elements.taskTitle.focus();
            return;
        }
        
        this.addTask({ title, dueDate, priority });
        
        this.elements.addTaskForm.reset();
        this.elements.priority.value = 'medium';
        this.elements.taskTitle.focus();
    }
    
    handleFilterChange(e) {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;
        this.elements.filterButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        e.target.classList.add('active');
        e.target.setAttribute('aria-selected', 'true');
        
        this.applyFilters();
    }
    
    handleTaskListClick(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.taskId;
        
        if (e.target.classList.contains('edit-btn')) {
            this.startEdit(taskId);
        } else if (e.target.classList.contains('delete-btn')) {
            this.showDeleteModal(taskId);
        }
    }
    
    handleTaskListChange(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const taskId = e.target.closest('.task-item').dataset.taskId;
            this.toggleComplete(taskId);
        }
    }
    
    addTask({ title, dueDate, priority }) {
        const task = {
            id: this.generateId(),
            title: title.trim(),
            completed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            dueDate,
            priority,
            order: this.tasks.length
        };
        
        this.tasks.push(task);
        this.saveTasks();
        this.applyFilters();
        this.announce(`Task "${title}" added`);
    }
    
    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = Date.now();
            this.saveTasks();
            this.applyFilters();
            this.announce(`Task ${task.completed ? 'completed' : 'marked as active'}`);
        }
    }
    
    startEdit(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
        const titleElement = taskItem.querySelector('.task-title');
        
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-title-edit';
        editInput.value = task.title;
        
        titleElement.parentNode.replaceChild(editInput, titleElement);
        editInput.focus();
        editInput.select();
        editInput.addEventListener('blur', () => this.saveEdit(editInput));
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveEdit(editInput);
            } else if (e.key === 'Escape') {
                this.cancelEdit(editInput);
            }
        });
    }
    
    saveEdit(editInput) {
        const taskItem = editInput.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        const newTitle = editInput.value.trim();
        
        if (!newTitle) {
            this.cancelEdit(editInput);
            return;
        }
        
        const isDuplicate = this.tasks.some(task => 
            task.id !== taskId && task.title.toLowerCase() === newTitle.toLowerCase()
        );
        
        if (isDuplicate) {
            this.announce('A task with this title already exists');
            editInput.focus();
            return;
        }
        
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.title = newTitle;
            task.updatedAt = Date.now();
            this.saveTasks();
            this.render();
            this.announce(`Task updated to "${newTitle}"`);
        }
    }
    
    cancelEdit(editInput) {
        const taskItem = editInput.closest('.task-item');
        const taskId = taskItem.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            const titleElement = document.createElement('span');
            titleElement.className = 'task-title';
            titleElement.textContent = task.title;
            
            editInput.parentNode.replaceChild(titleElement, editInput);
        }
    }
    
    showDeleteModal(taskId) {
        this.elements.deleteModal.dataset.taskId = taskId;
        this.elements.deleteModal.classList.add('show');
        this.elements.deleteModal.setAttribute('aria-hidden', 'false');
        this.elements.deleteConfirm.focus();
    }
    
    hideDeleteModal() {
        this.elements.deleteModal.classList.remove('show');
        this.elements.deleteModal.setAttribute('aria-hidden', 'true');
        this.elements.deleteModal.removeAttribute('data-task-id');
    }
    
    confirmDelete() {
        const taskId = this.elements.deleteModal.dataset.taskId;
        if (taskId) {
            this.deleteTask(taskId);
            this.hideDeleteModal();
        }
    }
    
    deleteTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const task = this.tasks[taskIndex];
            this.tasks.splice(taskIndex, 1);
            this.saveTasks();
            this.applyFilters();
            this.announce(`Task "${task.title}" deleted`);
        }
    }
    
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.announce('No completed tasks to clear');
            return;
        }
        
        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.applyFilters();
        this.announce(`${completedCount} completed task${completedCount === 1 ? '' : 's'} cleared`);
    }
    
    reorderTasks(draggedId, targetId) {
        const draggedIndex = this.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = this.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const draggedTask = this.tasks.splice(draggedIndex, 1)[0];
        
        this.tasks.splice(targetIndex, 0, draggedTask);
        this.tasks.forEach((task, index) => {
            task.order = index;
        });
        
        this.saveTasks();
        this.render();
    }
    
    applyFilters() {
        let filtered = [...this.tasks];
        
        if (this.currentFilter === 'active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (this.currentFilter === 'completed') {
            filtered = filtered.filter(task => task.completed);
        }
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(this.searchQuery)
            );
        }
        
        this.filteredTasks = filtered;
        this.render();
    }
    
    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('todo:theme', newTheme);
        
        const themeIcon = this.elements.darkModeToggle.querySelector('.theme-icon');
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        this.announce(`Switched to ${newTheme} mode`);
    }
    
    render() {
        this.renderTaskList();
        this.updateTaskCounter();
        this.updateStats();
        this.updateEmptyState();
        this.updateClearCompletedButton();
    }
    
    renderTaskList() {
        const fragment = document.createDocumentFragment();
        
        this.filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            fragment.appendChild(taskElement);
        });
        
        this.elements.taskList.innerHTML = '';
        this.elements.taskList.appendChild(fragment);
    }
    
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.taskId = task.id;
        li.draggable = true;
        
        const isOverdue = this.isOverdue(task);
        
        li.innerHTML = `
            <div class="task-content">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
                >
                <div class="task-details">
                    <span class="task-title ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                        ${this.escapeHtml(task.title)}
                    </span>
                    <div class="task-meta">
                        ${task.dueDate ? `
                            <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                📅 ${this.formatDate(task.dueDate)}
                            </span>
                        ` : ''}
                        <span class="priority-pill ${task.priority}">
                            ${task.priority}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button type="button" class="btn btn-secondary edit-btn" title="Edit task">
                        ✏️
                    </button>
                    <button type="button" class="btn btn-danger delete-btn" title="Delete task">
                        🗑️
                    </button>
                </div>
            </div>
        `;
        
        return li;
    }
    
    updateTaskCounter() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        let counterText;
        if (total === 0) {
            counterText = 'No tasks';
        } else if (completed === 0) {
            counterText = `${active} task${active === 1 ? '' : 's'}`;
        } else if (active === 0) {
            counterText = `${completed} completed task${completed === 1 ? '' : 's'}`;
        } else {
            counterText = `${total} task${total === 1 ? '' : 's'}, ${completed} completed`;
        }
        
        this.elements.taskCount.textContent = counterText;
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const overdue = this.tasks.filter(t => !t.completed && this.isOverdue(t)).length;
        
        if (total === 0) {
            this.elements.statsFooter.style.display = 'none';
            return;
        }
        
        this.elements.statsFooter.style.display = 'block';
        this.elements.statsFooter.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${active}</div>
                    <div class="stat-label">Active</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${completed}</div>
                    <div class="stat-label">Completed</div>
                </div>
                ${overdue > 0 ? `
                    <div class="stat-item">
                        <div class="stat-value">${overdue}</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    updateEmptyState() {
        const hasTasks = this.filteredTasks.length > 0;
        this.elements.emptyState.style.display = hasTasks ? 'none' : 'block';
        
        if (!hasTasks) {
            let message = 'No tasks yet';
            let description = 'Add your first task above to get started!';
            
            if (this.searchQuery) {
                message = 'No tasks found';
                description = `No tasks match "${this.searchQuery}"`;
            } else if (this.currentFilter === 'active') {
                message = 'No active tasks';
                description = 'All tasks are completed!';
            } else if (this.currentFilter === 'completed') {
                message = 'No completed tasks';
                description = 'Complete some tasks to see them here';
            }
            
            this.elements.emptyState.querySelector('h2').textContent = message;
            this.elements.emptyState.querySelector('p').textContent = description;
        }
    }
    
    updateClearCompletedButton() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        this.elements.clearCompleted.disabled = completedCount === 0;
        this.elements.clearCompleted.textContent = 
            completedCount > 0 ? `Clear Completed (${completedCount})` : 'Clear Completed';
    }
    
    isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        
        const today = new Date().toISOString().split('T')[0];
        return task.dueDate < today;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (dateString === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateString === tomorrow.toISOString().split('T')[0]) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString();
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    announce(message) {
        this.elements.announcements.textContent = message;
        setTimeout(() => {
            this.elements.announcements.textContent = '';
        }, 1000);
    }
    
    loadTasks() {
        try {
            const stored = localStorage.getItem('todo:v1');
            if (stored) {
                this.tasks = JSON.parse(stored);
                this.tasks = this.tasks.map(task => ({
                    id: task.id || this.generateId(),
                    title: task.title || '',
                    completed: Boolean(task.completed),
                    createdAt: task.createdAt || Date.now(),
                    updatedAt: task.updatedAt || Date.now(),
                    dueDate: task.dueDate || null,
                    priority: task.priority || 'medium',
                    order: typeof task.order === 'number' ? task.order : this.tasks.indexOf(task)
                }));
            }
        } catch (error) {
            console.warn('Failed to load tasks from localStorage:', error);
            this.tasks = [];
        }
        
        const savedTheme = localStorage.getItem('todo:theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            const themeIcon = this.elements.darkModeToggle.querySelector('.theme-icon');
            themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    saveTasks() {
        try {
            localStorage.setItem('todo:v1', JSON.stringify(this.tasks));
        } catch (error) {
            console.warn('Failed to save tasks to localStorage:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TodoApp;
}
