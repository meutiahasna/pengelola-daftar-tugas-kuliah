import './style.css'

// Logika Utama Aplikasi pake Vanilla TypeScript dan DOM API

import type { Task, TaskList, TaskPriority } from './types';
import { getFromStorage, saveToStorage } from './storage';

// Baca Environment Variables - Non-rahasia (Nama Aplikasi/Versi Aplikasi)
const appTitle: string = import.meta.env.VITE_APP_TITLE || 'Pengelola Daftar Tugas Kuliah';
const appVersion: string = import.meta.env.VITE_APP_VERSION || '1.0.0';

// State Utama Aplikasi (Array of Task)
let tasks: TaskList = getFromStorage<TaskList>('VITE_TASKS_DATA', []);
let editingTaskId: string | null = null;

// Ambil elemen DOM dengan Type Casting TypeScript
const titleEl = document.getElementById('app-title') as HTMLHeadingElement;
const versionEl = document.getElementById('app-version') as HTMLParagraphElement;
const formEl = document.getElementById('task-form') as HTMLFormElement;
const formHeadingEl = document.getElementById('form-heading') as HTMLHeadingElement;

const taskIdInput = document.getElementById('task-id') as HTMLInputElement;
const taskTitleInput = document.getElementById('task-title') as HTMLInputElement;
const taskCourseInput = document.getElementById('task-course') as HTMLInputElement;
const taskDeadlineInput = document.getElementById('task-deadline') as HTMLInputElement;
const taskPrioritySelect = document.getElementById('task-priority') as HTMLSelectElement;
const taskImportantInput = document.getElementById('task-important') as HTMLInputElement;

const btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement;
const taskListContainer = document.getElementById('task-list') as HTMLDivElement;

// Inisialisasi header dari Environment Variable
titleEl.textContent = appTitle;
versionEl.textContent = `Versi Aplikasi: ${appVersion}`;

// Fungsi untuk mengecek apakah tenggat sudah dekat (misal H-1 atau hari ini)
function getDynamicPriority(deadlineStr: string, currentPriority: TaskPriority): { priority: TaskPriority; isUrgent: boolean } {
  if (!deadlineStr) return { priority: currentPriority, isUrgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set waktu ke 00:00:00

  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);

  // Hitung selisih hari (dalam milidetik -> hari)
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Kalau tenggat kurang dari atau sama dengan 1 hari akan diberi peringatan bahwa sedang mendekati tenggat
  if (diffDays <= 1) {
    return { priority: 'Tinggi', isUrgent: true };
  }

  return { priority: currentPriority, isUrgent: false };
}

// Fungsi render daftar tugas ke DOM
function renderTasks(): void {
  // Simpan state terbaru ke LocalStorage pake Generics
  saveToStorage<TaskList>('VITE_TASKS_DATA', tasks);

  // Kalau daftar tugas kosong
  if (tasks.length === 0) {
    taskListContainer.innerHTML = `<p class="empty-msg">Belum ada tugas kuliah. Silakan tambah tugas di atas!</p>`;
    return;
  }

  // Render elemen HTML untuk setiap tugas dalam Array
  taskListContainer.innerHTML = tasks
    .map((task: Task) => {
      const isCompleted = task.status === 'Selesai';

      // Cek apakah mendekati tenggat untuk otomatisasi prioritas
    const dynamic = getDynamicPriority(task.deadline, task.priority);
    const displayPriority = dynamic.priority;
    const isUrgentNotice = dynamic.isUrgent && !isCompleted;

      return `
        <div class="task-card ${isCompleted ? 'completed' : ''} ${isUrgentNotice ? 'urgent' : ''}">
          <div class="task-info">
            <h4>
              ${task.isImportant ? '⭐ ' : ''} ${isUrgentNotice ? '⚠️ ' : ''}${task.title}
            </h4>
            
            <div class="task-meta">
              <div>Mata Kuliah: ${task.course}</div>
              <div>Tenggat: ${(() => {
                if (!task.deadline) return '-';
                const dateObj = new Date(task.deadline);
                // Cek apakah tanggal yang dimasukkan valid
                if (isNaN(dateObj.getTime())) return task.deadline; 
                
                // Ubah tanggal menjadi format Indonesia lengkap dengan nama hari
                return dateObj.toLocaleDateString('id-ID', {
                  weekday: 'long', // Menampilkan nama hari
                  year: 'numeric',
                  month: 'long',   // Menampilkan nama bulan 
                  day: 'numeric'
                });
              })()}</div>

              <div>Prioritas: ${displayPriority} ${isUrgentNotice ? '<span style="color:#dc3545;">(Mendekati Tenggat!)</span>' : ''}</div>
            </div>
            
            <span class="badge ${isCompleted ? 'badge-success' : 'badge-warning'}">
              Status: ${task.status}
            </span>
          </div>
          <div class="task-actions">
            <button onclick="toggleTaskStatus('${task.id}')" class="btn btn-sm rounded-4 ${isCompleted ? 'btn-warning' : 'btn-success'}">
              ${isCompleted ? 'Batal Selesai' : 'Tandai Selesai'}
            </button>
            <button onclick="editTask('${task.id}')" class="btn btn-sm btn-info rounded-4">Edit</button>
            <button onclick="deleteTask('${task.id}')" class="btn btn-sm btn-danger rounded-4">Hapus</button>
          </div>
        </div>
      `;
    })
    .join('');
}

