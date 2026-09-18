package com.sliit.vehiclerental.accesscontrol.security;

import com.sliit.vehiclerental.accesscontrol.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final String roleName;
    private final Set<String> permissionCodes;
    private final boolean active;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.roleName = user.getRole().getName().name();
        this.permissionCodes = user.getRole().getPermissions().stream()
                .map(p -> p.getCode())
                .collect(Collectors.toSet());
        this.active = user.getStatus().name().equals("ACTIVE");
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // ROLE_ prefix for Spring Security role checks, plus one authority
        // per fine-grained permission so @PreAuthorize("hasAuthority('X')")
        // also works if a teammate prefers that style.
        return java.util.stream.Stream.concat(
                java.util.stream.Stream.of(new SimpleGrantedAuthority("ROLE_" + roleName)),
                permissionCodes.stream().map(SimpleGrantedAuthority::new)
        ).collect(Collectors.toList());
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return active; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }
}
