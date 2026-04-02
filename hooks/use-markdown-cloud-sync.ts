import type { MarkdownFile } from "@/hooks/use-markdown-files";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { AppState } from "react-native";
import { useCallback, useEffect, useRef } from "react";

type UniversalHook = {
  files: MarkdownFile[];
  mergeRemoteFiles: (remote: MarkdownFile[]) => Promise<void>;
  deleteFile: (id: string) => Promise<void> | void;
  loading: boolean;
};

/**
 * Pro かつログイン時: サーバーから一覧をマージし、ローカル変更をデバウンス送信する。
 */
export function useMarkdownCloudSync(hook: UniversalHook) {
  const { isAuthenticated } = useAuth();
  const billing = trpc.billing.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const canSync = Boolean(billing.data?.isPro);
  const listQuery = trpc.documents.list.useQuery(undefined, {
    enabled: isAuthenticated && canSync,
  });
  const upsertMut = trpc.documents.upsert.useMutation();
  const deleteMut = trpc.documents.delete.useMutation();

  const lastPushRef = useRef<Record<string, number>>({});
  const filesRef = useRef(hook.files);
  filesRef.current = hook.files;

  const mergeRemoteFiles = hook.mergeRemoteFiles;

  useEffect(() => {
    if (!listQuery.data || !canSync) return;
    const remote: MarkdownFile[] = listQuery.data.map((r) => ({
      id: r.id,
      name: r.name,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
    void mergeRemoteFiles(remote);
  }, [listQuery.dataUpdatedAt, canSync, mergeRemoteFiles, listQuery.data]);

  const pushDirty = useCallback(async () => {
    if (!canSync || !isAuthenticated) return;
    const current = filesRef.current;
    for (const f of current) {
      const last = lastPushRef.current[f.id] ?? 0;
      if (f.updatedAt <= last) continue;
      try {
        await upsertMut.mutateAsync({
          id: f.id,
          name: f.name,
          content: f.content,
          clientUpdatedMs: f.updatedAt,
          clientCreatedMs: f.createdAt,
        });
        lastPushRef.current[f.id] = f.updatedAt;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("10003") || msg.toLowerCase().includes("pro")) {
          return;
        }
        console.warn("[cloud-sync] upsert failed", e);
      }
    }
  }, [canSync, isAuthenticated, upsertMut]);

  useEffect(() => {
    if (!canSync || hook.loading) return;
    const t = setTimeout(() => {
      void pushDirty();
    }, 1500);
    return () => clearTimeout(t);
  }, [hook.files, hook.loading, canSync, pushDirty]);

  useEffect(() => {
    if (!canSync) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void listQuery.refetch();
    });
    return () => sub.remove();
  }, [canSync, listQuery]);

  const pushDeletesToServer = useCallback(
    async (deletedId: string) => {
      if (!canSync || !isAuthenticated) return;
      try {
        await deleteMut.mutateAsync({ id: deletedId });
        delete lastPushRef.current[deletedId];
      } catch (e) {
        console.warn("[cloud-sync] delete failed", e);
      }
    },
    [canSync, isAuthenticated, deleteMut],
  );

  return {
    canSync,
    billingLoading: billing.isLoading,
    billingStatus: billing.data,
    refetchRemote: listQuery.refetch,
    pushDeletesToServer,
  };
}
