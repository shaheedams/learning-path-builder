package com.example.learningpath.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "available_components")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailableComponent {
    @Id
    private String id;
    private String title;
    private String shortDescription;
    private String type; // "unit" or "assessment"
    private Integer approximateDurationMinutes;
    
    // Metadata fields flattened
    private Integer maxScore;
    private Integer passingScore;
    private Integer recommendedMinutes;
}
