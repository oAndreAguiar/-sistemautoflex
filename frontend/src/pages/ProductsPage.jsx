import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetMaterialUsageQuery,
  useDeleteMaterialUsageMutation,
} from "../app/apiSlice";

function toMoney(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function getApiMessage(err, fallback) {
  return err?.data?.message || fallback;
}

export default function ProductsPage() {
  const { data: products = [], isLoading, error } = useGetProductsQuery();
  const { data: usages = [] } = useGetMaterialUsageQuery();

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [deleteUsage] = useDeleteMaterialUsageMutation();

  const [form, setForm] = useState({ code: "", name: "", unitPrice: "" });
  const [query, setQuery] = useState("");

  // Inline messages (instead of alert/confirm)
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text: string }
  const [confirmDelete, setConfirmDelete] = useState(null); // product object

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.code, p.name].some((x) => String(x ?? "").toLowerCase().includes(q))
    );
  }, [products, query]);

  const codeNormalized = form.code.trim().toLowerCase();
  const nameNormalized = form.name.trim().toLowerCase();

  const codeTaken =
    codeNormalized.length > 0 &&
    products.some(
      (p) => String(p.code ?? "").trim().toLowerCase() === codeNormalized
    );

  const nameTaken =
    nameNormalized.length > 0 &&
    products.some(
      (p) => String(p.name ?? "").trim().toLowerCase() === nameNormalized
    );

  const disabledReason = codeTaken
    ? "This product code already exists."
    : nameTaken
    ? "This product name already exists."
    : "";

  async function onCreate(e) {
    e.preventDefault();
    setNotice(null);

    if (codeTaken || nameTaken) {
      setNotice({
        type: "error",
        text: disabledReason || "Duplicate product. Code or name already exists.",
      });
      return;
    }

    try {
      await createProduct({
        code: form.code.trim(),
        name: form.name.trim(),
        unitPrice: Number(form.unitPrice),
      }).unwrap();

      setForm({ code: "", name: "", unitPrice: "" });
      setNotice({ type: "success", text: "Product created successfully." });
    } catch (err) {
      if (err?.status === 409) {
        setNotice({
          type: "error",
          text: getApiMessage(
            err,
            "Duplicate product. Code or name already exists."
          ),
        });
        return;
      }

      console.error(err);
      setNotice({ type: "error", text: "Failed to create product." });
    }
  }

  async function onDeleteProductCascade(product) {
    setNotice(null);

    try {
      // 1) remove BOM links for this product
      const linkedUsages = (usages ?? []).filter(
        (u) => Number(u?.product?.id) === Number(product.id)
      );

      for (const u of linkedUsages) {
        await deleteUsage(u.id).unwrap();
      }

      // 2) delete product
      await deleteProduct(product.id).unwrap();

      setNotice({ type: "success", text: "Product deleted successfully." });
    } catch (err) {
      console.error("Delete cascade failed:", err);
      setNotice({ type: "error", text: "Delete failed. Please try again." });
    } finally {
      setConfirmDelete(null);
    }
  }

  if (isLoading) return <p>Loading products...</p>;
  if (error) return <p className="error">Failed to load products.</p>;

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Products</h2>
        <p className="small">
          CRUD + link to BOM (materials) inside product details.
        </p>

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
            <p className="small" style={{ marginTop: 6 }}>
              Delete product <strong>{confirmDelete.code}</strong>? This will
              also remove its BOM associations.
            </p>

            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="danger"
                onClick={() => onDeleteProductCascade(confirmDelete)}
              >
                Yes, delete
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
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
                <th>Name</th>
                <th>Unit price</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  onUpdate={updateProduct}
                  onDeleteCascade={onDeleteProductCascade}
                  onNotice={(n) => setNotice(n)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Create product</h3>

        <form onSubmit={onCreate} className="grid" style={{ marginTop: 10 }}>
          <input
            aria-label="Product code"
            placeholder="Code (e.g. PRD01)"
            value={form.code}
            onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            required
          />
          <input
            aria-label="Product name"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            required
          />
          <input
            aria-label="Unit price"
            placeholder="Unit price"
            type="number"
            step="0.01"
            value={form.unitPrice}
            onChange={(e) =>
              setForm((s) => ({ ...s, unitPrice: e.target.value }))
            }
            required
          />

          <button
            disabled={creating || codeTaken || nameTaken}
            title={disabledReason}
          >
            Create
          </button>

          {(codeTaken || nameTaken) && (
            <p className="error small" style={{ marginTop: 8 }}>
              {codeTaken && "Product code already exists. "}
              {nameTaken && "Product name already exists."}
            </p>
          )}
        </form>

        <div style={{ marginTop: 16 }}>
          <p className="small">
            Tip: click <span className="badge">Details</span> to manage BOM (raw
            materials) for the product.
          </p>
        </div>
      </section>
    </div>
  );
}

function ProductRow({ product, onUpdate, onDeleteCascade, onNotice }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    code: product.code ?? "",
    name: product.name ?? "",
    unitPrice: product.unitPrice ?? 0,
  });

  async function save() {
    onNotice?.(null);

    try {
      await onUpdate({
        id: product.id,
        ...draft,
        unitPrice: Number(draft.unitPrice),
      }).unwrap();

      setEditing(false);
      onNotice?.({ type: "success", text: "Product updated successfully." });
    } catch (err) {
      if (err?.status === 409) {
        onNotice?.({
          type: "error",
          text: getApiMessage(err, "Duplicate value. Please choose another."),
        });
        return;
      }

      console.error(err);
      onNotice?.({ type: "error", text: "Failed to update product." });
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
        product.code
      )}
    </td>

    <td data-label="Name">
      {editing ? (
        <input
          value={draft.name}
          onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
        />
      ) : (
        product.name
      )}
    </td>

    <td data-label="Unit price">
      {editing ? (
        <input
          type="number"
          step="0.01"
          value={draft.unitPrice}
          onChange={(e) => setDraft((s) => ({ ...s, unitPrice: e.target.value }))}
        />
      ) : (
        <>R$ {toMoney(product.unitPrice ?? 0)}</>
      )}
    </td>

    <td data-label="Actions">
      <div className="row" style={{ gap: 8 }}>
        <Link className="secondary" to={`/products/${product.id}`}>
          <button type="button" className="secondary">Details</button>
        </Link>

        {!editing ? (
          <button type="button" className="secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
        ) : (
          <>
            <button type="button" onClick={save}>Save</button>
            <button type="button" className="secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        )}

        <button type="button" className="danger" onClick={() => onDeleteCascade(product)}>
          Delete
        </button>



        
      </div>
    </td>
  </tr>
  );
}
