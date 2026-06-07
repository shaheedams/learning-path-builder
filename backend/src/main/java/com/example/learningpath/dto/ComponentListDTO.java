package com.example.learningpath.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentListDTO {
    private List<ComponentDTO> items;
    private Integer totalCount;
}
