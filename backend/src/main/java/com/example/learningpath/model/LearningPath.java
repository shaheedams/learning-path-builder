package com.example.learningpath.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "learning_paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPath {
    @Id
    private String id;
    
    private String name;
    private String description;
    private String status; // "draft" or "published"
    private Integer version;
    
    // Canvas Pan/Zoom state
    private Double zoom;
    private Double offsetX;
    private Double offsetY;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "learning_path_id")
    private List<PathNode> nodes = new ArrayList<>();
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "learning_path_id")
    private List<PathEdge> edges = new ArrayList<>();
}
