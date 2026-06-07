package com.example.learningpath.controller;

import com.example.learningpath.dto.ComponentDTO;
import com.example.learningpath.dto.ComponentListDTO;
import com.example.learningpath.model.AvailableComponent;
import com.example.learningpath.repository.AvailableComponentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/components")
@CrossOrigin(origins = "*")
public class ComponentController {

    @Autowired
    private AvailableComponentRepository componentRepository;

    @GetMapping
    public ComponentListDTO getComponents() {
        List<AvailableComponent> components = componentRepository.findAll();
        
        List<ComponentDTO> dtos = components.stream().map(c -> {
            ComponentDTO dto = new ComponentDTO();
            dto.setId(c.getId());
            dto.setTitle(c.getTitle());
            dto.setShortDescription(c.getShortDescription());
            dto.setType(c.getType());
            dto.setApproximateDurationMinutes(c.getApproximateDurationMinutes());
            
            ComponentDTO.MetadataDTO metadata = new ComponentDTO.MetadataDTO();
            if ("assessment".equalsIgnoreCase(c.getType())) {
                metadata.setAssessment(new ComponentDTO.AssessmentMetadataDTO(
                    c.getMaxScore(), c.getPassingScore()
                ));
            } else {
                metadata.setUnit(new ComponentDTO.UnitMetadataDTO(
                    c.getRecommendedMinutes()
                ));
            }
            dto.setMetadata(metadata);
            return dto;
        }).collect(Collectors.toList());

        return new ComponentListDTO(dtos, dtos.size());
    }
}
