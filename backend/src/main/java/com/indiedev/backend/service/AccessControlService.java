/* Checks that the acting account exists, is in good standing, and has the role a use case requires.
 * Fan, Artist, and Admin use cases each call requireRole before doing any work.
 */

package com.indiedev.backend.service;

import com.indiedev.backend.model.Role;
import com.indiedev.backend.model.UserAccount;
import com.indiedev.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessControlService {

    private final UserAccountRepository userAccountRepository;

    public AccessControlService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount requireRole(Long userId, Role requiredRole) {
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sign in to continue");
        }
        UserAccount account = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown account"));
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account is " + account.getStatus().name().toLowerCase());
        }
        if (account.getRole() != requiredRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only " + requiredRole.name().toLowerCase() + " accounts can do this");
        }
        return account;
    }

}
