import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { BodyType } from "./custom-fetch";

type Awaited<O> = O extends PromiseLike<infer T> ? T : O;

// ─── FAQ Types ───────────────────────────────────────────────────────────────
export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}
export interface CreateFaqBody {
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ─── Invoice Types ────────────────────────────────────────────────────────────
export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientId?: number | null;
  clientName: string;
  clientEmail: string;
  projectName: string;
  amount: string;
  tax: string;
  total: string;
  status: string;
  currency: string;
  dueDate?: string | null;
  issueDate: string;
  notes?: string | null;
  items: string;
  createdAt: string;
}
export interface CreateInvoiceBody {
  invoiceNumber: string;
  clientId?: number;
  clientName: string;
  clientEmail: string;
  projectName: string;
  amount: string;
  tax?: string;
  total: string;
  status?: string;
  currency?: string;
  dueDate?: string;
  issueDate: string;
  notes?: string;
  items?: string;
}

// ─── Job Types ────────────────────────────────────────────────────────────────
export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  salary?: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  deadline?: string | null;
  createdAt: string;
}
export interface CreateJobBody {
  title: string;
  department: string;
  location?: string;
  type?: string;
  experience: string;
  salary?: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  isActive?: boolean;
  deadline?: string;
}

// ─── Newsletter Types ─────────────────────────────────────────────────────────
export interface NewsletterSubscriber {
  id: number;
  email: string;
  name?: string | null;
  isActive: boolean;
  source: string;
  createdAt: string;
}
export interface SubscribeNewsletterBody {
  email: string;
  name?: string;
  source?: string;
}

// ─── FAQ Hooks ────────────────────────────────────────────────────────────────
export const getListFaqsUrl = () => `/api/faqs`;

export function useListFaqs<TData = Faq[]>(
  options?: UseQueryOptions<Faq[], unknown, TData, QueryKey>
): UseQueryResult<TData> {
  const queryKey = ["faqs"];
  const queryFn: QueryFunction<Faq[]> = () =>
    customFetch<Faq[]>(getListFaqsUrl(), { method: "GET" });
  return useQuery({ queryKey, queryFn, ...options } as UseQueryOptions<Faq[], unknown, TData, QueryKey>);
}
useListFaqs.queryKey = ["faqs"];

export const useCreateFaq = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Faq, TError, { data: BodyType<CreateFaqBody> }, TContext>
) =>
  useMutation<Faq, TError, { data: BodyType<CreateFaqBody> }, TContext>({
    mutationFn: ({ data }) => customFetch<Faq>("/api/faqs", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });

export const useUpdateFaq = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Faq, TError, { id: number; data: BodyType<Partial<CreateFaqBody>> }, TContext>
) =>
  useMutation<Faq, TError, { id: number; data: BodyType<Partial<CreateFaqBody>> }, TContext>({
    mutationFn: ({ id, data }) => customFetch<Faq>(`/api/faqs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...options,
  });

export const useDeleteFaq = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<{ success: boolean }, TError, { id: number }, TContext>
) =>
  useMutation<{ success: boolean }, TError, { id: number }, TContext>({
    mutationFn: ({ id }) => customFetch<{ success: boolean }>(`/api/faqs/${id}`, { method: "DELETE" }),
    ...options,
  });

// ─── Invoice Hooks ────────────────────────────────────────────────────────────
export const getListInvoicesUrl = () => `/api/invoices`;

export function useListInvoices<TData = Invoice[]>(
  options?: UseQueryOptions<Invoice[], unknown, TData, QueryKey>
): UseQueryResult<TData> {
  const queryKey = ["invoices"];
  const queryFn: QueryFunction<Invoice[]> = () =>
    customFetch<Invoice[]>(getListInvoicesUrl(), { method: "GET" });
  return useQuery({ queryKey, queryFn, ...options } as UseQueryOptions<Invoice[], unknown, TData, QueryKey>);
}
useListInvoices.queryKey = ["invoices"];

export const useCreateInvoice = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Invoice, TError, { data: BodyType<CreateInvoiceBody> }, TContext>
) =>
  useMutation<Invoice, TError, { data: BodyType<CreateInvoiceBody> }, TContext>({
    mutationFn: ({ data }) => customFetch<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });

export const useUpdateInvoice = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Invoice, TError, { id: number; data: BodyType<Partial<CreateInvoiceBody>> }, TContext>
) =>
  useMutation<Invoice, TError, { id: number; data: BodyType<Partial<CreateInvoiceBody>> }, TContext>({
    mutationFn: ({ id, data }) => customFetch<Invoice>(`/api/invoices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...options,
  });

export const useDeleteInvoice = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<{ success: boolean }, TError, { id: number }, TContext>
) =>
  useMutation<{ success: boolean }, TError, { id: number }, TContext>({
    mutationFn: ({ id }) => customFetch<{ success: boolean }>(`/api/invoices/${id}`, { method: "DELETE" }),
    ...options,
  });

