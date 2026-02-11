package org.acme.inventory.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "raw_material",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_raw_material_code", columnNames = "code"),
        @UniqueConstraint(name = "uk_raw_material_description", columnNames = "description")
    }
)
public class RawMaterial extends PanacheEntity {

    @Column(nullable = false, unique = true, length = 50)
    public String code;

    @Column(nullable = false, unique = true, length = 150)
    public String description;

    @Column(nullable = false)
    public Integer availableStock;
}
