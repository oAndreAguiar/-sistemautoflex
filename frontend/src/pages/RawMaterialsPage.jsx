import { useMemo, useState } from "react";
import {
  useGetRawMaterialsQuery,
  useCreateRawMaterialMutation,
  useUpdateRawMaterialMutation,
  useDeleteRawMaterialMutation,
  useGetMaterialUsageQuery,
} from "../app/apiSlice";

function getApiMessage(err, fallback) {
  return err?.data?.message || fallback;
}

export default function RawMaterialsPage() {
  const { data: materials = [], isLoading, error } = useGetRawMaterialsQuery();
  const { data: usages = [] } = useGetMaterialUsageQuery();

  const [createRM, { isLoading: creating }] = useCreateRawMaterialMutation();
  const [updateRM] = useUpdateRawMaterialMutation();
  const [deleteRM] = useDeleteRawMaterialMutation();

  const [form, setForm] = useState({
    code: "",
    description: "",
    availableStock: "",
  });
  const [query, setQuery] = useState("");

  const [notice, setNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) =>
      [m.code, m.description].some((x) =>
        String(x ?? "").toLowerCase().includes(q)
      )
    );
  }, [materials, query]);

  const codeNormalized = form.code.trim().toLowerCase();
  const descNormalized = form.description.trim().toLowerCase();

  const codeTaken =
    codeNormalized.length > 0 &&
    materials.some(
      (m) => String(m.code ?? "").trim().toLowerCase() === codeNormalized
    );

  const descTaken =
    descNormalized.length > 0 &&
    materials.some(
      (m) =>
        String(m.description ?? "").trim().toLowerCase() === descNormalized
    );

  const disabledReason = codeTaken
    ? "This raw material code already exists."
    : descTaken
    ? "This raw material description already exists."
    : "";

  function linkedCountFor(material) {
    return (
      (usages ?? []).filter(
        (u) => Number(u?.rawMaterial?.id) === Number(material?.id)
      ).length ?? 0
    );
  }

  async function onCreate(e) {
    e.preventDefault();
    setNotice(null);

    if (codeTaken || descTaken) {
      setNotice({
        type: "error",
        text:
          disabledReason ||
          "Duplicate raw material. Code or description already exists.",
      });
      return;
    }

    try {
      await createRM({
        code: form.code.trim(),
        description: form.description.trim(),
        availableStock: Number(form.availableStock),
      }).unwrap();

      setForm({ code: "", description: "", availableStock: "" });
      setNotice({ type: "success", text: "Raw material created successfully." });
    } catch (err) {
      if (err?.status === 409) {
        setNotice({
          type: "error",
          text: getApiMessage(
            err,
            "Duplicate raw material. Code or description already exists."
          ),
        });
        return;
      }
      console.error(err);
      setNotice({ type: "error", text: "Failed to create raw material." });
    }
  }

  async function onDeleteMaterial(material) {
    setNotice(null);

    const linkedCount = linkedCountFor(material);
    if (linkedCount > 0) {
      setNotice({
        type: "error",
        text: `This raw material is linked to ${linkedCount} product(s). Remove it from BOM first.`,
      });
      setConfirmDelete(null);
      return;
    }

    try {
      await deleteRM(material.id).unwrap();
      setNotice({ type: "success", text: "Raw material deleted successfully." });
    } catch (err) {
      console.error("Delete raw material failed:", err);
      setNotice({ type: "error", text: "Delete failed. Please try again." });
    } finally {
      setConfirmDelete(null);
    }
  }

  if (isLoading) return <p>Loading raw materials...</p>;
  if (error) return <p className="error">Failed to load raw materials.</p>;

  const confirmLinkedCount = confirmDelete ? linkedCountFor(confirmDelete) : 0;
  const confirmBlocked = confirmDelete && confirmLinkedCount > 0;

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Raw materials</h2>

        {notice && (
          <div
            className={notice.type === "error" ? "error" : "success"}
            style={{ marginTop: 10 }}
          >
            {notice.text}
          </div>
        )}

        {confirmDelete && (
          <div
            className="card"
            style={{ marginTop: 12, border: "1px solid #ddd" }}
          >
            <p style={{ margin: 0 }}>
              <strong>Confirm delete</strong>
            </p>

            {confirmBlocked ? (
              <p className="small" style={{ marginTop: 6 }}>
                Cannot delete <strong>{confirmDelete.code}</strong>. It is linked
                to <strong>{confirmLinkedCount}</strong> product(s). Remove it
                from BOM first.
              </p>
            ) : (
              <p className="small" style={{ marginTop: 6 }}>
                Delete raw material <strong>{confirmDelete.code}</strong>?
              </p>
            )}

            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="danger"
                disabled={confirmBlocked}
                onClick={() => onDeleteMaterial(confirmDelete)}
                title={
                  confirmBlocked
                    ? "This item is linked to products in BOM."
                    : ""
                }
              >
                Yes, delete
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="row" style={{ marginTop: 12 }}>
          <input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Available stock</th>
                <th style={{ width: 210 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <RawMaterialRow
                  key={m.id}
                  material={m}
                  usages={usages}
                  onUpdate={updateRM}
                  onDeleteCascade={(mat) => setConfirmDelete(mat)}
                  onNotice={(n) => setNotice(n)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Create raw material</h3>

        <form onSubmit={onCreate} className="grid" style={{ marginTop: 10 }}>
          <input
            aria-label="Raw material code"
            placeholder="Code (e.g. RM01)"
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            required
          />
          <input
            aria-label="Raw material description"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((s) => ({ ...s, description: e.target.value }))
            }
            required
          />
          <input
            aria-label="Available stock"
            placeholder="Available stock"
            type="number"
            step="1"
            value={form.availableStock}
            onChange={(e) =>
              setForm((s) => ({ ...s, availableStock: e.target.value }))
            }
            required
          />

          <button
            disabled={creating || codeTaken || descTaken}
            title={disabledReason}
          >
            Create
          </button>

          {(codeTaken || descTaken) && (
            <p className="error small" style={{ marginTop: 8 }}>
              {codeTaken && "Raw material code already exists. "}
              {descTaken && "Raw material description already exists."}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}

function RawMaterialRow({ material, usages, onUpdate, onDeleteCascade, onNotice }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    code: material.code ?? "",
    description: material.description ?? "",
    availableStock: material.availableStock ?? 0,
  });

  const linkedCount =
    (usages ?? []).filter(
      (u) => Number(u?.rawMaterial?.id) === Number(material.id)
    ).length ?? 0;

  const isLinked = linkedCount > 0;

  async function save() {
    onNotice?.(null);

    try {
      await onUpdate({
        id: material.id,
        ...draft,
        availableStock: Number(draft.availableStock),
      }).unwrap();

      setEditing(false);
      onNotice?.({ type: "success", text: "Raw material updated successfully." });
    } catch (err) {
      if (err?.status === 409) {
        onNotice?.({
          type: "error",
          text: getApiMessage(err, "Duplicate value. Please choose another."),
        });
        return;
      }
      console.error(err);
      onNotice?.({ type: "error", text: "Failed to update raw material." });
    }
  }

  return (
    <tr>
      <td data-label="Code">
        {editing ? (
          <input
            value={draft.code}
            onChange={(e) => setDraft((s) => ({ ...s, code: e.target.value }))}
          />
        ) : (
          material.code
        )}
      </td>

      <td data-label="Description">
        {editing ? (
          <input
            value={draft.description}
            onChange={(e) =>
              setDraft((s) => ({ ...s, description: e.target.value }))
            }
          />
        ) : (
          material.description
        )}
      </td>

      <td data-label="Available stock">
        {editing ? (
          <input
            type="number"
            step="1"
            value={draft.availableStock}
            onChange={(e) =>
              setDraft((s) => ({ ...s, availableStock: e.target.value }))
            }
          />
        ) : (
          material.availableStock
        )}
      </td>

      <td data-label="Actions">
        <div className="row" style={{ gap: 8 }}>
          {!editing ? (
            <button
              type="button"
              className="secondary"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <>
              <button type="button" onClick={save}>
                Save
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          )}

          <button
            type="button"
            className="danger"
            onClick={() => onDeleteCascade(material)}
          >
            Delete
          </button>

          {isLinked && (
            <div className="small error">Linked in BOM: {linkedCount}</div>
          )}
        </div>
      </td>
    </tr>
  );
}