// Handler form submit (tambah / edit tugas)
formEl.addEventListener('submit', (e: SubmitEvent) => {
  e.preventDefault();

  const title: string = taskTitleInput.value.trim();
  const course: string = taskCourseInput.value.trim();
  const deadline: string = taskDeadlineInput.value;
  const priority: TaskPriority = taskPrioritySelect.value as TaskPriority;
  const isImportant: boolean = taskImportantInput.checked;

  if (editingTaskId) {
    // Mode Edit: perbarui data dalam Array
    tasks = tasks.map((t) =>
      t.id === editingTaskId
        ? { ...t, title, course, deadline, priority, isImportant }
        : t
    );
    resetForm();
  } else {
    // Mode Tambah: buat objek tugas baru
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      course,
      deadline,
      priority,
      status: 'Belum Selesai',
      isImportant,
      createdAt: Date.now(),
    };
    tasks.unshift(newTask); // Tambahkan ke paling awal array
  }

  formEl.reset();
  renderTasks();
});

// Fungsi Reset Form
function resetForm(): void {
  editingTaskId = null;
  taskIdInput.value = '';
  formHeadingEl.textContent = 'Tambah Tugas Baru';
  btnSubmit.textContent = 'Tambah Tugas';
  btnCancel.style.display = 'none';
  formEl.reset();
}

btnCancel.addEventListener('click', resetForm);

// Menjadikan handler aksesibel di Global Window (Untuk inline onclick HTML)
(window as any).toggleTaskStatus = (id: string): void => {
  tasks = tasks.map((t) =>
    t.id === id
      ? { ...t, status: t.status === 'Belum Selesai' ? 'Selesai' : 'Belum Selesai' }
      : t
  );
  renderTasks();
};

(window as any).deleteTask = (id: string): void => {
  if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
    tasks = tasks.filter((t) => t.id !== id);
    renderTasks();
  }
};

(window as any).editTask = (id: string): void => {
  const taskToEdit = tasks.find((t) => t.id === id);
  if (!taskToEdit) return;

  editingTaskId = id;
  taskTitleInput.value = taskToEdit.title;
  taskCourseInput.value = taskToEdit.course;
  taskDeadlineInput.value = taskToEdit.deadline;
  taskPrioritySelect.value = taskToEdit.priority;
  taskImportantInput.checked = taskToEdit.isImportant;

  formHeadingEl.textContent = 'Edit Tugas Kuliah';
  btnSubmit.textContent = 'Simpan Perubahan';
  btnCancel.style.display = 'inline-block';
};

// Render awal saat aplikasi dimuat
renderTasks();