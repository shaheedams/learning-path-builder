package com.example.learningpath.config;

import com.example.learningpath.model.*;
import com.example.learningpath.repository.AvailableComponentRepository;
import com.example.learningpath.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.ArrayList;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private AvailableComponentRepository componentRepository;

    @Autowired
    private LearningPathRepository pathRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Available Components list
        if (componentRepository.count() == 0) {
            AvailableComponent mathAssessment = new AvailableComponent(
                "cmp-assess-math-1",
                "Math Module 1 Assessment",
                "Baseline math diagnostic used to route learners.",
                "assessment",
                35,
                100, 50, null
            );

            AvailableComponent mathEasy = new AvailableComponent(
                "cmp-unit-math-2-easy",
                "Math Module 2 - Easy",
                "Foundational math remediation unit.",
                "unit",
                35,
                null, null, 30
            );

            AvailableComponent mathAdvanced = new AvailableComponent(
                "cmp-unit-math-2-advanced",
                "Math Module 2 - Advanced",
                "Enriched algebraic application unit.",
                "unit",
                35,
                null, null, 30
            );

            AvailableComponent readingAssessment = new AvailableComponent(
                "cmp-assess-reading-1",
                "Reading Module 1 Assessment",
                "Diagnostic text parsing assessment.",
                "assessment",
                45,
                100, 60, null
            );

            AvailableComponent readingEasy = new AvailableComponent(
                "cmp-unit-reading-2-easy",
                "Reading Module 2 - Easy",
                "Vocabulary building and comprehension support.",
                "unit",
                40,
                null, null, 35
            );

            AvailableComponent readingAdvanced = new AvailableComponent(
                "cmp-unit-reading-2-advanced",
                "Reading Module 2 - Advanced",
                "Critical literary text analysis.",
                "unit",
                40,
                null, null, 35
            );

            componentRepository.saveAll(Arrays.asList(
                mathAssessment, mathEasy, mathAdvanced,
                readingAssessment, readingEasy, readingAdvanced
            ));
        }

        // 2. Seed a Sample Learning Path demonstrating conditional flows
        if (!pathRepository.existsById("lp-sample-flowchart")) {
            LearningPath path = new LearningPath();
            path.setId("lp-sample-flowchart");
            path.setName("SAT Math Adaptive Path");
            path.setDescription("Demonstrating score-based routing rules. Module 1 Assessment results route the student either to Easy or Advanced Module 2.");
            path.setStatus("draft");
            path.setVersion(1);
            path.setZoom(1.0);
            path.setOffsetX(0.0);
            path.setOffsetY(0.0);

            // Nodes definition
            PathNode startNode = new PathNode("start-node", "system-start", "start", "Start Assessment", "Entry point", 300.0, 50.0, null, null, null, null);
            PathNode reading1 = new PathNode("node-reading-1", "cmp-assess-reading-1", "assessment", "Reading Module 1 Assessment", "Diagnostic test for reading comprehension", 300.0, 180.0, 45, 100, 60, null);
            PathNode readingEasyNode = new PathNode("node-reading-2-easy", "cmp-unit-reading-2-easy", "unit", "Reading Module 2 - Easy", "Vocabulary building and support", 150.0, 310.0, 40, null, null, 35);
            PathNode readingAdvNode = new PathNode("node-reading-2-advanced", "cmp-unit-reading-2-advanced", "unit", "Reading Module 2 - Advanced", "Critical literary text analysis", 450.0, 310.0, 40, null, null, 35);
            PathNode math1 = new PathNode("node-math-1", "cmp-assess-math-1", "assessment", "Math Module 1 Assessment", "Diagnostic test", 300.0, 470.0, 35, 100, 50, null);
            PathNode easyNode = new PathNode("node-math-2-easy", "cmp-unit-math-2-easy", "unit", "Math Module 2 - Easy", "Remediation module", 150.0, 600.0, 35, null, null, 30);
            PathNode advNode = new PathNode("node-math-2-advanced", "cmp-unit-math-2-advanced", "unit", "Math Module 2 - Advanced", "Advanced algebra", 450.0, 600.0, 35, null, null, 30);
            PathNode endNode = new PathNode("end-node", "system-end", "end", "Complete Assessment", "Exit point", 300.0, 730.0, null, null, null, null);

            path.setNodes(new ArrayList<>(Arrays.asList(startNode, reading1, readingEasyNode, readingAdvNode, math1, easyNode, advNode, endNode)));

            // Edges definition
            PathEdge edgeStartToRead1 = new PathEdge("edge-start-to-read1", "start-node", "node-reading-1", "Start", 1, true, "AND", new ArrayList<>());
            
            // Reading Assessment to Easy Unit (score < 60)
            PathEdge edgeRead1ToEasy = new PathEdge("edge-read1-to-easy", "node-reading-1", "node-reading-2-easy", "Score Below 60", 1, false, "AND", new ArrayList<>());
            ConditionRule ruleReadLow = new ConditionRule("rule-read1-low", "assessment", "node-reading-1", "score_range", "between", null, null, null, 0.0, 59.0, true, true);
            edgeRead1ToEasy.getRules().add(ruleReadLow);

            // Reading Assessment to Advanced Unit (score >= 60)
            PathEdge edgeRead1ToAdv = new PathEdge("edge-read1-to-adv", "node-reading-1", "node-reading-2-advanced", "Score 60 or Above", 2, false, "AND", new ArrayList<>());
            ConditionRule ruleReadHigh = new ConditionRule("rule-read1-high", "assessment", "node-reading-1", "score", "gte", null, 60.0, null, null, null, null, null);
            edgeRead1ToAdv.getRules().add(ruleReadHigh);

            // Reading Units to Math Assessment
            PathEdge edgeReadEasyToMath1 = new PathEdge("edge-readeasy-to-math1", "node-reading-2-easy", "node-math-1", "Next", 1, true, "AND", new ArrayList<>());
            PathEdge edgeReadAdvToMath1 = new PathEdge("edge-readadv-to-math1", "node-reading-2-advanced", "node-math-1", "Next", 1, true, "AND", new ArrayList<>());

            // Math Assessment to Easy Unit (score < 50)
            PathEdge edgeMath1ToEasy = new PathEdge("edge-math1-to-easy", "node-math-1", "node-math-2-easy", "Score Below 50", 1, false, "AND", new ArrayList<>());
            ConditionRule ruleMathLow = new ConditionRule("rule-math1-low", "assessment", "node-math-1", "score_range", "between", null, null, null, 0.0, 49.0, true, true);
            edgeMath1ToEasy.getRules().add(ruleMathLow);

            // Math Assessment to Advanced Unit (score >= 50)
            PathEdge edgeMath1ToAdv = new PathEdge("edge-math1-to-adv", "node-math-1", "node-math-2-advanced", "Score 50 or Above", 2, false, "AND", new ArrayList<>());
            ConditionRule ruleMathHigh = new ConditionRule("rule-math1-high", "assessment", "node-math-1", "score", "gte", null, 50.0, null, null, null, null, null);
            edgeMath1ToAdv.getRules().add(ruleMathHigh);

            // Math Units to End Node
            PathEdge edgeMathEasyToEnd = new PathEdge("edge-matheasy-to-end", "node-math-2-easy", "end-node", "Finish", 1, true, "AND", new ArrayList<>());
            PathEdge edgeMathAdvToEnd = new PathEdge("edge-mathadv-to-end", "node-math-2-advanced", "end-node", "Finish", 1, true, "AND", new ArrayList<>());

            path.setEdges(new ArrayList<>(Arrays.asList(
                edgeStartToRead1, edgeRead1ToEasy, edgeRead1ToAdv, edgeReadEasyToMath1,
                edgeReadAdvToMath1, edgeMath1ToEasy, edgeMath1ToAdv, edgeMathEasyToEnd, edgeMathAdvToEnd
            )));

            pathRepository.save(path);
        }
    }
}
