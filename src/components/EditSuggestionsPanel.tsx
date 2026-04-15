"use client";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Check, X, Loader2 } from "lucide-react";

interface EditSuggestion {
  id: string;
  proposedBy: {
    id: string;
    username: string;
    displayName?: string | null;
    avatar?: string | null;
  };
  proposerComment?: string;
  authorComment?: string;
  proposedContent: string; // JSON or plain text
  status: "pending" | "accepted" | "rejected" | "retracted";
  reviewedBy?: { id: string; username: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
}

interface EditSuggestionsPanelProps {
  workId: string;
  sectionId: string;
  currentContent: string; // JSON or plain text
}

export default function EditSuggestionsPanel({ workId, sectionId, currentContent }: EditSuggestionsPanelProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<EditSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EditSuggestion | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [authorComment, setAuthorComment] = useState("");
  const [modalType, setModalType] = useState<"accept" | "reject" | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line
  }, [workId, sectionId, page]);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/works/${workId}/sections/${sectionId}/suggestions?status=pending&page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to load suggestions");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }

  function openModal(suggestion: EditSuggestion, type: "accept" | "reject") {
    setSelected(suggestion);
    setModalType(type);
    setAuthorComment("");
  }

  async function handleAction(type: "accept" | "reject") {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/works/${workId}/sections/${sectionId}/suggestions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: type === "accept" ? "accepted" : "rejected", authorComment }),
      });
      if (!res.ok) throw new Error("Failed to update suggestion");
      // Optimistic update
      setSuggestions((prev) => prev.map((s) => (s.id === selected.id ? { ...s, status: type === "accept" ? "accepted" : "rejected", authorComment } : s)));
      toast.success(`Suggestion ${type === "accept" ? "accepted" : "rejected"}`);
      setModalType(null);
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update suggestion");
    } finally {
      setActionLoading(false);
    }
  }

  function closeModal() {
    setModalType(null);
    setSelected(null);
    setAuthorComment("");
  }

  // Simple diff: show current vs proposed (plain text for MVP)
  function renderDiff(current: string, proposed: string) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="bg-gray-900/60 border border-gray-700 rounded p-3">
          <div className="text-xs text-gray-400 mb-1">Current</div>
          <pre className="whitespace-pre-wrap text-sm text-gray-200">{current}</pre>
        </div>
        <div className="bg-green-900/30 border border-green-700 rounded p-3">
          <div className="text-xs text-green-400 mb-1">Proposed</div>
          <pre className="whitespace-pre-wrap text-sm text-green-200">{proposed}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Suggestions</h2>
        {loading && <Loader2 className="animate-spin text-blue-400" size={20} />}
      </div>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {suggestions.length === 0 && !loading ? (
        <div className="text-gray-400 py-8 text-center">No pending suggestions.</div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {suggestions.map((s) => (
            <li key={s.id} className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-base">
                    {s.proposedBy.displayName?.[0] || s.proposedBy.username[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.proposedBy.displayName || s.proposedBy.username}</div>
                    <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                {s.proposerComment && (
                  <div className="text-gray-300 text-sm mb-2">Comment: {s.proposerComment}</div>
                )}
                {renderDiff(currentContent, s.proposedContent)}
              </div>
              <div className="flex flex-col gap-2 md:items-end">
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  onClick={() => openModal(s, "accept")}
                  disabled={s.status !== "pending"}
                >
                  <Check size={16} /> Accept
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                  onClick={() => openModal(s, "reject")}
                  disabled={s.status !== "pending"}
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Accept/Reject Modal */}
      <Modal
        isOpen={!!modalType && !!selected}
        onClose={closeModal}
        title={modalType === "accept" ? "Accept Suggestion" : "Reject Suggestion"}
        size="sm"
      >
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {modalType === "accept" ? "Add a comment (optional):" : "Reason for rejection (optional):"}
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-900 text-gray-100"
            rows={3}
            value={authorComment}
            onChange={(e) => setAuthorComment(e.target.value)}
            placeholder={modalType === "accept" ? "e.g. Good catch, thanks!" : "e.g. Not quite right for this section..."}
            disabled={actionLoading}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200"
            disabled={actionLoading}
          >
            Cancel
          </button>
          <button
            onClick={() => handleAction(modalType!)}
            disabled={actionLoading}
            className={`px-4 py-2 text-sm rounded flex items-center gap-2 ${modalType === "accept" ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {actionLoading ? <Loader2 className="animate-spin" size={16} /> : modalType === "accept" ? <Check size={16} /> : <X size={16} />}
            {modalType === "accept" ? "Accept" : "Reject"}
          </button>
        </div>
      </Modal>

      {/* Pagination (MVP: simple prev/next) */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="text-gray-400">Page {page}</span>
        <button
          className="px-3 py-1 rounded bg-gray-700 text-gray-300 disabled:opacity-50"
          onClick={() => setPage((p) => p + 1)}
          disabled={suggestions.length < pageSize}
        >
          Next
        </button>
      </div>
    </div>
  );
}