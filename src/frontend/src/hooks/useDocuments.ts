import { createActor } from "@/backend";
import type {
  DocumentDetail,
  DocumentFilter,
  DocumentId,
  DocumentView,
  FileType,
} from "@/backend";
import { useBackendActor } from "@/lib/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Query key root for every document query so mutations can invalidate once. */
export const documentsKey = ["documents"] as const;

/**
 * List the caller's documents, optionally filtered by name and file type.
 * The backend already scopes results to the signed-in principal.
 */
export function useDocuments(filter: DocumentFilter, enabled = true) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: [
      ...documentsKey,
      filter.nameContains ?? "",
      filter.fileType ?? "all",
    ],
    queryFn: async () => {
      if (!actor) return [] as DocumentView[];
      return actor.listDocuments(filter);
    },
    enabled: enabled && !!actor && !isFetching,
  });
}

/** Fetch a single document with its extracted text preview. */
export function useDocument(id: DocumentId | null) {
  const { actor, isFetching } = useBackendActor();
  return useQuery({
    queryKey: [...documentsKey, "detail", id?.toString() ?? "none"],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getDocument(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

/** Register an uploaded document and return its new id. */
export function useCreateDocument() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      fileType: FileType;
      sizeBytes: bigint;
      storageRef: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createDocument(
        input.name,
        input.fileType,
        input.sizeBytes,
        input.storageRef,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

/** Rename one of the caller's documents. */
export function useRenameDocument() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: DocumentId; newName: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.renameDocument(input.id, input.newName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

/** Delete one of the caller's documents. */
export function useDeleteDocument() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: DocumentId) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteDocument(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

/** Store extracted text for a document and mark it ready. */
export function useSetExtractedText() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: DocumentId; text: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setExtractedText(input.id, input.text);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

/** Mark a document's extraction as failed with a human-readable reason. */
export function useSetProcessingFailed() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: DocumentId; reason: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProcessingFailed(input.id, input.reason);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey });
    },
  });
}

export type {
  DocumentDetail,
  DocumentFilter,
  DocumentId,
  DocumentView,
  FileType,
};
