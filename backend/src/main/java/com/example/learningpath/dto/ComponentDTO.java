package com.example.learningpath.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDTO {
    private String id;
    private String title;
    private String shortDescription;
    private String type; // "unit" or "assessment"
    private Integer approximateDurationMinutes;
    private MetadataDTO metadata;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetadataDTO {
        private AssessmentMetadataDTO assessment;
        private UnitMetadataDTO unit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssessmentMetadataDTO {
        private Integer maxScore;
        private Integer passingScore;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UnitMetadataDTO {
        private Integer recommendedMinutes;
    }
}
