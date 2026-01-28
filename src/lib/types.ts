export interface LeadDTO {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  origen?: string;
  estado: string;
  asignado_a?: string | null;
}
