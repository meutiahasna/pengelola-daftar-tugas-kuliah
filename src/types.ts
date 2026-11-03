// Tipe Data dan Interface Aplikasi

// Union Type dan Type Alias untuk Status dan Prioritas
export type TaskStatus = 'Belum Selesai' | 'Selesai';
export type TaskPriority = 'Rendah' | 'Sedang' | 'Tinggi';

// Interface struktur data Tugas Kuliah
export interface Task {
  id: string;             // Primitive type: string
  title: string;          // Primitive type: string (Nama Tugas)
  course: string;         // Primitive type: string (Mata Kuliah)
  deadline: string;       // Primitive type: string (Tanggal Tenggat)
  priority: TaskPriority; // Union type
  status: TaskStatus;     // Union type
  isImportant: boolean;   // Primitive type: boolean
  createdAt: number;      // Primitive type: number (Timestamp)
}

// Array Type (Daftar Banyak Tugas)
export type TaskList = Task[];