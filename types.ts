
export enum LeadStatus {
  NEW = 'Nouveau',
  TO_RECALL = 'À rappeler',
  IN_PROGRESS = 'En cours',
  APPOINTMENT = 'RDV Fixé',
  UNREACHABLE = 'Injoignable',
  NOT_INTERESTED = 'Pas intéressé',
  WRONG_NUMBER = 'Faux numéro',
}

export interface Lead {
  id: string;
  rowIndex?: number;
  dateEntry?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email: string;
  address?: string;
  postalCode: string;
  city?: string;
  roofArea?: number;
  monthlyBill?: number;
  dateContact?: string;
  sms?: string;
  mail?: string;
  dateAppointment?: string;
  status: string;
  infoLoss?: string;
  salesperson?: string;
  notes: string[];
  salesStatus?: string;
  amount?: string | number;
  source: string;
  canal?: string;
  campagne?: string;
  creative?: string;
  nextFollowUpDate?: string;
  lastContactDate?: string;
}

export interface ClientDiscovery {
  Date: string;
  Commercial: string;
  temps_habitation: string;
  metier: string;
  tranche_age: string;
  avancement_projet: string;
  concerne_quoi: string;
  consommation_actuelle: string;
  fournisseur_actuel: string;
  deja_change_fournisseur: string;
  motivations_priorite: string;
  attentes_partenaire: string;
  attentes_rdv: string;
  pourquoi_pas_plus_tot: string;
  freins_specifiques: string;
  point_plus_important: string;
  deja_etudes_pv: string;
  etudes_pv_qui: string;
  etudes_pv_pourquoi_pas_signe: string;
  connaissance_budgets: string;
  budget_prevu: string;
  montant_budget_prevu: string;
  financement_envisage: string;
  echeance_installation: string;
  comment_connu: string;
}

export interface SocialQuestionnaire {
  Date: string;
  social_usage: string;
  is_subscribed: string;
  content_freq: string;
  clarity: string;
  reassurance: string;
  comm_tone: string;
  rs_role: string;
  improvement: string;
}

export interface CompanyExpense {
  rowIndex: number;
  name: string;
  description: string;
  provider: string;
  expenseType: string;
  date: string;
  endDate: string;
  amount: number;
}

export interface DashboardStats {
  totalLeads: number;
  appointmentsCount: number;
  toRecallCount: number;
  conversionRate: number;
}
