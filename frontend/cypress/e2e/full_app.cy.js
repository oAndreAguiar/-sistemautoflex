describe("Inventory app - full E2E", () => {
  const api = "http://localhost:8080";

  function unique(prefix) {
    return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  // Confirma delete por modal (botão) OU confirm() do browser
  function confirmDeleteIfNeeded() {
    // registra confirm sempre ANTES de qualquer ação que possa disparar confirm()
    cy.on("window:confirm", () => true);

    // se tiver modal custom, clica nele
    cy.get("body").then(($body) => {
      const hasModalConfirm =
        $body.find('button:contains("Yes, delete")').length > 0;

      if (hasModalConfirm) {
        cy.contains("button", "Yes, delete").click();
      }
    });
  }

  it("creates product + raw material, links BOM, checks production, blocks linked RM delete, deletes product cascade, then deletes RM", () => {
    const productCode = unique("PRD");
    const productName = unique("Product ");
    const rmCode = unique("RM");
    const rmDesc = unique("Raw ");

    let productId;
    let rawMaterialId;

    // valida os DELETE reais que a UI faz
    cy.intercept("DELETE", "**/products/*").as("uiDeleteProduct");
    cy.intercept("DELETE", "**/raw-materials/*").as("uiDeleteRM");

    // cria produto
    cy.request("POST", `${api}/products`, {
      code: productCode,
      name: productName,
      unitPrice: 10.0,
    }).then((res) => {
      expect(res.status).to.eq(201);
      productId = res.body.id;
      expect(productId).to.be.a("number");
    });

    // cria matéria prima
    cy.request("POST", `${api}/raw-materials`, {
      code: rmCode,
      description: rmDesc,
      availableStock: 10,
    }).then((res) => {
      expect(res.status).to.eq(201);
      rawMaterialId = res.body.id;
      expect(rawMaterialId).to.be.a("number");
    });

    // cria vínculo (BOM / material usage)
    // (não precisamos guardar usageId aqui, porque o produto será deletado em cascade)
    cy.then(() => {
      return cy.request("POST", `${api}/material-usage`, {
        productId,
        rawMaterialId,
        quantity: 2,
        consumptionPerUnit: 2,
      });
    }).then((res) => {
      expect([200, 201]).to.include(res.status);
    });

    // UI - Products
    cy.visit("/products");
    cy.contains("h2", "Products").should("be.visible");
    cy.get('input[placeholder="Search..."]').clear().type(productCode);
    cy.get("table").should("contain", productCode);
    cy.get("table").should("contain", productName);

    // UI - Raw materials
    cy.contains("a", "Raw materials").click();
    cy.contains("h2", "Raw materials").should("be.visible");
    cy.get('input[placeholder="Search..."]').clear().type(rmCode);
    cy.get("table").should("contain", rmCode);
    cy.get("table").should("contain", rmDesc);

    // tenta deletar RM linkado -> deve bloquear
    cy.contains("td", rmCode)
      .parents("tr")
      .within(() => {
        cy.contains("button", "Delete").click();
      });

    cy.contains(/linked to|Remove it from BOM|linked/i).should("be.visible");

    // UI - Production
    cy.contains("a", "Production").click();
    cy.contains("h2", "Production priority").should("be.visible");
    cy.contains(productName).should("be.visible");

    cy.contains(productName)
      .parents("tr")
      .within(() => {
        cy.get("input").clear().type("3");
        cy.contains("button", "Produce").click();
      });

    cy.reload();
    cy.contains("h2", "Production priority").should("be.visible");
    cy.contains(productName).should("be.visible");

    // delete product (cascade)
    cy.contains("a", "Products").click();
    cy.contains("h2", "Products").should("be.visible");
    cy.get('input[placeholder="Search..."]').clear().type(productCode);

    cy.contains("td", productCode)
      .parents("tr")
      .within(() => {
        cy.contains("button", "Delete").click();
      });

    confirmDeleteIfNeeded();

    // valida que a UI realmente fez DELETE e ele foi OK
    cy.wait("@uiDeleteProduct")
      .its("response.statusCode")
      .should("be.oneOf", [200, 204]);

    // assert mais estável do que contains(...).should('not.exist')
    cy.get("table").should("not.contain", productCode);

    // como já deletou via UI, zera para não tentar novamente em cleanup
    productId = null;

    // agora RM não está mais linkado -> pode deletar
    cy.contains("a", "Raw materials").click();
    cy.contains("h2", "Raw materials").should("be.visible");
    cy.get('input[placeholder="Search..."]').clear().type(rmCode);

    cy.contains("td", rmCode)
      .parents("tr")
      .within(() => {
        cy.contains("button", "Delete").click();
      });

    confirmDeleteIfNeeded();

    cy.wait("@uiDeleteRM")
      .its("response.statusCode")
      .should("be.oneOf", [200, 204]);

    cy.get("table").should("not.contain", rmCode);

    rawMaterialId = null;

    // cleanup final somente se algo ficou pendente (evita log vermelho 404)
    cy.then(() => {
      const tasks = [];

      if (productId) {
        tasks.push(
          cy.request({
            method: "DELETE",
            url: `${api}/products/${productId}`,
            failOnStatusCode: false,
          })
        );
      }

      if (rawMaterialId) {
        tasks.push(
          cy.request({
            method: "DELETE",
            url: `${api}/raw-materials/${rawMaterialId}`,
            failOnStatusCode: false,
          })
        );
      }

      // se não tem tasks, não faz nada
      if (!tasks.length) return;

      return cy.wrap(Promise.all(tasks));
    });
  });
});
