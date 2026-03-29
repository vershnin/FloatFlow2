package com.floatflow.config;

import com.floatflow.entity.Branch;
import com.floatflow.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeding default branches if the table is empty.
 * This ensures we have some initial data (Nairobi, Mombasa, Kisumu) 
 * so that registrations don't fail early on.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final BranchRepository branchRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (branchRepository.count() == 0) {
            log.info("No branches found — seeding default branches...");

            branchRepository.save(Branch.builder()
                .name("Headquarters")
                .location("Nairobi")
                .build());

            branchRepository.save(Branch.builder()
                .name("Mombasa Branch")
                .location("Mombasa")
                .build());

            branchRepository.save(Branch.builder()
                .name("Kisumu Branch")
                .location("Kisumu")
                .build());

            log.info("Default branches seeded: IDs 1, 2, 3.");
        } else {
            log.info("Branches already exist — skipping seed. Count: {}",
                branchRepository.count());
        }
    }
}
