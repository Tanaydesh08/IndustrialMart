
package com.IndustrialMart.Backend.config;

import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!test")
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_BOOTSTRAP_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_BOOTSTRAP_PASSWORD:}")
    private String adminPassword;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            return;
        }

        if (adminPassword.length() < 12) {
            throw new IllegalStateException(
                    "ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters."
            );
        }

        String normalizedEmail = adminEmail.trim().toLowerCase(
                java.util.Locale.ROOT
        );

        // Never overwrite or automatically promote an existing account.
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }

        User admin = new User(
                "Industrial Mart Admin",
                normalizedEmail,
                passwordEncoder.encode(adminPassword),
                UserRole.ADMIN
        );

        userRepository.save(admin);
    }
}
