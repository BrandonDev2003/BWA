export type Lead = {
  id?: number;
  nombre?: string;
  telefono?: string;
  correo?: string;
  empresa?: string;
  estado?: "Nuevo" | "Contactado" | "En Proceso" | "Cerrado";
  [key: string]: any;
};
