package com.example.learningpath.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "path_edges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PathEdge {
    @Id
    private String id;
    
    private String sourceNodeId;
    private String targetNodeId;
    private String label;
    private Integer priority;
    private Boolean isDefault;
    
    private String operator; // "AND" or "OR"
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "edge_id")
    private List<ConditionRule> rules = new ArrayList<>();
}
