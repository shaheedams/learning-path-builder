package com.example.learningpath.service;

import com.example.learningpath.dto.*;
import com.example.learningpath.model.*;
import com.example.learningpath.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class LearningPathService {

    @Autowired
    private LearningPathRepository pathRepository;

    public List<LearningPathDTO> getAllLearningPaths() {
        return pathRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public LearningPathDTO getLearningPathById(String id) {
        LearningPath path = pathRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Learning path not found: " + id));
        return toDTO(path);
    }

    public LearningPathDTO saveLearningPath(LearningPathDTO dto) {
        LearningPath path;
        if (dto.getId() != null && pathRepository.existsById(dto.getId())) {
            // Update existing path in-place to avoid Hibernate collection replacement constraints
            path = pathRepository.findById(dto.getId()).get();
            path.setName(dto.getName());
            path.setDescription(dto.getDescription());
            path.setStatus(dto.getStatus());
            path.setVersion(dto.getVersion() != null ? dto.getVersion() : path.getVersion() + 1);
            
            if (dto.getCanvas() != null) {
                path.setZoom(dto.getCanvas().getZoom());
                path.setOffsetX(dto.getCanvas().getOffsetX());
                path.setOffsetY(dto.getCanvas().getOffsetY());
            }

            // Update nodes in-place to avoid Hibernate collection tracking issues with manual IDs
            List<PathNode> existingNodes = path.getNodes();
            List<LearningPathDTO.NodeDTO> dtoNodes = dto.getNodes() != null ? dto.getNodes() : new ArrayList<>();
            
            // 1. Remove nodes not present in DTO
            existingNodes.removeIf(node -> dtoNodes.stream().noneMatch(d -> d.getId().equals(node.getId())));
            
            // 2. Update existing nodes or add new ones
            for (LearningPathDTO.NodeDTO nodeDto : dtoNodes) {
                PathNode existing = existingNodes.stream()
                        .filter(n -> n.getId().equals(nodeDto.getId()))
                        .findFirst()
                        .orElse(null);
                
                if (existing != null) {
                    existing.setComponentId(nodeDto.getComponentId());
                    existing.setType(nodeDto.getType());
                    existing.setLabel(nodeDto.getLabel());
                    existing.setDescription(nodeDto.getDescription());
                    if (nodeDto.getPosition() != null) {
                        existing.setX(nodeDto.getPosition().getX());
                        existing.setY(nodeDto.getPosition().getY());
                    }
                    if (nodeDto.getConfig() != null) {
                        existing.setApproximateDurationMinutes(nodeDto.getConfig().getApproximateDurationMinutes());
                        if (nodeDto.getConfig().getAssessment() != null) {
                            existing.setMaxScore(nodeDto.getConfig().getAssessment().getMaxScore());
                            existing.setPassingScore(nodeDto.getConfig().getAssessment().getPassingScore());
                        } else {
                            existing.setMaxScore(null);
                            existing.setPassingScore(null);
                        }
                        if (nodeDto.getConfig().getUnit() != null) {
                            existing.setRecommendedMinutes(nodeDto.getConfig().getUnit().getRecommendedMinutes());
                        } else {
                            existing.setRecommendedMinutes(null);
                        }
                    } else {
                        existing.setApproximateDurationMinutes(null);
                        existing.setMaxScore(null);
                        existing.setPassingScore(null);
                        existing.setRecommendedMinutes(null);
                    }
                } else {
                    existingNodes.add(toNodeEntity(nodeDto));
                }
            }

            // Update edges in-place
            List<PathEdge> existingEdges = path.getEdges();
            List<LearningPathDTO.EdgeDTO> dtoEdges = dto.getEdges() != null ? dto.getEdges() : new ArrayList<>();
            
            // 1. Remove edges not present in DTO
            existingEdges.removeIf(edge -> dtoEdges.stream().noneMatch(d -> d.getId().equals(edge.getId())));
            
            // 2. Update existing edges or add new ones
            for (LearningPathDTO.EdgeDTO edgeDto : dtoEdges) {
                PathEdge existing = existingEdges.stream()
                        .filter(e -> e.getId().equals(edgeDto.getId()))
                        .findFirst()
                        .orElse(null);
                
                if (existing != null) {
                    existing.setSourceNodeId(edgeDto.getSourceNodeId());
                    existing.setTargetNodeId(edgeDto.getTargetNodeId());
                    existing.setLabel(edgeDto.getLabel());
                    existing.setPriority(edgeDto.getPriority() != null ? edgeDto.getPriority() : 1);
                    existing.setIsDefault(edgeDto.getIsDefault() != null ? edgeDto.getIsDefault() : false);
                    
                    if (edgeDto.getConditions() != null) {
                        existing.setOperator(edgeDto.getConditions().getOperator());
                        
                        List<ConditionRule> existingRules = existing.getRules();
                        List<LearningPathDTO.RuleDTO> dtoRules = edgeDto.getConditions().getRules();
                        
                        if (dtoRules == null) {
                            existingRules.clear();
                        } else {
                            // Remove rules not present in DTO
                            existingRules.removeIf(rule -> dtoRules.stream().noneMatch(d -> d.getId() != null && d.getId().equals(rule.getId())));
                            
                            for (LearningPathDTO.RuleDTO ruleDto : dtoRules) {
                                ConditionRule existingRule = existingRules.stream()
                                        .filter(r -> ruleDto.getId() != null && r.getId().equals(ruleDto.getId()))
                                        .findFirst()
                                        .orElse(null);
                                        
                                if (existingRule != null) {
                                    existingRule.setSourceType(ruleDto.getSourceType());
                                    existingRule.setSourceNodeId(ruleDto.getSourceNodeId());
                                    existingRule.setMetric(ruleDto.getMetric());
                                    existingRule.setOperator(ruleDto.getOperator());
                                    
                                    existingRule.setValueBoolean(null);
                                    existingRule.setValueNumber(null);
                                    existingRule.setValueString(null);
                                    if (ruleDto.getValue() instanceof Boolean) {
                                        existingRule.setValueBoolean((Boolean) ruleDto.getValue());
                                    } else if (ruleDto.getValue() instanceof Number) {
                                        existingRule.setValueNumber(((Number) ruleDto.getValue()).doubleValue());
                                    } else if (ruleDto.getValue() instanceof String) {
                                        existingRule.setValueString((String) ruleDto.getValue());
                                    }
                                    
                                    if (ruleDto.getRange() != null) {
                                        existingRule.setRangeMin(ruleDto.getRange().getMin());
                                        existingRule.setRangeMax(ruleDto.getRange().getMax());
                                        existingRule.setRangeMinInclusive(ruleDto.getRange().getMinInclusive() != null ? ruleDto.getRange().getMinInclusive() : true);
                                        existingRule.setRangeMaxInclusive(ruleDto.getRange().getMaxInclusive() != null ? ruleDto.getRange().getMaxInclusive() : true);
                                    } else {
                                        existingRule.setRangeMin(null);
                                        existingRule.setRangeMax(null);
                                        existingRule.setRangeMinInclusive(null);
                                        existingRule.setRangeMaxInclusive(null);
                                    }
                                } else {
                                    ConditionRule newRule = new ConditionRule();
                                    newRule.setId(ruleDto.getId() != null ? ruleDto.getId() : java.util.UUID.randomUUID().toString());
                                    newRule.setSourceType(ruleDto.getSourceType());
                                    newRule.setSourceNodeId(ruleDto.getSourceNodeId());
                                    newRule.setMetric(ruleDto.getMetric());
                                    newRule.setOperator(ruleDto.getOperator());
                                    
                                    if (ruleDto.getValue() instanceof Boolean) {
                                        newRule.setValueBoolean((Boolean) ruleDto.getValue());
                                    } else if (ruleDto.getValue() instanceof Number) {
                                        newRule.setValueNumber(((Number) ruleDto.getValue()).doubleValue());
                                    } else if (ruleDto.getValue() instanceof String) {
                                        newRule.setValueString((String) ruleDto.getValue());
                                    }
                                    
                                    if (ruleDto.getRange() != null) {
                                        newRule.setRangeMin(ruleDto.getRange().getMin());
                                        newRule.setRangeMax(ruleDto.getRange().getMax());
                                        newRule.setRangeMinInclusive(ruleDto.getRange().getMinInclusive() != null ? ruleDto.getRange().getMinInclusive() : true);
                                        newRule.setRangeMaxInclusive(ruleDto.getRange().getMaxInclusive() != null ? ruleDto.getRange().getMaxInclusive() : true);
                                    }
                                    existingRules.add(newRule);
                                }
                            }
                        }
                    } else {
                        existing.setOperator(null);
                        existing.getRules().clear();
                    }
                } else {
                    existingEdges.add(toEdgeEntity(edgeDto));
                }
            }
        } else {
            // Create new path
            path = toEntity(dto);
        }
        LearningPath saved = pathRepository.save(path);
        return toDTO(saved);
    }

    // --- MAPPER METHODS ---

    private LearningPathDTO toDTO(LearningPath entity) {
        LearningPathDTO dto = new LearningPathDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setVersion(entity.getVersion());
        
        dto.setCanvas(new LearningPathDTO.CanvasStateDTO(
            entity.getZoom(), entity.getOffsetX(), entity.getOffsetY()
        ));
        
        dto.setNodes(entity.getNodes().stream().map(node -> {
            LearningPathDTO.NodeDTO nodeDto = new LearningPathDTO.NodeDTO();
            nodeDto.setId(node.getId());
            nodeDto.setComponentId(node.getComponentId());
            nodeDto.setType(node.getType());
            nodeDto.setLabel(node.getLabel());
            nodeDto.setDescription(node.getDescription());
            nodeDto.setPosition(new LearningPathDTO.PositionDTO(node.getX(), node.getY()));
            
            LearningPathDTO.NodeConfigDTO config = new LearningPathDTO.NodeConfigDTO();
            config.setApproximateDurationMinutes(node.getApproximateDurationMinutes());
            
            if ("assessment".equals(node.getType()) && node.getMaxScore() != null) {
                config.setAssessment(new LearningPathDTO.AssessmentConfigDTO(
                    node.getMaxScore(), node.getPassingScore()
                ));
            }
            if ("unit".equals(node.getType()) && node.getRecommendedMinutes() != null) {
                config.setUnit(new LearningPathDTO.UnitConfigDTO(
                    node.getRecommendedMinutes()
                ));
            }
            nodeDto.setConfig(config);
            return nodeDto;
        }).collect(Collectors.toList()));
        
        dto.setEdges(entity.getEdges().stream().map(edge -> {
            LearningPathDTO.EdgeDTO edgeDto = new LearningPathDTO.EdgeDTO();
            edgeDto.setId(edge.getId());
            edgeDto.setSourceNodeId(edge.getSourceNodeId());
            edgeDto.setTargetNodeId(edge.getTargetNodeId());
            edgeDto.setLabel(edge.getLabel());
            edgeDto.setPriority(edge.getPriority());
            edgeDto.setIsDefault(edge.getIsDefault());
            
            LearningPathDTO.ConditionsDTO conditions = new LearningPathDTO.ConditionsDTO();
            conditions.setOperator(edge.getOperator());
            
            conditions.setRules(edge.getRules().stream().map(rule -> {
                LearningPathDTO.RuleDTO ruleDto = new LearningPathDTO.RuleDTO();
                ruleDto.setId(rule.getId());
                ruleDto.setSourceType(rule.getSourceType());
                ruleDto.setSourceNodeId(rule.getSourceNodeId());
                ruleDto.setMetric(rule.getMetric());
                ruleDto.setOperator(rule.getOperator());
                
                // Polymorphic values mapping
                if (rule.getValueBoolean() != null) {
                    ruleDto.setValue(rule.getValueBoolean());
                } else if (rule.getValueNumber() != null) {
                    ruleDto.setValue(rule.getValueNumber());
                } else if (rule.getValueString() != null) {
                    ruleDto.setValue(rule.getValueString());
                }
                
                if (rule.getRangeMin() != null && rule.getRangeMax() != null) {
                    ruleDto.setRange(new LearningPathDTO.RangeDTO(
                        rule.getRangeMin(), rule.getRangeMax(),
                        rule.getRangeMinInclusive(), rule.getRangeMaxInclusive()
                    ));
                }
                return ruleDto;
            }).collect(Collectors.toList()));
            
            edgeDto.setConditions(conditions);
            return edgeDto;
        }).collect(Collectors.toList()));
        
        return dto;
    }

    private LearningPath toEntity(LearningPathDTO dto) {
        LearningPath entity = new LearningPath();
        entity.setId(dto.getId() != null ? dto.getId() : java.util.UUID.randomUUID().toString());
        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());
        entity.setStatus(dto.getStatus());
        entity.setVersion(dto.getVersion() != null ? dto.getVersion() : 1);
        
        if (dto.getCanvas() != null) {
            entity.setZoom(dto.getCanvas().getZoom());
            entity.setOffsetX(dto.getCanvas().getOffsetX());
            entity.setOffsetY(dto.getCanvas().getOffsetY());
        } else {
            entity.setZoom(1.0);
            entity.setOffsetX(0.0);
            entity.setOffsetY(0.0);
        }
        
        entity.setNodes(dto.getNodes().stream().map(this::toNodeEntity).collect(Collectors.toList()));
        entity.setEdges(dto.getEdges().stream().map(this::toEdgeEntity).collect(Collectors.toList()));
        
        return entity;
    }

    private PathNode toNodeEntity(LearningPathDTO.NodeDTO n) {
        PathNode node = new PathNode();
        node.setId(n.getId());
        node.setComponentId(n.getComponentId());
        node.setType(n.getType());
        node.setLabel(n.getLabel());
        node.setDescription(n.getDescription());
        
        if (n.getPosition() != null) {
            node.setX(n.getPosition().getX());
            node.setY(n.getPosition().getY());
        }
        
        if (n.getConfig() != null) {
            node.setApproximateDurationMinutes(n.getConfig().getApproximateDurationMinutes());
            if (n.getConfig().getAssessment() != null) {
                node.setMaxScore(n.getConfig().getAssessment().getMaxScore());
                node.setPassingScore(n.getConfig().getAssessment().getPassingScore());
            }
            if (n.getConfig().getUnit() != null) {
                node.setRecommendedMinutes(n.getConfig().getUnit().getRecommendedMinutes());
            }
        }
        return node;
    }

    private PathEdge toEdgeEntity(LearningPathDTO.EdgeDTO e) {
        PathEdge edge = new PathEdge();
        edge.setId(e.getId());
        edge.setSourceNodeId(e.getSourceNodeId());
        edge.setTargetNodeId(e.getTargetNodeId());
        edge.setLabel(e.getLabel());
        edge.setPriority(e.getPriority() != null ? e.getPriority() : 1);
        edge.setIsDefault(e.getIsDefault() != null ? e.getIsDefault() : false);
        
        if (e.getConditions() != null) {
            edge.setOperator(e.getConditions().getOperator());
            
            List<ConditionRule> rules = new ArrayList<>();
            if (e.getConditions().getRules() != null) {
                rules = e.getConditions().getRules().stream().map(r -> {
                    ConditionRule rule = new ConditionRule();
                    rule.setId(r.getId() != null ? r.getId() : java.util.UUID.randomUUID().toString());
                    rule.setSourceType(r.getSourceType());
                    rule.setSourceNodeId(r.getSourceNodeId());
                    rule.setMetric(r.getMetric());
                    rule.setOperator(r.getOperator());
                    
                    // Polymorphic mapping
                    if (r.getValue() instanceof Boolean) {
                        rule.setValueBoolean((Boolean) r.getValue());
                    } else if (r.getValue() instanceof Number) {
                        rule.setValueNumber(((Number) r.getValue()).doubleValue());
                    } else if (r.getValue() instanceof String) {
                        rule.setValueString((String) r.getValue());
                    }
                    
                    if (r.getRange() != null) {
                        rule.setRangeMin(r.getRange().getMin());
                        rule.setRangeMax(r.getRange().getMax());
                        rule.setRangeMinInclusive(r.getRange().getMinInclusive() != null ? r.getRange().getMinInclusive() : true);
                        rule.setRangeMaxInclusive(r.getRange().getMaxInclusive() != null ? r.getRange().getMaxInclusive() : true);
                    }
                    return rule;
                }).collect(Collectors.toList());
            }
            edge.setRules(rules);
        }
        return edge;
    }
}
