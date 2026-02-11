package org.acme.inventory.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "product",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_product_code", columnNames = "code"),
        @UniqueConstraint(name = "uk_product_name", columnNames = "name")
    }
)
public class Product extends PanacheEntity {

    @Column(nullable = false, unique = true, length = 50)
    public String code;

    @Column(nullable = false, unique = true, length = 120)
    public String name;

    @Column(nullable = false)
    public Double unitPrice;
}