import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  useGetProductsQuery,
  useGetRawMaterialsQuery,
  useGetMaterialUsageQuery,
  useCreateMaterialUsageMutation,
  useUpdateMaterialUsageMutation,
  useDeleteMaterialUsageMutation,
} from "../app/apiSlice";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Number(id);

  const { data: products = [], isLoading: lp } = useGetProductsQuery();
  const { data: materials = [], isLoading: lm } = useGetRawMaterialsQuery();
  const { data: usages = [], isLoading: lu, error } = useGetMaterialUsageQuery();

  const [createUsage, { isLoading: creating }] = useCreateMaterialUsageMutation();
  const [updateUsage] = useUpdateMaterialUsageMutation();
  const [deleteUsage] = useDeleteMaterialUsageMutation();

  const product = useMemo(
    () => products.find((p) => Number(p.id) === productId),
    [products, productId]
  );

  const productUsages = useMemo(() => {
    return usages
      .filter((u) => Number(u?.product?.id) === productId)
      .sort((a, b) => String(a?.rawMaterial?.code ?? "").localeCompare(String(b?.rawMaterial?.code ?? "")));
  }, [usages, productId]);

  const [form, setForm] = useState({ rawMaterialId: "", consumptionPerUnit: "" });

  const alreadyLinked = useMemo(() => {
    const set = new Set(productUsages.map((u) => Number(u?.rawMaterial?.id)));
    return set;
  }, [productUsages]);

  const availableMaterials = useMemo(() => {
    return materials.filter((m) => !alreadyLinked.has(Number(m.id)));
  }, [materials, alreadyLinked]);

  async function onAdd(e) {
    e.preventDefault();
    await createUsage({
      productId,
      rawMaterialId: Number(form.rawMaterialId),
      consumptionPerUnit: Number(form.consumptionPerUnit),
    }).unwrap();
    setForm({ rawMaterialId: "", consumptionPerUnit: "" });
  }

  if (lp || lm || lu) return <p>Loading...</p>;
  if (error) return <p className="error">Failed to load BOM.</p>;
  if (!product) return <p className="error">Product not found.</p>;

  return (
    <div className="grid cols-2">
      <section className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 auto" }}>
            <h2>
              {product.code} — {product.name}
            </h2>
            <p className="small">BOM (material usage) for this product.</p>
          </div>
          <div style={{ flex: "0 0 auto" }}>
            <Link to="/products">
              <button type="button" className="secondary">Back</button>
            </Link>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Raw material</th>
                <th>Consumption / unit</th>
                <th>Available stock</th>
                <th style={{ width: 210 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productUsages.length === 0 ? (
                <tr>
                  <td colSpan="4" className="small">No raw materials linked yet.</td>
                </tr>
              ) : (
                productUsages.map((u) => (
                  <UsageRow
                    key={u.id}
                    usage={u}
                    onUpdate={updateUsage}
                    onDelete={deleteUsage}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>Add raw material to product</h3>
        <form onSubmit={onAdd} className="grid" style={{ marginTop: 10 }}>
          <select
            value={form.rawMaterialId}
            onChange={(e) => setForm((s) => ({ ...s, rawMaterialId: e.target.value }))}
            required
          >
            <option value="">Select raw material</option>
            {availableMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} — {m.description}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="1"
            placeholder="Consumption per unit (e.g. 2)"
            value={form.consumptionPerUnit}
            onChange={(e) => setForm((s) => ({ ...s, consumptionPerUnit: e.target.value }))}
            required
          />

          <button disabled={creating || availableMaterials.length === 0}>
            {availableMaterials.length === 0 ? "No materials available" : "Add to BOM"}
          </button>
        </form>

        <p className="small" style={{ marginTop: 12 }}>
          Note: backend uses <b>description</b> for raw material name and <b>availableStock</b> for quantity in stock.
        </p>
      </section>
    </div>
  );
}

function UsageRow({ usage, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ consumptionPerUnit: usage.consumptionPerUnit ?? 1 });

  const rm = usage.rawMaterial;

  async function save() {
    await onUpdate({ id: usage.id, consumptionPerUnit: Number(draft.consumptionPerUnit) }).unwrap();
    setEditing(false);
  }

  return (
    <tr>
      <td>
        {rm?.code} — {rm?.description}
      </td>
      <td>
        {editing ? (
          <input
            type="number"
            step="1"
            value={draft.consumptionPerUnit}
            onChange={(e) => setDraft({ consumptionPerUnit: e.target.value })}
          />
        ) : (
          usage.consumptionPerUnit
        )}
      </td>
      <td>{rm?.availableStock}</td>
      <td>
        <div className="row" style={{ gap: 8 }}>
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

          <button
            type="button"
            className="danger"
            onClick={() => {
              if (confirm("Remove this raw material from BOM?")) onDelete(usage.id);
            }}
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}
