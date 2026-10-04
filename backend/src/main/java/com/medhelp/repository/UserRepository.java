package com.medhelp.repository;

import com.medhelp.domain.entity.User;
import com.medhelp.domain.enums.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Patient lookup used by the doctor's "find a patient" screen.
     *
     * <p>Only minimal identifying data is matched. Records themselves are never
     * reachable without an approved access grant, so search results reveal
     * nothing medical.
     */
    @Query("""
            select u from User u
            where u.role = :role
              and (lower(u.fullName) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%')))
            order by u.fullName asc
            """)
    List<User> searchByRoleAndQuery(@Param("role") Role role, @Param("q") String query, Pageable pageable);
}
