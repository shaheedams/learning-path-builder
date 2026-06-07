package com.example.learningpath.controller;

import com.example.learningpath.dto.LearningPathDTO;
import com.example.learningpath.service.LearningPathService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/learning-paths")
@CrossOrigin(origins = "*")
public class LearningPathController {

    @Autowired
    private LearningPathService pathService;



    @GetMapping
    public List<LearningPathDTO> getAllLearningPaths() {
        return pathService.getAllLearningPaths();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPathDTO> getLearningPathById(@PathVariable String id) {
        try {
            LearningPathDTO dto = pathService.getLearningPathById(id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping
    public ResponseEntity<LearningPathDTO> saveLearningPath(@Valid @RequestBody LearningPathDTO dto) {
        try {
            LearningPathDTO saved = pathService.saveLearningPath(dto);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