// ─── Job Hooks ────────────────────────────────────────────────────────────────
export const getListJobsUrl = () => `/api/jobs`;

export function useListJobs<TData = Job[]>(
  options?: UseQueryOptions<Job[], unknown, TData, QueryKey>
): UseQueryResult<TData> {
  const queryKey = ["jobs"];
  const queryFn: QueryFunction<Job[]> = () =>
    customFetch<Job[]>(getListJobsUrl(), { method: "GET" });
  return useQuery({ queryKey, queryFn, ...options } as UseQueryOptions<Job[], unknown, TData, QueryKey>);
}
useListJobs.queryKey = ["jobs"];

export const useCreateJob = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Job, TError, { data: BodyType<CreateJobBody> }, TContext>
) =>
  useMutation<Job, TError, { data: BodyType<CreateJobBody> }, TContext>({
    mutationFn: ({ data }) => customFetch<Job>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });

export const useUpdateJob = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<Job, TError, { id: number; data: BodyType<Partial<CreateJobBody>> }, TContext>
) =>
  useMutation<Job, TError, { id: number; data: BodyType<Partial<CreateJobBody>> }, TContext>({
    mutationFn: ({ id, data }) => customFetch<Job>(`/api/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    ...options,
  });

export const useDeleteJob = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<{ success: boolean }, TError, { id: number }, TContext>
) =>
  useMutation<{ success: boolean }, TError, { id: number }, TContext>({
    mutationFn: ({ id }) => customFetch<{ success: boolean }>(`/api/jobs/${id}`, { method: "DELETE" }),
    ...options,
  });

// ─── Newsletter Hooks ─────────────────────────────────────────────────────────
export const getListNewsletterUrl = () => `/api/newsletter`;

export function useListNewsletter<TData = NewsletterSubscriber[]>(
  options?: UseQueryOptions<NewsletterSubscriber[], unknown, TData, QueryKey>
): UseQueryResult<TData> {
  const queryKey = ["newsletter"];
  const queryFn: QueryFunction<NewsletterSubscriber[]> = () =>
    customFetch<NewsletterSubscriber[]>(getListNewsletterUrl(), { method: "GET" });
  return useQuery({ queryKey, queryFn, ...options } as UseQueryOptions<NewsletterSubscriber[], unknown, TData, QueryKey>);
}
useListNewsletter.queryKey = ["newsletter"];

export const useSubscribeNewsletter = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<NewsletterSubscriber, TError, { data: BodyType<SubscribeNewsletterBody> }, TContext>
) =>
  useMutation<NewsletterSubscriber, TError, { data: BodyType<SubscribeNewsletterBody> }, TContext>({
    mutationFn: ({ data }) =>
      customFetch<NewsletterSubscriber>("/api/newsletter/subscribe", { method: "POST", body: JSON.stringify(data) }),
    ...options,
  });

export const useDeleteNewsletterSubscriber = <TError = unknown, TContext = unknown>(
  options?: UseMutationOptions<{ success: boolean }, TError, { id: number }, TContext>
) =>
  useMutation<{ success: boolean }, TError, { id: number }, TContext>({
    mutationFn: ({ id }) =>
      customFetch<{ success: boolean }>(`/api/newsletter/${id}`, { method: "DELETE" }),
    ...options,
  });
