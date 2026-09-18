package com.sliit.vehiclerental.accesscontrol.security;

import com.sliit.vehiclerental.accesscontrol.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates the JWT on every request and populates the SecurityContext.
 * This is the single choke point every module's requests pass through -
 * "User Action -> Authenticated -> Authorized (see PermissionAspect) -> Logged".
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.isTokenValid(token)) {
                String email = jwtUtil.extractEmail(token);

                userRepository.findByEmail(email).ifPresent(user -> {
                    if (user.getStatus().name().equals("ACTIVE")) {
                        UserPrincipal principal = new UserPrincipal(user);
                        var authToken = new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                });
            }
        }

        filterChain.doFilter(request, response);
    }
}
