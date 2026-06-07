package com.example.learningpath.repository;

import com.example.learningpath.model.AvailableComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AvailableComponentRepository extends JpaRepository<AvailableComponent, String> {
}
