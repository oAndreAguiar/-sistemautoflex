package org.acme.inventory.api;

import java.util.*;
import java.util.stream.Collectors;

import org.acme.inventory.domain.MaterialUsage;
import org.acme.inventory.domain.Product;
import org.acme.inventory.domain.RawMaterial;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/production-priority")
@Produces(MediaType.APPLICATION_JSON)
public class ProductionPriorityResource {

    @GET
    public List<Map<String, Object>> listProductionPossibilities() {

        List<Product> products = Product.listAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Product p : products) {

            // usos de matéria-prima desse produto
            List<MaterialUsage> usages = MaterialUsage
                    .list("product.id = ?1", p.id);

            if (usages.isEmpty()) {
                continue; // não tem BOM → não pode produzir
            }

            // calcular o máximo possível
            int maxPossible = Integer.MAX_VALUE;

            for (MaterialUsage u : usages) {
                RawMaterial rm = u.rawMaterial;

                if (rm.availableStock <= 0 || u.consumptionPerUnit <= 0) {
                    maxPossible = 0;
                    break;
                }

                int possible = rm.availableStock / u.consumptionPerUnit;

                if (possible < maxPossible) {
                    maxPossible = possible;
                }
            }

            if (maxPossible > 0) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("productId", p.id);
                entry.put("name", p.name);
                entry.put("unitPrice", p.unitPrice);
                entry.put("maxQuantity", maxPossible);

                result.add(entry);
            }
        }

        // PRIORIDADE: ordenar pelo produto de maior valor
        return result.stream()
                .sorted((a, b) ->
                        Double.compare(
                                (double) b.get("unitPrice"),
                                (double) a.get("unitPrice")
                        )
                )
                .collect(Collectors.toList());
    }
}
