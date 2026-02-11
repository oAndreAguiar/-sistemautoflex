package org.acme.inventory.api;

import java.util.List;
import java.util.Map;

import org.acme.inventory.domain.MaterialUsage;
import org.acme.inventory.domain.Product;
import org.acme.inventory.domain.RawMaterial;

import jakarta.transaction.Transactional;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/production")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductionResource {

    // =========================
    // PRODUZIR PRODUTO
    // =========================
    @POST
    @Path("/{productId}/produce/{quantity}")
    @Transactional
    public Response produce(
            @PathParam("productId") Long productId,
            @PathParam("quantity") Integer quantity) {

        Product product = Product.findById(productId);

        if (product == null) {
            throw new NotFoundException("Product not found: " + productId);
        }

        if (quantity <= 0) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Quantity must be greater than zero"))
                    .build();
        }

        // lista de materiais usados pelo produto
        List<MaterialUsage> usages = MaterialUsage.list("product.id", productId);

        if (usages.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "This product has no BOM (no material usage defined)"))
                    .build();
        }

        // valida se há estoque suficiente
        for (MaterialUsage usage : usages) {

            RawMaterial rm = usage.rawMaterial;
            int required = usage.consumptionPerUnit * quantity;

            if (rm.availableStock < required) {

                int missing = required - rm.availableStock;

                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                                "error", "INSUFFICIENT_STOCK",
                                "productId", product.id,
                                "productName", product.name,
                                "rawMaterialId", rm.id,
                                "rawMaterial", rm.description,
                                "available", rm.availableStock,
                                "required", required,
                                "missing", missing
                        ))
                        .build();
            }
        }

        // se passou da validação → dar baixa
        for (MaterialUsage usage : usages) {
            RawMaterial rm = usage.rawMaterial;

            int required = usage.consumptionPerUnit * quantity;

            rm.availableStock -= required;

            if (rm.availableStock < 0) {
                rm.availableStock = 0;  // <<< nunca deixa negativo
            }

            rm.persist();
        }

        return Response.ok(
                Map.of(
                        "status", "SUCCESS",
                        "product", product.name,
                        "quantityProduced", quantity
                )
        ).build();
    }
}
