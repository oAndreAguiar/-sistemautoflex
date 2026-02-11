package org.acme.inventory.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Column;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(indexes = {
    @Index(columnList = "product_id"),
    @Index(columnList = "rawMaterial_id")
})
public class MaterialUsage extends PanacheEntity {

    @ManyToOne(optional = false)
    public Product product;

    @ManyToOne(optional = false)
    public RawMaterial rawMaterial;

    @Column(nullable = false)
    public Integer consumptionPerUnit;
}
