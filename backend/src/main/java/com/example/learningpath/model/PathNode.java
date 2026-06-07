package com.example.learningpath.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "path_nodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathNode {
    @Id
    private String id;

    private String componentId;
    private String type; // "start", "unit", "assessment", "end"
    private String label;
    private String description;

    // Coordinates
    private Double x;
    private Double y;

    // Configuration properties
    private Integer approximateDurationMinutes;
    private Integer maxScore;
    private Integer passingScore;
    private Integer recommendedMinutes;
}
