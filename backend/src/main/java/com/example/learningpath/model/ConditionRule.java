package com.example.learningpath.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "condition_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConditionRule {
    @Id
    private String id;
    
    private String sourceType; // "assessment" or "unit"
    private String sourceNodeId;
    private String metric; // "completion", "passed", "score", "score_range", etc.
    private String operator; // "eq", "ne", "gt", "gte", "lt", "lte", "between"
    
    // Flattened polymorphic value types
    private Boolean valueBoolean;
    private Double valueNumber;
    private String valueString;
    
    // Flattened range values
    private Double rangeMin;
    private Double rangeMax;
    private Boolean rangeMinInclusive;
    private Boolean rangeMaxInclusive;
}
