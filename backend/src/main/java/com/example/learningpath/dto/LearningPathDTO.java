package com.example.learningpath.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPathDTO {
    private String id;
    
    @NotEmpty(message = "Name is required")
    private String name;
    
    private String description;
    
    @NotEmpty(message = "Status is required")
    private String status; // "draft" or "published"
    
    private Integer version;
    private CanvasStateDTO canvas;
    
    @NotNull(message = "Nodes list cannot be null")
    private List<NodeDTO> nodes;
    
    @NotNull(message = "Edges list cannot be null")
    private List<EdgeDTO> edges;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CanvasStateDTO {
        private Double zoom;
        private Double offsetX;
        private Double offsetY;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeDTO {
        @NotEmpty(message = "Node ID is required")
        private String id;
        
        @NotEmpty(message = "Node componentId is required")
        private String componentId;
        
        @NotEmpty(message = "Node type is required")
        private String type; // "start", "unit", "assessment", "end"
        
        @NotEmpty(message = "Node label is required")
        private String label;
        
        private String description;
        
        @NotNull(message = "Node position is required")
        private PositionDTO position;
        
        private NodeConfigDTO config;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PositionDTO {
        @NotNull
        private Double x;
        @NotNull
        private Double y;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeConfigDTO {
        private Integer approximateDurationMinutes;
        private AssessmentConfigDTO assessment;
        private UnitConfigDTO unit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitConfigDTO {
        private Integer recommendedMinutes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessmentConfigDTO {
        @NotNull
        private Integer maxScore;
        @NotNull
        private Integer passingScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EdgeDTO {
        @NotEmpty(message = "Edge ID is required")
        private String id;
        
        @NotEmpty(message = "Edge sourceNodeId is required")
        private String sourceNodeId;
        
        @NotEmpty(message = "Edge targetNodeId is required")
        private String targetNodeId;
        
        private String label;
        private Integer priority;
        private Boolean isDefault;
        
        @NotNull(message = "Edge conditions is required")
        private ConditionsDTO conditions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConditionsDTO {
        @NotEmpty(message = "Conditions operator is required")
        private String operator; // "AND" or "OR"
        private List<RuleDTO> rules;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RuleDTO {
        @NotEmpty(message = "Rule ID is required")
        private String id;
        
        @NotEmpty(message = "Rule sourceType is required")
        private String sourceType; // "assessment" or "unit"
        
        @NotEmpty(message = "Rule sourceNodeId is required")
        private String sourceNodeId;
        
        @NotEmpty(message = "Rule metric is required")
        private String metric;
        
        @NotEmpty(message = "Rule operator is required")
        private String operator; // "eq", "gte", "between", etc.
        
        private Object value; // Can be Boolean, Number, or String
        private RangeDTO range;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RangeDTO {
        @NotNull
        private Double min;
        @NotNull
        private Double max;
        private Boolean minInclusive;
        private Boolean maxInclusive;
    }
}
