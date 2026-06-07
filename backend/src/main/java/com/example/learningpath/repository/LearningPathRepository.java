package com.example.learningpath.repository;

import com.example.learningpath.model.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, String> {
}
