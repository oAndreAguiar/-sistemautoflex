import { useMemo, useState } from "react";
import { useProduceMutation, useProductionPriorityQuery, useProductionCheckQuery } from "../app/apiSlice";

function money(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

export default function ProductionPage() {
  const { data: priority = [], isLoading: lp, error: ep } = useProductionPriorityQuery();
  const { data: check = [], isLoading: lc, error: ec } = useProductionCheckQuery();
  const [produce, { isLoading: producing }] = useProduceMutation();

  const [qty, setQty] = useState({}); // { [productId]: quantity }
  const [message, setMessage] = useState({ type: "", text: "" });

  const totalPotentialValue = useMemo(() => {
    return priority.reduce((sum, p) => sum + Number(p.unitPrice ?? 0) * Number(p.maxQuantity ?? 0), 0);
  }, [priority]);

  async function onProduce(productId, maxQuantity) {
    const q = Number(qty[productId] ?? maxQuantity);
    setMessage({ type: "", text: "" });
    try {
      const res = await produce({ productId, quantity: q }).unwrap();
      setMessage({ type: "success", text: `SUCCESS: produced ${res.quantityProduced} of ${res.product}` });
    } catch (e) {
      const status = e?.status;
      const data = e?.data;
      if (status === 400 && data?.error === "INSUFFICIENT_STOCK") {
        setMessage({
          type: "error",
          text: `INSUFFICIENT_STOCK for "${data.productName}". Raw material: ${data.rawMaterial} (available: ${data.available}, required: ${data.required}, missing: ${data.missing})`,
        });
      } else {
        setMessage({ type: "error", text: `Failed to produce. ${status ?? ""}` });
      }
    }
  }

  return (
    <div className="grid cols-2">
      <section className="card">
        <h2>Production priority</h2>
        <p className="small">
          Sorted by higher unitPrice first. Total potential value (suggested): <b>R$ {money(totalPotentialValue)}</b>
        </p>

        {lp ? (
          <p>Loading...</p>
        ) : ep ? (
          <p className="error">Failed to load production priority.</p>
        ) : priority.length === 0 ? (
          <p className="small">No producible products (needs BOM + stock).</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit price</th>
                  <th>Max qty</th>
                  <th>Suggested value</th>
                  <th style={{ width: 280 }}>Produce</th>
                </tr>
              </thead>
              <tbody>
                {priority.map((p) => (
                  <tr key={p.productId}>
                   <td>{p.name}</td>
                    <td>R$ {money(p.unitPrice)}</td>
                    <td>{p.maxQuantity}</td>
                    <td>R$ {money(Number(p.unitPrice) * Number(p.maxQuantity))}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          max={p.maxQuantity}
                          value={qty[p.productId] ?? p.maxQuantity}
                          onChange={(e) => setQty((s) => ({ ...s, [p.productId]: e.target.value }))}
                        />
                        <button
                          disabled={producing}
                          onClick={() => onProduce(p.productId, p.maxQuantity)}
                        >
                          Produce
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {message.text && (
          <p className={message.type === "error" ? "error" : "success"} style={{ marginTop: 12 }}>
            {message.text}
          </p>
        )}
      </section>

      <section className="card">
        <h3>Production check</h3>
        <p className="small">How many units can be produced per product (based on stock and BOM).</p>

        {lc ? (
          <p>Loading...</p>
        ) : ec ? (
          <p className="error">Failed to load production check.</p>
        ) : check.length === 0 ? (
          <p className="small">No data.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Max can produce</th>
                </tr>
              </thead>
              <tbody>
                {check.map((r) => (
                  <tr key={r.productId}>
                    <td>{r.productName}</td>
                    <td>{r.maxCanProduce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
